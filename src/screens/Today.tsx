import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { useStore, trialDay } from '../state/store';
import { useDay } from '../state/day';
import { missingSlots, pickLooks, signature } from '../engine';
import type { WindowSummary } from '../types';
import { Scene, confettiFrom } from '../components/Scene';
import { LookDeck } from '../components/Look';
import { Icon } from '../components/Icon';
import { WeatherGlyph, glyphForHour, glyphForMood } from '../components/WeatherGlyph';
import { degFor, isStandalone, timeOf } from './format';
import { PaywallSheet, InstallSheet } from './Sheets';

const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;
const INSTALL_KEY = 'wm-hide-install';
const installHidden = () => { try { return localStorage.getItem(INSTALL_KEY) === '1'; } catch { return false; } };
const press = (key: 'ArrowLeft' | 'ArrowRight') =>
  document.querySelector<HTMLElement>('.deck')?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));

/** Count up to a number once, quickly, the first time it appears. */
function useCountUp(target: number, ms = 750): number {
  const [v, setV] = useState(target);
  const first = useRef(true);
  useEffect(() => {
    if (!first.current || matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(target); return; }
    first.current = false;
    const from = target - 12, t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      setV(Math.round(from + (target - from) * (1 - (1 - k) ** 3)));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function CountUp({ value, fmt, className }: { value: number; fmt: (n: number) => string; className: string }) {
  return <span className={className} aria-hidden="true">{fmt(useCountUp(value))}</span>;
}

export function Today() {
  const { s, d } = useStore();
  const { tomorrow, dayIso, forecast, summary, stale, mood, now } = useDay();
  const [kept, setKept] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [round, setRound] = useState(0);
  const [justWorn, setJustWorn] = useState(false);
  const [paywall, setPaywall] = useState(true);
  const [plans, setPlans] = useState(false);
  const [install, setInstall] = useState(false);
  const [hideInstall, setHideInstall] = useState(installHidden);
  const deg = degFor(s.units);

  const recent = s.worn.filter((w) => w.date !== s.isoToday).map((w) => [...w.ids].sort().join('+'));
  const looks = useMemo(
    () => (summary
      ? pickLooks({
          closet: s.closet, summary, today: dayIso, pairWeights: s.pairWeights, recentOutfits: recent,
          taste: s.taste, prior: s.prior, evidence: s.tasteEvidence,
        }, { locked: kept, n: 6 })
      : []),
    // Taste is applied to the next deck, not mid-swipe, so the card under your thumb doesn't jump.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [s.closet, summary, dayIso, kept, round],
  );

  const wornToday = s.worn.find((w) => w.date === s.isoToday);
  const wornSig = wornToday ? [...wornToday.ids].sort().join('+') : undefined;
  useEffect(() => {
    if (!wornSig) return;
    const i = looks.findIndex((o) => signature(o.items) === wornSig);
    if (i >= 0) setIndex(i);
  }, [looks, wornSig]);

  const day = trialDay(s);
  const expired = !s.subscribed && day !== null && day >= 8;
  const missing = missingSlots(s.closet.filter((i) => i.status === 'available'));
  const look = looks[index];
  const lookSig = look ? signature(look.items) : '';
  const isWorn = !!look && lookSig === wornSig;
  const isLoved = s.loved.includes(lookSig);
  const showDeck = !expired && !missing.length && !!summary && looks.length > 0;

  const signal = (sg: 'skip' | 'love' | 'wear') => {
    if (!look) return;
    d({ type: 'feedback', signal: sg, ids: look.items.map((i) => i.id), features: look.features, quiet: sg !== 'love' });
  };
  const wear = (e: MouseEvent<HTMLButtonElement>) => {
    if (!look) return;
    const r = e.currentTarget.getBoundingClientRect();
    const css = getComputedStyle(e.currentTarget.closest('.app') ?? document.body);
    confettiFrom(r.left + r.width / 2, r.top, [css.getPropertyValue('--m1'), css.getPropertyValue('--m2'), '#ff3d7f', '#ffffff', '#15161a', ...look.items.map((i) => i.color)]);
    d({ type: 'wear', ids: look.items.map((i) => i.id) });
    signal('wear');
    setJustWorn(true);
    window.setTimeout(() => setJustWorn(false), 1700);
  };

  return (
    <main className={`screen has-tabs today${showDeck ? ' has-dock' : ''}`}>
      <Scene mood={mood} />

      {!summary || !forecast ? (
        <section className="empty-state" aria-live="polite">
          <WeatherGlyph kind="partly" />
          {!s.coords && !s.place ? (
            <>
              <h1 className="t-display">Where are you today?</h1>
              <p className="t-body">We need your city to read the sky.</p>
              <button className="btn primary" onClick={() => d({ type: 'go', route: 'settings' })}>Set my city</button>
            </>
          ) : s.offline ? (
            <>
              <h1 className="t-display">You’re offline</h1>
              <p className="t-body">Connect once to get the forecast for {s.place || 'your area'}.</p>
            </>
          ) : (
            <p className="working"><span className="spinner" aria-hidden="true" /> Reading the sky over {s.place || 'your area'}…</p>
          )}
        </section>
      ) : (
        <header aria-labelledby="verdict">
          <span className="place-pill"><Icon name="pin" size={16} duo /> {forecast.place} <span>{tomorrow ? 'tomorrow' : shortDay(dayIso)}</span></span>
          <div className="hero">
            <div>
              <p className="hero-temp" aria-label={`Feels like ${deg(summary.minFeels)} to ${deg(summary.maxFeels)}`}>
                <CountUp className="t-hero" value={summary.minFeels} fmt={deg} />
                {summary.maxFeels !== summary.minFeels && <><span className="sep" aria-hidden="true">/</span><CountUp className="t-hero" value={summary.maxFeels} fmt={deg} /></>}
              </p>
              <p className="hero-feels">Feels like, {hh(s.win.leave)} to {hh(s.win.back)}{stale ? `. Offline: from ${timeOf(forecast.fetchedAt)}` : ''}</p>
            </div>
            <WeatherGlyph kind={glyphForMood(mood)} />
          </div>
          <h1 id="verdict" className="verdict">{verdict(summary, s.win)}</h1>
        </header>
      )}

      {s.checkInFor && s.checkInFor < s.isoToday && (
        <section className="card" aria-labelledby="checkin-title">
          <h2 id="checkin-title" className="t-title">How was yesterday’s outfit?</h2>
          <div className="feel-row">
            <button className="btn secondary" onClick={() => d({ type: 'checkIn', feel: 'cold' })}>🥶 Cold</button>
            <button className="btn secondary" onClick={() => d({ type: 'checkIn', feel: 'right' })}>👌 Right</button>
            <button className="btn secondary" onClick={() => d({ type: 'checkIn', feel: 'warm' })}>🥵 Warm</button>
          </div>
        </section>
      )}

      {expired ? (
        <section className="card">
          <h2 className="t-title">Your free week is over</h2>
          <p className="t-small muted">Your closet is safe. Pick a plan to keep getting a look every morning.</p>
          <button className="btn primary" onClick={() => setPaywall(true)}>See plans</button>
        </section>
      ) : summary && missing.length ? (
        <section className="card">
          <h2 className="t-title">{s.closet.length ? `Add ${missing[0]} to get today’s look` : 'Your closet is empty'}</h2>
          <p className="t-small muted">
            {s.closet.length && s.closet.every((i) => i.status !== 'available')
              ? 'Everything’s in the wash. Mark laundry done when it’s back.'
              : 'Add a few things you wear a lot and we’ll start dressing you.'}
          </p>
          <button className="btn primary" onClick={() => d({ type: 'go', route: 'add' })}>Add clothes</button>
        </section>
      ) : summary && !looks.length ? (
        <section className="card">
          <h2 className="t-title">Nothing in your closet suits this weather</h2>
          <p className="t-small muted">Check what’s in the wash, or add a layer for {deg(summary.minFeels)}.</p>
        </section>
      ) : summary ? (
        <>
          <section aria-label="Your looks for the day">
            <LookDeck
              looks={looks}
              index={index}
              kept={kept}
              onToggle={(id) => { navigator.vibrate?.(8); setKept((k) => (k.includes(id) ? k.filter((x) => x !== id) : [...k, id])); setIndex(0); }}
              onSkip={() => { signal('skip'); setIndex((i) => i + 1); }}
              onLove={() => { navigator.vibrate?.([10, 30, 10]); signal('love'); }}
              onRestart={() => { setKept([]); setIndex(0); setRound((r) => r + 1); }}
              wornSig={wornSig}
              justWorn={justWorn}
              lovedSigs={s.loved}
            />
          </section>
          <Hours s={summary} layer={look?.layerHours ?? null} nowHour={tomorrow ? null : now.getHours()} deg={deg} outer={look?.items.find((i) => i.slot === 'outer')?.name} />
          {look && <p className="why-weather">{look.style.length > 1 ? `${look.style[1]}. ` : ''}{look.why}</p>}
          {look?.notes.map((n) => <p key={n} className="note">{n}</p>)}

          {look && (
            <div className="actions-dock">
              <button className="round" aria-label="Another look" onClick={() => press('ArrowLeft')}><Icon name="x" size={28} /></button>
              <button className={`btn primary${isWorn ? ' is-done' : ''}`} disabled={isWorn} onClick={wear}>
                {isWorn ? <><Icon name="check" /> Wearing this</> : 'Wear this'}
              </button>
              <button className={`round love${isLoved ? ' is-on' : ''}`} aria-label="Love this look" aria-pressed={isLoved} onClick={() => press('ArrowRight')}>
                <Icon name="heart" size={26} fill />
              </button>
            </div>
          )}
        </>
      ) : null}

      {day !== null && day >= 5 && day <= 7 && !s.subscribed && (
        <div className="banner" role="note">
          <span>✨ {8 - day} {8 - day === 1 ? 'day' : 'days'} left of your free week</span>
          <button className="btn" onClick={() => setPlans(true)}>See plans</button>
        </div>
      )}

      {!isStandalone() && !hideInstall && !expired && summary && (
        <section className="card">
          <p className="t-small">Put Wearther Mode on your Home Screen so your closet stays safe and your look reaches you each morning.</p>
          <div className="row">
            <button className="btn secondary" onClick={() => setInstall(true)}>Show me how</button>
            <button className="btn quiet" onClick={() => { setHideInstall(true); try { localStorage.setItem(INSTALL_KEY, '1'); } catch { /* private mode */ } }}>Not now</button>
          </div>
        </section>
      )}
      {summary && <p className="attribution">{s.forecast?.attribution ?? 'Weather data: MET Norway, CC BY 4.0'}</p>}
      {install && <InstallSheet onClose={() => setInstall(false)} />}
      {plans && !s.subscribed && <PaywallSheet onClose={() => setPlans(false)} />}
      {expired && paywall && <PaywallSheet onClose={() => setPaywall(false)} />}
    </main>
  );
}

/** One glass capsule per hour you're out: an icon, the feels-like temperature, a bar when the coat is on. */
function Hours({ s, layer, nowHour, deg, outer }: { s: WindowSummary; layer: [number, number] | null; nowHour: number | null; deg: (c: number) => string; outer?: string }) {
  return (
    <>
      <div className="hours" role="list" aria-label="Hour by hour">
        {s.hours.map((h, i) => {
          const on = !!layer && h.hour >= layer[0] && h.hour <= layer[1];
          return (
            <div
              key={h.hour}
              role="listitem"
              className={`hour${h.hour === nowHour ? ' is-now' : ''}${on ? ' is-layer' : ''}`}
              style={{ ['--i' as string]: i }}
              aria-label={`${hh(h.hour)}, feels ${deg(h.feelsC)}${h.precipProb >= 50 ? ', rain likely' : ''}${on && outer ? `, ${outer} on` : ''}`}
            >
              <small>{h.hour === nowHour ? 'Now' : String(h.hour).padStart(2, '0')}</small>
              <WeatherGlyph kind={glyphForHour(h)} className="mini" still />
              <strong>{deg(h.feelsC)}</strong>
            </div>
          );
        })}
      </div>
      {outer && layer && <p className="hours-key"><span><i />{outer} on</span></p>}
    </>
  );
}

function verdict(s: WindowSummary, win: { leave: number; back: number }): string {
  const mean = (s.minFeels + s.maxFeels) / 2;
  const feel = mean < 4 ? 'Cold' : mean < 14 ? 'Cool' : mean < 20 ? 'Mild' : mean < 26 ? 'Warm' : 'Hot';
  const wind = s.maxWind >= 25 ? ' and windy' : '';
  const rain = s.rainFrom === null ? `dry till ${hh(win.back)}` : s.rainFrom <= win.leave ? 'rain from the start' : `rain from ${hh(s.rainFrom)}`;
  return `${feel}${wind}, ${rain}.`;
}

function shortDay(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
}
