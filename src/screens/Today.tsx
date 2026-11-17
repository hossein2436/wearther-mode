import { useMemo, useState } from 'react';
import { useStore, trialDay, todayIso } from '../state/store';
import { scenarioForecast } from '../data/mock';
import { missingSlots, pick, signature, summarize, thermalOffset } from '../engine';
import { DayRibbon, tempColor, hh } from '../components/DayRibbon';
import { FlatLay } from '../components/FlatLay';
import { Icon } from '../components/Icon';
import { degFor, isStandalone, timeOf } from './format';
import type { WindowSummary } from '../types';
import { PaywallSheet, InstallSheet } from './Sheets';

export function Today() {
  const { s, d } = useStore();
  const [locked, setLocked] = useState<string[]>([]);
  const [exclude, setExclude] = useState<string[]>([]);
  const [showB, setShowB] = useState(false);
  const [paywall, setPaywall] = useState(true); // auto-opens once the trial has ended
  const [plans, setPlans] = useState(false);
  const [install, setInstall] = useState(false);
  const [hideInstall, setHideInstall] = useState(installHidden);
  const [celebrate, setCelebrate] = useState(false);
  const deg = degFor(s.units);

  // Which day are we dressing for? After you're back home, it's tomorrow.
  const now = new Date();
  const tomorrow = now.getHours() >= s.win.back;
  const dayIso = tomorrow ? todayIso(new Date(now.getTime() + 86_400_000)) : s.isoToday;

  // Review links use scenario weather; the real app uses the server forecast.
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
  const fetchedAt = forecast?.fetchedAt ?? demoFetched;
  const summary = useMemo(
    () => (forecast ? summarize(forecast, s.win, thermalOffset(s.thermal, s.learnedOffset)) : null),
    [forecast, s.win, s.thermal, s.learnedOffset],
  );
  const recent = s.worn.filter((w) => w.date !== s.isoToday).map((w) => [...w.ids].sort().join('+'));
  const picks = useMemo(
    () => (summary ? pick({ closet: s.closet, summary, today: dayIso, pairWeights: s.pairWeights, recentOutfits: recent }, { exclude, locked }) : { hero: null, planB: null }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [s.closet, summary, dayIso, s.pairWeights, exclude, locked],
  );
  const outfit = showB ? picks.planB : picks.hero;
  const day = trialDay(s);
  const expired = !s.subscribed && day !== null && day >= 8;
  const wornToday = s.worn.find((w) => w.date === s.isoToday);
  const isWorn = !!outfit && !!wornToday && signature(outfit.items) === [...wornToday.ids].sort().join('+');
  const avail = s.closet.filter((i) => i.status === 'available');
  const missing = missingSlots(avail);
  const mean = summary ? (summary.minFeels + summary.maxFeels) / 2 : 12;
  const outerName = outfit?.items.find((i) => i.slot === 'outer')?.name;

  const reshuffle = () => {
    if (!outfit || !summary) return;
    const next = pick(
      { closet: s.closet, summary, today: dayIso, pairWeights: s.pairWeights, recentOutfits: recent },
      { exclude: [...exclude, signature(outfit.items)], locked },
    );
    if (!next.hero) {
      d({ type: 'toast', text: 'No other outfit keeps those pieces. Unlock one to see more.' });
      return;
    }
    setExclude([...exclude, signature(outfit.items)]);
    setShowB(false);
  };

  const wear = () => {
    if (!outfit) return;
    d({ type: 'wear', ids: outfit.items.map((i) => i.id) });
    setCelebrate(true);
    window.setTimeout(() => setCelebrate(false), 1600);
  };
  const dismissInstall = () => {
    setHideInstall(true);
    try { localStorage.setItem(INSTALL_KEY, '1'); } catch { /* private mode: dismiss for this visit only */ }
  };
  const showActions = !expired && !missing.length && !!summary && !!outfit;

  return (
    <main className={`screen has-tabs today${showActions ? ' has-actionbar' : ''}`}>
      {!summary || !forecast ? (
        <section className="sky" style={{ ['--tint' as string]: tempColor(12) }} aria-live="polite">
          {!s.coords && !s.place ? (
            <>
              <h1 className="t-title">Where are you today?</h1>
              <p className="t-body">We need your city to get the forecast.</p>
              <button className="btn primary" onClick={() => d({ type: 'go', route: 'settings' })}>Set my city</button>
            </>
          ) : s.offline ? (
            <>
              <h1 className="t-title">You’re offline</h1>
              <p className="t-body">Connect once to get today’s forecast for {s.place || 'your area'}.</p>
            </>
          ) : (
            <p className="t-body cutting"><span className="spinner" aria-hidden="true" /> Getting the forecast for {s.place || 'your area'}…</p>
          )}
        </section>
      ) : (
      <section className="sky" style={{ ['--tint' as string]: tempColor(mean) }} aria-labelledby="today-line">
        <div className="sky-head">
          <div className="sky-text">
            <p className="t-small sky-date">{tomorrow ? 'Tomorrow · ' : ''}{shortDate(dayIso)} · {forecast.place}</p>
            <h1 id="today-line" className="sky-line">{skyLine(summary, s.win)}</h1>
          </div>
          <p className="sky-temp" aria-label={`Feels like ${deg(summary.minFeels)} to ${deg(summary.maxFeels)}`}>
            <span>{deg(summary.minFeels)}</span><span className="sky-temp-sep" aria-hidden="true">to</span><span>{deg(summary.maxFeels)}</span>
            <span className="sky-temp-label">feels like</span>
          </p>
        </div>
        <DayRibbon s={summary} layer={outfit?.layerHours ?? null} layerName={outerName} deg={deg} stale={stale} />
        {stale && <p className="t-micro stale-note">Offline. Using the forecast from {timeOf(fetchedAt)}.</p>}
      </section>
      )}

      {s.checkInFor && s.checkInFor < s.isoToday && (
        <section className="card checkin" aria-labelledby="checkin-title">
          <h2 id="checkin-title" className="t-heading">How was yesterday’s outfit?</h2>
          <div className="checkin-row">
            <button className="btn secondary" onClick={() => d({ type: 'checkIn', feel: 'cold' })}>Too cold</button>
            <button className="btn secondary" onClick={() => d({ type: 'checkIn', feel: 'right' })}>Just right</button>
            <button className="btn secondary" onClick={() => d({ type: 'checkIn', feel: 'warm' })}>Too warm</button>
          </div>
        </section>
      )}

      {day !== null && day >= 5 && day <= 7 && !s.subscribed && (
        <div className="banner" role="note">
          Your free week ends in {8 - day} {8 - day === 1 ? 'day' : 'days'}. Keep getting outfits for $3.99 a month.
          <button className="link" onClick={() => setPlans(true)}>See plans</button>
        </div>
      )}

      {expired ? (
        <section className="outfit locked-state">
          <h2 className="t-heading">Subscribe to see today’s outfit</h2>
          <p className="t-body muted">Your closet is safe and you can still browse and edit it.</p>
          <button className="btn primary" onClick={() => setPaywall(true)}>See plans</button>
          {paywall && <PaywallSheet onClose={() => setPaywall(false)} />}
        </section>
      ) : missing.length ? (
        <section className="outfit empty">
          <h2 className="t-heading">
            {s.closet.length ? `Add ${missing[0]} to get today’s outfit.` : 'Your closet is empty.'}
          </h2>
          <p className="t-body muted">
            {s.closet.length && s.closet.every((i) => i.status !== 'available')
              ? 'Everything’s in the wash. Mark laundry done when it’s back.'
              : 'Add a few things you wear a lot and we’ll start dressing you.'}
          </p>
          <button className="btn primary" onClick={() => d({ type: 'go', route: 'add' })}>Add clothes</button>
        </section>
      ) : !summary ? null : outfit ? (
        <section className="outfit" aria-labelledby="outfit-title">
          <div className="outfit-head">
            <h2 id="outfit-title" className="visually-hidden">{showB ? 'Plan B' : tomorrow ? 'Tomorrow’s outfit' : 'Today’s outfit'}</h2>
            <div className="seg" role="group" aria-label="Which outfit">
              <button aria-pressed={!showB} onClick={() => setShowB(false)}>{tomorrow ? 'Tomorrow' : 'Today'}</button>
              <button aria-pressed={showB} disabled={!picks.planB} onClick={() => setShowB(true)}>Plan B</button>
            </div>
            <p className="t-small muted" aria-live="polite">
              {locked.length ? `${locked.length} kept` : 'Tap a piece to keep it'}
            </p>
          </div>
          <div className="flatlay-wrap">
            <FlatLay
              items={outfit.items}
              locked={locked}
              worn={celebrate}
              revealKey={signature(outfit.items)}
              onToggleLock={(id) => setLocked((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]))}
            />
            {celebrate && (
              <div className="worn-stamp" role="status">
                <span className="worn-check"><Icon name="check" size={28} /></span>
                Logged. Have a good day.
              </div>
            )}
          </div>
          <p className="why">{outfit.why}</p>
          {outfit.notes.map((n) => <p key={n} className="note">{n}</p>)}
          <div className="rate-row">
            <span className="t-small muted">Good pick?</span>
            <button className="icon-btn" aria-label="I like this outfit" onClick={() => { d({ type: 'rate', ids: outfit.items.map((i) => i.id), delta: 1 }); d({ type: 'toast', text: 'Noted. More like this.' }); }}>
              <Icon name="up" />
            </button>
            <button
              className="icon-btn"
              aria-label="Not for me, show something else"
              onClick={() => { d({ type: 'rate', ids: outfit.items.map((i) => i.id), delta: -1 }); reshuffle(); }}
            >
              <Icon name="down" />
            </button>
          </div>

          <div className="action-bar">
            <button className="btn secondary shuffle" onClick={reshuffle} aria-label={locked.length ? 'Reshuffle, keeping kept pieces' : 'Reshuffle'}>
              <Icon name="shuffle" /> Shuffle
            </button>
            <button className={`btn primary wear${isWorn ? ' is-done' : ''}`} disabled={isWorn} onClick={wear}>
              {isWorn ? <><Icon name="check" /> Wearing this today</> : 'Wear this'}
            </button>
          </div>
        </section>
      ) : (
        <section className="outfit empty">
          <h2 className="t-heading">Nothing in your closet suits today’s weather.</h2>
          <p className="t-body muted">Check what’s in the wash, or add a layer for {deg(summary?.minFeels ?? 0)}.</p>
        </section>
      )}

      {!isStandalone() && !hideInstall && !expired && (
        <section className="card install-hint">
          <p className="t-small">Add Wearther Mode to your Home Screen so your closet stays safe and outfits can reach you each morning.</p>
          <div className="checkin-row">
            <button className="btn secondary" onClick={() => setInstall(true)}>Show me how</button>
            <button className="btn ghost" onClick={dismissInstall}>Not now</button>
          </div>
        </section>
      )}
      {summary && forecast && (
        <p className="t-micro attribution">{s.forecast?.attribution ?? 'Weather data: MET Norway, CC BY 4.0'}</p>
      )}
      {install && <InstallSheet onClose={() => setInstall(false)} />}
      {plans && !s.subscribed && <PaywallSheet onClose={() => setPlans(false)} />}
    </main>
  );
}

const INSTALL_KEY = 'wm-hide-install';
const installHidden = () => { try { return localStorage.getItem(INSTALL_KEY) === '1'; } catch { return false; } };

/** One plain sentence about the day, like a forecaster would say it. */
function skyLine(s: WindowSummary, win: { leave: number; back: number }): string {
  const mean = (s.minFeels + s.maxFeels) / 2;
  const feel = mean < 4 ? 'Cold' : mean < 14 ? 'Cool' : mean < 20 ? 'Mild' : mean < 26 ? 'Warm' : 'Hot';
  const wind = s.maxWind >= 25 ? ' and windy' : '';
  const rain = s.rainFrom === null
    ? `dry until ${hh(win.back)}`
    : s.rainFrom <= win.leave ? 'rain from the start' : `rain from ${hh(s.rainFrom)}`;
  return `${feel}${wind}, ${rain}.`;
}

function shortDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}
