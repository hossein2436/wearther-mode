import { useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { useStore, trialDay, accessOf } from '../state/store';
import { PLAN } from '../plans';
import { useDay } from '../state/day';
import { missingSlots, pickLooks, signature, RAIN_THRESHOLD } from '../engine';
import { bodyOrder, conditionLabel, pieceReasons } from '../engine/explain';
import type { Item, Slot, WindowSummary } from '../types';
import { SLOT_LABEL } from '../data/catalog';
import { ItemVisual } from '../components/Garment';
import { Icon } from '../components/Icon';
import { WeatherGlyph } from '../components/WeatherGlyph';
import { degFor, isStandalone, timeOf } from './format';
import { PaywallSheet, InstallSheet } from './Sheets';

const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;
const INSTALL_KEY = 'wm-hide-install';
const installHidden = () => { try { return localStorage.getItem(INSTALL_KEY) === '1'; } catch { return false; } };
/** Widths shrink down the body so the stack reads as one dressed figure. */
const BODY_WIDTH: Record<Slot, number> = { outer: 188, mid: 148, top: 148, onepiece: 172, bottom: 138, shoes: 112 };

export function Today() {
  const { s, d } = useStore();
  const { tomorrow, dayIso, forecast, summary, stale, now } = useDay();
  const [kept, setKept] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [round, setRound] = useState(0);
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
        }, { locked: kept, n: 5 })
      : []),
    // Taste is applied to the next set of looks, not mid-browse, so the look on screen doesn't jump.
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
  const access = accessOf(s);
  const metered = access.tier === 'free' || access.tier === 'locked';
  const missing = missingSlots(s.closet.filter((i) => i.status === 'available'));
  // Once the free looks are used, only the ones already shown stay browsable.
  const shown = access.tier === 'locked' ? looks.filter((o) => s.freeLooksSeen.includes(signature(o.items))) : looks;
  const n = shown.length;
  const look = n ? shown[((index % n) + n) % n] : undefined;
  const lookSig = look ? signature(look.items) : '';
  const isWorn = !!look && lookSig === wornSig;
  const isLoved = s.loved.includes(lookSig);
  // After the free week, each new look shown uses one of the free looks; the last one stays visible.
  const expired = access.tier === 'locked' && n === 0;
  const freeLeft = metered ? PLAN.freeLooks - s.freeLooksSeen.length : null;
  useEffect(() => {
    if (access.tier === 'free' && lookSig && !s.freeLooksSeen.includes(lookSig)) d({ type: 'seeFreeLook', sig: lookSig });
  }, [access.tier, lookSig, s.freeLooksSeen, d]);

  const pieces = look ? bodyOrder(look.items) : [];
  const outer = look?.items.find((i) => i.slot === 'outer');

  const signal = (sg: 'skip' | 'love' | 'wear') => {
    if (!look) return;
    d({ type: 'feedback', signal: sg, ids: look.items.map((i) => i.id), features: look.features, quiet: sg !== 'love' });
  };
  const wear = () => {
    if (!look) return;
    d({ type: 'wear', ids: look.items.map((i) => i.id) });
    signal('wear');
    d({ type: 'toast', text: 'Worn today ✓' });
  };
  const toggleKeep = (id: string) => { setKept((k) => (k.includes(id) ? k.filter((x) => x !== id) : [...k, id])); setIndex(0); };
  const love = () => {
    if (isLoved) d({ type: 'patch', patch: { loved: s.loved.filter((x) => x !== lookSig) } });
    else signal('love');
  };

  return (
    <main className="screen has-tabs today">
      {!summary || !forecast ? (
        <section className="empty-state" aria-live="polite">
          {!s.coords && !s.place ? (
            <>
              <h1 className="t-display">Where are you today?</h1>
              <p className="t-body muted">We need your city to read the weather.</p>
              <button className="btn primary" onClick={() => d({ type: 'go', route: 'settings' })}>Set my city</button>
            </>
          ) : s.offline ? (
            <>
              <h1 className="t-display">You’re offline</h1>
              <p className="t-body muted">Connect once to get the forecast for {s.place || 'your area'}.</p>
            </>
          ) : (
            <p className="working"><span className="spinner" aria-hidden="true" /> Getting the forecast for {s.place || 'your area'}…</p>
          )}
        </section>
      ) : (
        <header aria-labelledby="verdict" className="stack" style={{ gap: 'var(--s3)' }}>
          <p className="place-line"><b>{forecast.place}</b> · {tomorrow ? 'Tomorrow, ' : ''}{longDay(dayIso)}</p>
          <div className="weather-strip">
            <span className="mood-chip"><Icon name={summary.rainFrom !== null ? 'drop' : summary.maxFeels >= 22 ? 'sunny' : 'cloud'} size={16} /> {conditionLabel(summary)}</span>
            <span className="temp-line">
              {deg(summary.minFeels)}–{deg(summary.maxFeels)} <span>feels like</span> · Wind {wind(summary.maxWind, s.units)}
            </span>
          </div>
          {stale && <p className="t-micro muted">Offline. Forecast from {timeOf(forecast.fetchedAt)}.</p>}
          <h1 id="verdict" className="verdict"><Verdict s={summary} win={s.win} outer={outer?.name} /></h1>
        </header>
      )}

      {s.checkInFor && s.checkInFor < s.isoToday && (
        <section className="card" aria-labelledby="checkin-title">
          <h2 id="checkin-title" className="t-title">How was yesterday’s outfit?</h2>
          <div className="feel-row">
            <button className="btn secondary" onClick={() => d({ type: 'checkIn', feel: 'cold' })}><WeatherGlyph kind="snow" still /> Too cold</button>
            <button className="btn secondary" onClick={() => d({ type: 'checkIn', feel: 'right' })}><WeatherGlyph kind="partly" still /> Right</button>
            <button className="btn secondary" onClick={() => d({ type: 'checkIn', feel: 'warm' })}><WeatherGlyph kind="heat" still /> Too warm</button>
          </div>
        </section>
      )}

      {expired ? (
        <section className="card">
          <h2 className="t-title">You’ve used your {PLAN.freeLooks} free looks</h2>
          <p className="t-small muted">Your closet is safe. For {PLAN.priceLabel} a month you get a look every morning, plus {PLAN.modelImagesPerMonth} pictures a month of a look on you.</p>
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
      ) : summary && !look ? (
        <section className="card">
          <h2 className="t-title">Nothing in your closet suits this weather</h2>
          <p className="t-small muted">Check what’s in the wash, or add a layer for {deg(summary.minFeels)}.</p>
        </section>
      ) : summary && look ? (
        <>
          {freeLeft !== null && (
            <p className="free-note" role="status">
              {freeLeft > 0
                ? <>Free look. <b>{freeLeft} more</b> after this, then {PLAN.priceLabel} a month.</>
                : <>This is your last free look. <button className="link" onClick={() => setPlans(true)}>See the plan</button></>}
            </p>
          )}
          <div className="look-meta">
            <span className="look-of">Look {(((index % n) + n) % n) + 1} of {n}</span>
            {n > 1 && (
              <div className="look-nav">
                <button className="nav-arrow" aria-label="Previous look" onClick={() => setIndex((i) => i - 1)}>‹</button>
                <span className="dots" aria-hidden="true">{shown.map((_, i) => <i key={i} className={i === ((index % n) + n) % n ? 'on' : ''} />)}</span>
                <button className="nav-arrow" aria-label="Next look" onClick={() => setIndex((i) => i + 1)}>›</button>
              </div>
            )}
          </div>

          <section className="body-stack" aria-label="Today’s outfit, laid out top to bottom like a body">
            {isWorn && <span className="worn-note" style={{ marginBottom: 12 }}><Icon name="check" size={14} /> Worn today</span>}
            {pieces.map((it) => (
              <div key={it.id} className={`body-layer${kept.includes(it.id) ? ' is-kept' : ''}`} style={{ ['--w' as string]: `${BODY_WIDTH[it.slot]}px` } as CSSProperties}>
                <div className="bl-photo"><ItemVisual item={it} /></div>
                <span className="bl-tag">{roleOf(it)}</span>
              </div>
            ))}
            <p className="body-note">Your pieces, laid out top to bottom, the way you’ll wear them.</p>
          </section>

          <div className="outfit-stack flat" role="list" aria-label="The pieces in this look">
            {pieces.map((it) => {
              const k = kept.includes(it.id);
              return (
                <div key={it.id} role="listitem" className={`piece-row${k ? ' is-kept' : ''}`}>
                  <span className="piece-main">
                    <span className="piece-art"><ItemVisual item={it} /></span>
                    <span className="piece-info">
                      <span className="nm">{it.name}</span>
                      <span className="rl">{roleOf(it)}</span>
                      <span className="kept-tag">Kept ✓</span>
                    </span>
                  </span>
                  <button className="pin-btn" aria-pressed={k} aria-label={`${k ? 'Release' : 'Keep'} ${it.name} in the next looks`} onClick={() => toggleKeep(it.id)}>
                    <Icon name="lock" size={18} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="actions">
            <button className={`btn primary${isWorn ? ' is-done' : ''}`} disabled={isWorn} onClick={wear}>
              {isWorn ? <><Icon name="check" /> Worn today</> : 'Wear this'}
            </button>
            <div className="actions-quiet">
              <button className="btn-quiet" onClick={() => { signal('skip'); setIndex((i) => i + 1); if (n < 2) setRound((r) => r + 1); }}>
                <Icon name="shuffle" size={18} /> Shuffle
              </button>
              <button className="btn-quiet" aria-pressed={isLoved} onClick={love}>
                <Icon name="heart" size={18} /> {isLoved ? 'Loved' : 'Love'}
              </button>
            </div>
          </div>

          <section className="why-card" aria-labelledby="why-title">
            <h2 id="why-title" className="why-label">Why this look</h2>
            <p className="why-lead">{look.style.length ? `${look.style.join('. ')}. ` : ''}{look.why}</p>
            <ul className="why-list">
              {pieceReasons(look.items, summary, deg).map((r) => <li key={r.id}><b>{r.name}</b>: {r.text}</li>)}
            </ul>
          </section>
          {look.notes.map((x) => <p key={x} className="note">{x}</p>)}

          <HourCard s={summary} deg={deg} layer={look.layerHours} outer={outer} win={s.win} nowHour={tomorrow ? null : now.getHours()} />
        </>
      ) : null}

      {day !== null && day >= 5 && day <= 7 && !s.subscribed && (
        <div className="banner" role="note">
          <span>{8 - day} {8 - day === 1 ? 'day' : 'days'} left of your free week</span>
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

const ROLE: Record<Slot, string> = { outer: 'Outer', mid: 'Warm layer', top: 'Top', onepiece: 'Dress', bottom: 'Bottom', shoes: 'Shoes' };
const roleOf = (it: Item) => ROLE[it.slot] ?? SLOT_LABEL[it.slot];

/** One sentence, like a forecaster would say it, with the rain time picked out in the mood colour. */
function Verdict({ s, win, outer }: { s: WindowSummary; win: { leave: number; back: number }; outer?: string }) {
  const mean = (s.minFeels + s.maxFeels) / 2;
  const feel = mean < 4 ? 'Cold' : mean < 14 ? 'Cool' : mean < 20 ? 'Mild' : mean < 26 ? 'Warm' : 'Hot';
  const wind = s.maxWind >= 25 ? ' and windy' : '';
  const coat = outer ? outer.toLowerCase().split(' ').slice(-1)[0] : null;
  if (s.rainFrom !== null) {
    return <>{feel}{wind}. Rain from <em>{s.rainFrom <= win.leave ? 'the start' : hh(s.rainFrom)}</em>{coat ? `, take the ${coat}.` : '.'}</>;
  }
  return <>{feel}{wind}, dry until <em>{hh(win.back)}</em>{coat ? `. Take the ${coat}.` : '.'}</>;
}

function wind(kmh: number, units: 'C' | 'F'): string {
  return units === 'F' ? `${Math.round(kmh / 1.609)} mph` : `${Math.round(kmh)} km/h`;
}

/** Feels-like across the hours you're out, as one curve: rain window shaded, tap a point to read it. */
function HourCard({ s, deg, layer, outer, win, nowHour }: {
  s: WindowSummary; deg: (c: number) => string; layer: [number, number] | null; outer?: Item;
  win: { leave: number; back: number }; nowHour: number | null;
}) {
  const hours = s.hours;
  const first = hours[0]?.hour ?? win.leave, last = hours[hours.length - 1]?.hour ?? win.back;
  const startSel = nowHour !== null && nowHour >= first && nowHour <= last ? nowHour : Math.round((first + last) / 2);
  const [sel, setSel] = useState(startSel);
  if (hours.length < 2) return null;
  const W = 320, H = 118, L = 14, R = 14, T = 16, B = 24;
  const lo = Math.min(...hours.map((h) => h.feelsC)), hi = Math.max(...hours.map((h) => h.feelsC));
  const span = Math.max(4, hi - lo);
  const x = (h: number) => L + ((h - first) / (last - first)) * (W - L - R);
  const y = (c: number) => T + (1 - (c - lo) / span) * (H - T - B);
  const line = hours.map((h, i) => `${i ? 'L' : 'M'}${x(h.hour).toFixed(1)} ${y(h.feelsC).toFixed(1)}`).join(' ');
  const area = `${line} L${x(last).toFixed(1)} ${H - B} L${x(first).toFixed(1)} ${H - B} Z`;
  const wet = hours.filter((h) => h.precipProb >= RAIN_THRESHOLD).map((h) => h.hour);
  const cur = hours.find((h) => h.hour === sel) ?? hours[0];
  const mid = hours[Math.floor(hours.length / 2)].hour;
  const key = (e: KeyboardEvent, h: number) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(h); } };
  const lf = layer ? (layer[0] - first) / (last - first + 1) : 0;
  const lw = layer ? (layer[1] + 1 - layer[0]) / (last - first + 1) : 0;
  return (
    <section className="hour-card" aria-labelledby="hours-title">
      <h3 id="hours-title">Hour by hour, feels like</h3>
      <div className="hour-curve">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Feels like from ${deg(hours[0].feelsC)} at ${hh(first)} to ${deg(hours[hours.length - 1].feelsC)} at ${hh(last)}${wet.length ? `, rain likely from ${hh(wet[0])}` : ''}`}>
          <defs>
            <linearGradient id="hc-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--accent)" stopOpacity="0.22" />
              <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {wet.length > 0 && (
            <>
              <rect x={x(wet[0]) - 8} y={T - 10} width={Math.max(16, x(wet[wet.length - 1]) - x(wet[0]) + 16)} height={H - B - T + 10} rx="6" fill="var(--accent-soft)" />
              <text x={x(wet[0]) - 4} y={T - 1} fontSize="9" fontWeight="800" fill="var(--accent-ink)">RAIN</text>
            </>
          )}
          <path d={area} fill="url(#hc-fill)" />
          <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {hours.map((h) => (
            <g key={h.hour} className="hour-point" role="button" tabIndex={0} aria-label={`${hh(h.hour)}, feels like ${deg(h.feelsC)}`}
              aria-pressed={h.hour === sel} onClick={() => setSel(h.hour)} onKeyDown={(e) => key(e, h.hour)}>
              <circle cx={x(h.hour)} cy={y(h.feelsC)} r="14" fill="transparent" />
              <circle cx={x(h.hour)} cy={y(h.feelsC)} r={h.hour === sel ? 5.5 : 3.5} fill={h.hour === sel ? 'var(--accent)' : 'var(--paper)'} stroke="var(--accent)" strokeWidth="2" />
            </g>
          ))}
          {[first, mid, last].map((h) => (
            <text key={h} x={x(h)} y={H - 6} fontSize="10" fontWeight="600" fill="var(--ink-2)" textAnchor={h === first ? 'start' : h === last ? 'end' : 'middle'}>{hh(h)}</text>
          ))}
        </svg>
      </div>
      <p className="hour-read" aria-live="polite">
        <b>{hh(cur.hour)}</b> · Feels like <b>{deg(cur.feelsC)}</b><span> · Rain {Math.round(cur.precipProb)}% likely</span>
      </p>
      <div className="layer-bar">
        <div className="lb-track">
          {outer && layer
            ? <div className="lb-fill" style={{ left: `${lf * 100}%`, width: `${lw * 100}%` }} />
            : <div className="lb-fill none" />}
        </div>
        <p>
          {outer && layer
            ? <><b>{outer.name} on {hh(layer[0])}–{hh(Math.min(layer[1] + 1, win.back))}</b> · out {hh(win.leave)}–{hh(win.back)}</>
            : <>No coat needed · out {hh(win.leave)}–{hh(win.back)}</>}
        </p>
      </div>
    </section>
  );
}

function longDay(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}
