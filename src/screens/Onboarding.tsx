import { useState, type CSSProperties } from 'react';
import { useStore } from '../state/store';
import { Progress } from '../components/ui';
import { Icon } from '../components/Icon';
import { Garment } from '../components/Garment';
import { STARTER, SLOT_LABEL } from '../data/catalog';
import { missingSlots } from '../engine';
import { AddFlow } from './AddFlow';
import { requestPersistence } from '../state/db';
import { api, ApiError } from '../api';
import { restore } from '../state/sync';
import type { Thermal } from '../types';

export function Welcome() {
  const { d } = useStore();
  const look: { kind: Parameters<typeof Garment>[0]['kind']; color: string; style: CSSProperties }[] = [
    { kind: 'trench', color: '#B49A6C', style: { left: '4%', top: '6%', width: '48%', height: '50%', ['--rot' as string]: '-7deg' } },
    { kind: 'knit', color: '#7A8B6F', style: { left: '42%', top: '0%', width: '44%', height: '44%', ['--rot' as string]: '5deg', animationDelay: '-2s' } },
    { kind: 'jeans', color: '#3E5A7E', style: { left: '22%', top: '44%', width: '40%', height: '52%', ['--rot' as string]: '-2deg', animationDelay: '-4s' } },
    { kind: 'boots', color: '#5C4033', style: { left: '60%', top: '62%', width: '30%', height: '30%', ['--rot' as string]: '9deg', animationDelay: '-1s' } },
  ];
  return (
    <main className="screen welcome">
      <div className="welcome-sky" aria-hidden="true" />
      <div className="welcome-look" aria-hidden="true">
        {look.map((g) => <span key={g.kind} className="float" style={g.style}><Garment kind={g.kind} color={g.color} /></span>)}
      </div>
      <h1>Dressed for the forecast.</h1>
      <p className="t-body">Photograph your clothes once. Every morning, Wearther Mode picks a look from them for the hours you’re actually outside.</p>
      <div className="stack">
        <button className="btn primary lg" onClick={() => d({ type: 'go', route: 'onb-day' })}>Get started</button>
        <button className="btn quiet" onClick={() => d({ type: 'go', route: 'signin' })}>I already have an account</button>
        <p className="t-micro center muted">Free for 7 days. No card needed.</p>
      </div>
    </main>
  );
}

const HOURS = Array.from({ length: 19 }, (_, i) => i + 5);
const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;

const FEEL: { v: Thermal; t: string; sub: string; fill: string; level: string }[] = [
  { v: 'cold', t: 'I feel the cold', sub: 'Usually the one in a jumper', fill: '25%', level: 'var(--sky-frost)' },
  { v: 'neutral', t: 'About average', sub: 'Dress me like the forecast says', fill: '55%', level: 'var(--sky-fresh)' },
  { v: 'warm', t: 'I run warm', sub: 'T-shirt while others wear coats', fill: '85%', level: 'var(--sky-heat)' },
];

/** Step 1 of 3: the hours you're out, and how you feel the cold. */
export function OnbDay() {
  const { s, d } = useStore();
  return (
    <main className="screen">
      <Progress step={1} of={3} />
      <h1 className="t-display">When are you outside?</h1>
      <p className="t-body muted head-sub">We dress you for these hours, not just the morning.</p>
      <div className="time-pair">
        <label className="time-big">
          <span>Out at</span>
          <select value={s.win.leave} onChange={(e) => d({ type: 'patch', patch: { win: { ...s.win, leave: +e.target.value } } })}>
            {HOURS.filter((h) => h < s.win.back).map((h) => <option key={h} value={h}>{hh(h)}</option>)}
          </select>
        </label>
        <span className="dash" aria-hidden="true">to</span>
        <label className="time-big">
          <span>Back at</span>
          <select value={s.win.back} onChange={(e) => d({ type: 'patch', patch: { win: { ...s.win, back: +e.target.value } } })}>
            {HOURS.filter((h) => h > s.win.leave).map((h) => <option key={h} value={h}>{hh(h)}</option>)}
          </select>
        </label>
      </div>
      <fieldset className="group">
        <legend>How do you feel the cold?</legend>
        <ThermalCards />
      </fieldset>
      <div className="sticky-cta">
        <button className="btn primary lg" onClick={() => d({ type: 'go', route: 'onb-place' })}>Continue</button>
      </div>
    </main>
  );
}

export const OnbThermal = OnbDay;

export function ThermalCards() {
  const { s, d } = useStore();
  return (
    <div className="feel-cards" role="radiogroup" aria-label="How you feel the cold">
      {FEEL.map((o) => (
        <button key={o.v} role="radio" aria-checked={s.thermal === o.v} className="feel-card" onClick={() => d({ type: 'patch', patch: { thermal: o.v } })}>
          <span className="thermo" aria-hidden="true" style={{ ['--fill' as string]: o.fill, ['--level' as string]: o.level } as CSSProperties}><i /></span>
          <span><strong>{o.t}</strong><span>{o.sub}</span></span>
        </button>
      ))}
    </div>
  );
}

/** Compact version for Settings. */
export function ThermalChips() {
  const { s, d } = useStore();
  return (
    <div className="seg" role="radiogroup" aria-label="How you feel the cold">
      {FEEL.map((o) => (
        <button key={o.v} role="radio" aria-checked={s.thermal === o.v} onClick={() => d({ type: 'patch', patch: { thermal: o.v } })}>
          {o.v === 'cold' ? 'Feel the cold' : o.v === 'warm' ? 'Run warm' : 'Average'}
        </button>
      ))}
    </div>
  );
}

export function OnbPlace() {
  const { s, d } = useStore();
  const [city, setCity] = useState(s.place);
  const [busy, setBusy] = useState<'gps' | 'city' | null>(null);
  const [error, setError] = useState('');

  const locateMe = () => {
    if (!navigator.geolocation) return setError('This browser can’t share your location. Type your city instead.');
    setBusy('gps');
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: Math.round(pos.coords.latitude * 100) / 100, lon: Math.round(pos.coords.longitude * 100) / 100 };
        d({ type: 'patch', patch: { coords } });
        setBusy(null);
        d({ type: 'go', route: 'starter' });
      },
      () => { setBusy(null); setError('No problem. Type your city instead.'); },
      { maximumAge: 3_600_000, timeout: 10_000 },
    );
  };

  const lookUpCity = async () => {
    const q = city.trim();
    if (!q) return setError('Type a city, like London or Toronto.');
    setBusy('city');
    setError('');
    try {
      const g = s.demo ? { name: q, lat: 0, lon: 0 } : await api.geocode(q);
      d({ type: 'patch', patch: { place: g.name, coords: s.demo ? null : { lat: g.lat, lon: g.lon } } });
      d({ type: 'go', route: 'starter' });
    } catch (e) {
      setError(e instanceof ApiError && e.code === 'offline' ? 'You’re offline. Connect and try again.' : `We couldn’t find “${q}”. Try the nearest big city.`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="screen">
      <Progress step={2} of={3} />
      <h1 className="t-display">Whose sky are we reading?</h1>
      <p className="t-body muted head-sub">Only a rough area, about the size of a town, is sent for the forecast.</p>
      <button className="btn primary lg block" onClick={locateMe} disabled={busy !== null}>
        <Icon name="pin" /> {busy === 'gps' ? 'Finding you…' : 'Use my location'}
      </button>
      <form className="stack" onSubmit={(e) => { e.preventDefault(); void lookUpCity(); }}>
        <label className="field">
          <span>Or type your city</span>
          <input value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" placeholder="London" />
        </label>
        <button className="btn secondary block" type="submit" disabled={busy !== null}>{busy === 'city' ? 'Looking it up…' : 'Use this city'}</button>
      </form>
      {error && <p className="note alert" role="alert">{error}</p>}
    </main>
  );
}

export function Starter() {
  const { s, d } = useStore();
  const missing = missingSlots(s.closet);
  const count = (slot: string) => s.closet.filter((i) => i.slot === slot).length;
  return (
    <main className="screen">
      <Progress step={3} of={3} />
      <h1 className="t-display">Add what you wear most</h1>
      <p className="t-body muted head-sub">Fifteen pieces is plenty. You do this once, then only when you buy something new.</p>
      <ul className="starter">
        {STARTER.map((row) => {
          const c = count(row.slot);
          const ok = c >= row.want;
          return (
            <li key={row.slot} className={ok ? 'is-done' : ''}>
              <span className="tick" aria-hidden="true">{ok ? <Icon name="check" size={14} /> : null}</span>
              <span><strong>{SLOT_LABEL[row.slot]}</strong><small>{row.hint}</small></span>
              <span className="num" aria-label={`${c} of ${row.want}`}>{c}/{row.want}</span>
            </li>
          );
        })}
      </ul>

      <AddFlow compact />

      <div className="sticky-cta">
        <p className="t-small muted center">
          {missing.length ? `To see a look, add ${missing.join(', ')}.` : `${s.closet.length} pieces added. Add more any time.`}
        </p>
        <button
          className="btn primary lg"
          disabled={missing.length > 0}
          onClick={() => {
            void requestPersistence();
            d({ type: 'go', route: s.email ? 'today' : 'signin' });
          }}
        >
          See today’s look
        </button>
      </div>
    </main>
  );
}

export function SignIn() {
  const { s, d } = useStore();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const valid = /.+@.+\..+/.test(email);

  const messages: Record<string, string> = {
    offline: 'You’re offline. Connect and try again.',
    invalid_email: 'That email doesn’t look right.',
    wrong_code: 'That code isn’t right. Check the email and try again.',
    code_expired: 'That code has expired. Ask for a new one.',
    too_many_requests: 'Too many tries. Wait a few minutes and try again.',
  };
  const fail = (e: unknown) => setError(messages[e instanceof ApiError ? e.code : ''] ?? 'Something went wrong. Try again.');

  const send = async () => {
    setBusy(true); setError('');
    try {
      if (!s.demo) await api.requestCode(email);
      setSent(true);
    } catch (e) { fail(e); } finally { setBusy(false); }
  };

  const verify = async () => {
    setBusy(true); setError('');
    try {
      if (s.demo) {
        d({ type: 'patch', patch: { email, trialStart: s.isoToday, onboarded: true } });
      } else {
        const { user } = await api.verify(email, code);
        // Signing in on a new phone: bring the closet back from the backup.
        const backup = s.closet.length ? null : await api.getCloset().catch(() => null);
        d({ type: 'patch', patch: {
          email: user.email, trialStart: user.trialStart, subscribed: user.subscribed, onboarded: true,
          ...(backup?.data ? restore(backup.data) : {}),
        } });
      }
      void requestPersistence();
      d({ type: 'go', route: 'today' });
    } catch (e) { fail(e); } finally { setBusy(false); }
  };

  return (
    <main className="screen">
      <h1 className="t-display">{s.closet.length ? 'Save your closet' : 'Welcome back'}</h1>
      <p className="t-body muted head-sub">
        {s.closet.length
          ? 'Your photos stay on this phone and are backed up to your account, so they’re safe if you change phones. Saving starts your free week.'
          : 'Sign in and we’ll bring your closet back.'}
      </p>
      {!sent ? (
        <form className="stack" onSubmit={(e) => { e.preventDefault(); if (valid) void send(); }}>
          <label className="field">
            <span>Email</span>
            <input type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <button className="btn primary lg" type="submit" disabled={!valid || busy}>{busy ? 'Sending…' : 'Email me a code'}</button>
        </form>
      ) : (
        <form className="stack" onSubmit={(e) => { e.preventDefault(); if (code.length === 6) void verify(); }}>
          <p className="t-body">We sent a 6-digit code to <strong>{email}</strong>.</p>
          <label className="field">
            <span>Code</span>
            <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
          </label>
          <button className="btn primary lg" type="submit" disabled={code.length !== 6 || busy}>{busy ? 'Checking…' : s.closet.length ? 'Start my free week' : 'Sign in'}</button>
          <button className="btn quiet" type="button" onClick={() => { setSent(false); setCode(''); }}>Use a different email</button>
        </form>
      )}
      {error && <p className="note alert" role="alert">{error}</p>}
    </main>
  );
}
