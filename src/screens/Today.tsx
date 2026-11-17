import { useMemo, useState } from 'react';
import { useStore, trialDay } from '../state/store';
import { scenarioForecast } from '../data/mock';
import { missingSlots, pick, signature, summarize, thermalOffset } from '../engine';
import { DayRibbon, tempColor, hh } from '../components/DayRibbon';
import { FlatLay } from '../components/FlatLay';
import { Icon } from '../components/Icon';
import { degFor, isStandalone, longDate, timeOf } from './format';
import { PaywallSheet, InstallSheet } from './Sheets';

export function Today() {
  const { s, d } = useStore();
  const [locked, setLocked] = useState<string[]>([]);
  const [exclude, setExclude] = useState<string[]>([]);
  const [showB, setShowB] = useState(false);
  const [paywall, setPaywall] = useState(true); // auto-opens once the trial has ended
  const [plans, setPlans] = useState(false);
  const [install, setInstall] = useState(false);
  const [hideInstall, setHideInstall] = useState(false);
  const deg = degFor(s.units);

  // Prototype: offline shows the forecast as cached at 07:12.
  const fetchedAt = useMemo(() => {
    const t = new Date();
    if (s.offline) t.setHours(7, 12, 0, 0);
    return t.toISOString();
  }, [s.offline]);
  const forecast = useMemo(() => ({ ...scenarioForecast(s.scenario, fetchedAt), place: s.place || 'London' }), [s.scenario, fetchedAt, s.place]);
  const summary = useMemo(() => summarize(forecast, s.win, thermalOffset(s.thermal, s.learnedOffset)), [forecast, s.win, s.thermal, s.learnedOffset]);
  const recent = s.worn.filter((w) => w.date !== s.isoToday).map((w) => [...w.ids].sort().join('+'));
  const picks = useMemo(
    () => pick({ closet: s.closet, summary, today: s.isoToday, pairWeights: s.pairWeights, recentOutfits: recent }, { exclude, locked }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [s.closet, summary, s.isoToday, s.pairWeights, exclude, locked],
  );
  const outfit = showB ? picks.planB : picks.hero;
  const day = trialDay(s);
  const expired = !s.subscribed && day !== null && day >= 8;
  const wornToday = s.worn.find((w) => w.date === s.isoToday);
  const isWorn = !!outfit && !!wornToday && signature(outfit.items) === [...wornToday.ids].sort().join('+');
  const avail = s.closet.filter((i) => i.status === 'available');
  const missing = missingSlots(avail);
  const mean = (summary.minFeels + summary.maxFeels) / 2;
  const outerName = outfit?.items.find((i) => i.slot === 'outer')?.name;

  const reshuffle = () => {
    if (!outfit) return;
    const next = pick(
      { closet: s.closet, summary, today: s.isoToday, pairWeights: s.pairWeights, recentOutfits: recent },
      { exclude: [...exclude, signature(outfit.items)], locked },
    );
    if (!next.hero) {
      d({ type: 'toast', text: 'No other outfit keeps those pieces. Unlock one to see more.' });
      return;
    }
    setExclude([...exclude, signature(outfit.items)]);
    setShowB(false);
  };

  return (
    <main className="screen has-tabs today">
      <section className="sky" style={{ ['--tint' as string]: tempColor(mean) }} aria-labelledby="today-temp">
        <p className="t-small sky-date">{longDate(s.isoToday)} in {forecast.place}</p>
        <h1 id="today-temp" className="t-display">
          {deg(summary.minFeels)} to {deg(summary.maxFeels)}
        </h1>
        <p className="t-small sky-sub">
          Feels like, {hh(s.win.leave)} to {hh(s.win.back)}
          {summary.rainFrom !== null ? `. Rain from ${hh(summary.rainFrom)}` : '. Dry'}
          {summary.maxWind >= 25 ? `, windy (${Math.round(summary.maxWind)} km/h)` : ''}
        </p>
        <DayRibbon s={summary} layer={outfit?.layerHours ?? null} layerName={outerName} deg={deg} stale={s.offline} />
        <p className="t-micro attribution">
          {s.offline ? `You’re offline. Using the forecast from ${timeOf(fetchedAt)}. ` : ''}
          Weather data: MET Norway, CC BY 4.0
        </p>
      </section>

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
      ) : outfit ? (
        <section className="outfit" aria-labelledby="outfit-title">
          <div className="outfit-head">
            <h2 id="outfit-title" className="t-heading">{showB ? 'Plan B' : 'Today’s outfit'}</h2>
            {locked.length > 0 && <span className="t-small muted">{locked.length} kept</span>}
          </div>
          <FlatLay
            items={outfit.items}
            locked={locked}
            revealKey={signature(outfit.items)}
            onToggleLock={(id) => setLocked((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]))}
          />
          <p className="why">{outfit.why}</p>
          {outfit.notes.map((n) => <p key={n} className="note">{n}</p>)}

          <button
            className="btn primary wear"
            disabled={isWorn}
            onClick={() => d({ type: 'wear', ids: outfit.items.map((i) => i.id) })}
          >
            {isWorn ? <><Icon name="check" /> Wearing this today</> : 'Wear this'}
          </button>
          <div className="outfit-actions">
            {picks.planB && (
              <button className="btn secondary" onClick={() => setShowB(!showB)}>
                {showB ? 'Back to first pick' : 'Plan B'}
              </button>
            )}
            <button className="btn secondary" onClick={reshuffle} aria-label={locked.length ? 'Reshuffle, keeping locked pieces' : 'Reshuffle'}>
              <Icon name="shuffle" /> Reshuffle
            </button>
            <button className="icon-btn outline" aria-label="I like this outfit" onClick={() => d({ type: 'rate', ids: outfit.items.map((i) => i.id), delta: 1 })}>
              <Icon name="up" />
            </button>
            <button
              className="icon-btn outline"
              aria-label="Not for me, show something else"
              onClick={() => { d({ type: 'rate', ids: outfit.items.map((i) => i.id), delta: -1 }); reshuffle(); }}
            >
              <Icon name="down" />
            </button>
          </div>
          <p className="t-small muted center">Tap the lock on a piece to keep it when you reshuffle.</p>
        </section>
      ) : (
        <section className="outfit empty">
          <h2 className="t-heading">Nothing in your closet suits today’s weather.</h2>
          <p className="t-body muted">Check what’s in the wash, or add a layer for {deg(summary.minFeels)}.</p>
        </section>
      )}

      {!isStandalone() && !hideInstall && !expired && (
        <section className="card install-hint">
          <p className="t-body">Put Wearther Mode on your Home Screen so your closet stays safe and outfits can reach you each morning.</p>
          <div className="checkin-row">
            <button className="btn secondary" onClick={() => setInstall(true)}>Show me how</button>
            <button className="btn ghost" onClick={() => setHideInstall(true)}>Later</button>
          </div>
        </section>
      )}
      {install && <InstallSheet onClose={() => setInstall(false)} />}
      {plans && !s.subscribed && <PaywallSheet onClose={() => setPlans(false)} />}
    </main>
  );
}
