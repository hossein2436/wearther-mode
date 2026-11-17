import { useEffect, useMemo, useState } from 'react';
import { useStore, trialDay, todayIso } from '../state/store';
import { scenarioForecast } from '../data/mock';
import { missingSlots, pickLooks, signature, summarize, thermalOffset, RAIN_THRESHOLD } from '../engine';
import type { WindowSummary } from '../types';
import { SkyBackground } from '../components/Sky';
import { LookDeck } from '../components/Look';
import { Icon } from '../components/Icon';
import { degFor, isStandalone, timeOf } from './format';
import { PaywallSheet, InstallSheet } from './Sheets';

const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;
const INSTALL_KEY = 'wm-hide-install';
const installHidden = () => { try { return localStorage.getItem(INSTALL_KEY) === '1'; } catch { return false; } };
const press = (key: 'ArrowLeft' | 'ArrowRight') =>
  document.querySelector<HTMLElement>('.deck')?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));

export function Today() {
  const { s, d } = useStore();
  const [kept, setKept] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [round, setRound] = useState(0);
  const [justWorn, setJustWorn] = useState(false);
  const [paywall, setPaywall] = useState(true);
  const [plans, setPlans] = useState(false);
  const [install, setInstall] = useState(false);
  const [hideInstall, setHideInstall] = useState(installHidden);
  const deg = degFor(s.units);

  // After you're home, we dress you for tomorrow.
  const now = new Date();
  const tomorrow = now.getHours() >= s.win.back;
  const dayIso = tomorrow ? todayIso(new Date(now.getTime() + 86_400_000)) : s.isoToday;

  const demoFetched = useMemo(() => {
    const t = new Date();
    if (s.offline) t.setHours(7, 12, 0, 0);
    return t.toISOString();
  }, [s.offline]);
  const forecast = useMemo(() => {
    if (s.demo) return { ...scenarioForecast(s.scenario, demoFetched), place: s.place || 'London' };
    const day = s.forecast?.days.find((x) => x.date === dayIso);
    return s.forecast && day ? { place: s.forecast.place, fetchedAt: s.forecast.fetchedAt, hours: day.hours } : null;
  }, [s.demo, s.scenario, demoFetched, s.place, s.forecast, dayIso]);
  const stale = s.offline || !!s.forecast?.stale;
  const summary = useMemo(
    () => (forecast ? summarize(forecast, s.win, thermalOffset(s.thermal, s.learnedOffset)) : null),
    [forecast, s.win, s.thermal, s.learnedOffset],
  );
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
  // If you've already chosen today, open on that look.
  useEffect(() => {
    if (!wornSig) return;
    const i = looks.findIndex((o) => signature(o.items) === wornSig);
    if (i >= 0) setIndex(i);
  }, [looks, wornSig]);

  const day = trialDay(s);
  const expired = !s.subscribed && day !== null && day >= 8;
  const avail = s.closet.filter((i) => i.status === 'available');
  const missing = missingSlots(avail);
  const look = looks[index];
  const lookSig = look ? signature(look.items) : '';
  const isWorn = !!look && lookSig === wornSig;
  const isLoved = s.loved.includes(lookSig);
  const showDeck = !expired && !missing.length && !!summary && looks.length > 0;

  const signal = (sg: 'skip' | 'love' | 'wear') => {
    if (!look) return;
    d({ type: 'feedback', signal: sg, ids: look.items.map((i) => i.id), features: look.features, quiet: sg !== 'love' });
  };
  const wear = () => {
    if (!look) return;
    d({ type: 'wear', ids: look.items.map((i) => i.id) });
    signal('wear');
    setJustWorn(true);
    window.setTimeout(() => setJustWorn(false), 1600);
  };

  return (
    <main className={`screen has-tabs today${showDeck ? ' has-dock' : ''}`}>
      <SkyBackground s={summary} />

      {!summary || !forecast ? (
        <section className="empty-state" aria-live="polite">
          {!s.coords && !s.place ? (
            <>
              <h1 className="t-display">Where are you today?</h1>
              <p className="t-body muted">We need your city to read the sky.</p>
              <button className="btn primary" onClick={() => d({ type: 'go', route: 'settings' })}>Set my city</button>
            </>
          ) : s.offline ? (
            <>
              <h1 className="t-display">You’re offline</h1>
              <p className="t-body muted">Connect once to get the forecast for {s.place || 'your area'}.</p>
            </>
          ) : (
            <p className="working"><span className="spinner" aria-hidden="true" /> Reading the sky over {s.place || 'your area'}…</p>
          )}
        </section>
      ) : (
        <header aria-labelledby="verdict">
          <div className="day-head">
            <div className="day-place">
              <strong>{forecast.place}</strong>
              <span>{longDay(dayIso)}</span>
            </div>
            {tomorrow && <span className="day-tag">Tomorrow</span>}
          </div>
          <p className="day-temp" aria-label={`Feels like ${deg(summary.minFeels)} to ${deg(summary.maxFeels)}`}>
            <span className="t-hero">{deg(summary.minFeels)}</span>
            {summary.maxFeels !== summary.minFeels && <><span className="to">to</span><span className="t-hero">{deg(summary.maxFeels)}</span></>}
          </p>
          <p className="day-feels">
            Feels like, {hh(s.win.leave)} to {hh(s.win.back)}{stale ? `. Offline: forecast from ${timeOf(forecast.fetchedAt)}` : ''}
          </p>
          <h1 id="verdict" className="day-verdict" style={{ marginTop: 'var(--s3)' }}>{verdict(summary, s.win)}</h1>
        </header>
      )}

      {s.checkInFor && s.checkInFor < s.isoToday && (
        <section className="card glass" aria-labelledby="checkin-title">
          <h2 id="checkin-title" className="t-title">How was yesterday’s outfit?</h2>
          <div className="feel-row">
            <button className="btn secondary" onClick={() => d({ type: 'checkIn', feel: 'cold' })}>Too cold</button>
            <button className="btn secondary" onClick={() => d({ type: 'checkIn', feel: 'right' })}>Just right</button>
            <button className="btn secondary" onClick={() => d({ type: 'checkIn', feel: 'warm' })}>Too warm</button>
          </div>
        </section>
      )}

      {expired ? (
        <section className="card glass">
          <h2 className="t-title">Your free week is over</h2>
          <p className="t-small muted">Your closet is safe. Pick a plan to keep getting a look every morning.</p>
          <button className="btn primary" onClick={() => setPaywall(true)}>See plans</button>
        </section>
      ) : summary && missing.length ? (
        <section className="card glass">
          <h2 className="t-title">{s.closet.length ? `Add ${missing[0]} to get today’s look` : 'Your closet is empty'}</h2>
          <p className="t-small muted">
            {s.closet.length && s.closet.every((i) => i.status !== 'available')
              ? 'Everything’s in the wash. Mark laundry done when it’s back.'
              : 'Add a few things you wear a lot and we’ll start dressing you.'}
          </p>
          <button className="btn primary" onClick={() => d({ type: 'go', route: 'add' })}>Add clothes</button>
        </section>
      ) : summary && !looks.length ? (
        <section className="card glass">
          <h2 className="t-title">Nothing in your closet suits this weather</h2>
          <p className="t-small muted">Check what’s in the wash, or add a layer for {deg(summary.minFeels)}.</p>
        </section>
      ) : summary ? (
        <>
          <section className="stage" aria-label="Your looks for the day">
            <Rail s={summary} layer={look?.layerHours ?? null} nowHour={tomorrow ? null : now.getHours()} />
            <LookDeck
              looks={looks}
              index={index}
              kept={kept}
              onToggle={(id) => { setKept((k) => (k.includes(id) ? k.filter((x) => x !== id) : [...k, id])); setIndex(0); }}
              onSkip={() => { signal('skip'); setIndex((i) => i + 1); }}
              onLove={() => signal('love')}
              onRestart={() => { setKept([]); setIndex(0); setRound((r) => r + 1); }}
              wornSig={wornSig}
              justWorn={justWorn}
              lovedSigs={s.loved}
            />
          </section>

          {look && <PlanLine s={summary} look={look.items} layer={look.layerHours} />}
          {look && <p className="why-weather">{look.style.length > 1 ? `${look.style[1]}. ` : ''}{look.why}</p>}
          {look?.notes.map((n) => <p key={n} className="note">{n}</p>)}

          {look && (
            <div className="actions-dock">
              <button className="round" aria-label="Another look" onClick={() => press('ArrowLeft')}>
                <Icon name="x" size={26} />
              </button>
              <button className={`btn primary${isWorn ? ' is-done' : ''}`} disabled={isWorn} onClick={wear}>
                {isWorn ? <><Icon name="check" /> Wearing this</> : 'Wear this'}
              </button>
              <button className={`round${isLoved ? ' is-on' : ''}`} aria-label="Love this look" aria-pressed={isLoved} onClick={() => press('ArrowRight')}>
                <Icon name="heart" size={24} fill={isLoved} />
              </button>
            </div>
          )}
        </>
      ) : null}

      {day !== null && day >= 5 && day <= 7 && !s.subscribed && (
        <div className="banner" role="note">
          <span>{8 - day} {8 - day === 1 ? 'day' : 'days'} left of your free week</span>
          <button className="btn" onClick={() => setPlans(true)}>See plans</button>
        </div>
      )}

      {!isStandalone() && !hideInstall && !expired && summary && (
        <section className="card glass">
          <p className="t-small">Add Wearther Mode to your Home Screen so your closet stays safe and your look can reach you each morning.</p>
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

/** The hours you're out, top to bottom, beside the deck: rain marked in cobalt, the coat in ink. */
function Rail({ s, layer, nowHour }: { s: WindowSummary; layer: [number, number] | null; nowHour: number | null }) {
  const hours = s.hours;
  const n = hours.length;
  if (n < 2) return <div className="rail" aria-hidden="true" />;
  const first = hours[0].hour, range = hours[n - 1].hour - first;
  const pos = (h: number) => `calc(8px + (100% - 16px) * ${(h - first) / range})`;
  const span = (a: number, b: number) => ({ top: pos(a), height: `calc((100% - 16px) * ${(b - a) / range})` });
  const wet: [number, number][] = [];
  for (const h of hours) {
    if (h.precipProb < RAIN_THRESHOLD) continue;
    const last = wet[wet.length - 1];
    if (last && last[1] === h.hour - 1) last[1] = h.hour;
    else wet.push([h.hour, h.hour]);
  }
  const ticks = hours.filter((h, i) => i === n - 1 || (i % 2 === 0 && hours[n - 1].hour - h.hour >= 2));
  return (
    <div className="rail" aria-hidden="true">
      <span className="rail-line" />
      {ticks.map((h) => <span key={h.hour} className="rail-tick" style={{ top: pos(h.hour) }}>{String(h.hour).padStart(2, '0')}</span>)}
      {wet.map(([a, b]) => <span key={a} className="rail-rain" style={span(a, Math.max(b, a + 0.6))} />)}
      {layer && <span className="rail-layer" style={span(layer[0], Math.max(layer[1], layer[0] + 0.6))} />}
      {nowHour !== null && nowHour >= first && nowHour <= hours[n - 1].hour && <span className="rail-now" style={{ top: pos(nowHour) }} />}
    </div>
  );
}

/** The rail's legend, written as the day's plan. */
function PlanLine({ s, look, layer }: { s: WindowSummary; look: { slot: string; name: string }[]; layer: [number, number] | null }) {
  const outer = look.find((i) => i.slot === 'outer');
  const first = s.hours[0].hour, last = s.hours[s.hours.length - 1].hour;
  const items: { key: string; cls: string; text: string }[] = [];
  if (outer && layer) {
    const all = layer[0] === first && layer[1] === last;
    items.push({ key: 'layer', cls: '', text: all ? `${outer.name} on all day` : `${outer.name} on ${hh(layer[0])}–${hh(layer[1] + 1)}` });
  }
  if (s.rainFrom !== null) {
    items.push({ key: 'rain', cls: 'rain', text: s.rainTo !== null && s.rainTo < last ? `Rain ${hh(s.rainFrom)}–${hh(s.rainTo + 1)}` : `Rain from ${hh(s.rainFrom)}` });
  }
  if (!items.length) return null;
  return (
    <div className="plan-line">
      {items.map((x) => <span key={x.key} className="plan-item"><i className={`plan-key ${x.cls}`} aria-hidden="true" />{x.text}</span>)}
    </div>
  );
}

/** One plain sentence about the day, like a forecaster would say it. */
function verdict(s: WindowSummary, win: { leave: number; back: number }): string {
  const mean = (s.minFeels + s.maxFeels) / 2;
  const feel = mean < 4 ? 'Cold' : mean < 14 ? 'Cool' : mean < 20 ? 'Mild' : mean < 26 ? 'Warm' : 'Hot';
  const wind = s.maxWind >= 25 ? ' and windy' : '';
  const rain = s.rainFrom === null ? `Dry until ${hh(win.back)}.` : s.rainFrom <= win.leave ? 'Rain from the start.' : `Rain from ${hh(s.rainFrom)}.`;
  return `${feel}${wind}. ${rain}`;
}

function longDay(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}
