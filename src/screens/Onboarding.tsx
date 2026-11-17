import { useState } from 'react';
import { useStore } from '../state/store';
import { Progress, Chip } from '../components/ui';
import { Icon } from '../components/Icon';
import { Garment } from '../components/Garment';
import { STARTER, SLOT_LABEL } from '../data/catalog';
import { missingSlots } from '../engine';
import { AddFlow } from './AddFlow';
import { requestPersistence } from '../state/db';
import { api, ApiError } from '../api';
import { restore } from '../state/sync';

export function Welcome() {
  const { d } = useStore();
  return (
    <main className="screen welcome">
      <div className="welcome-art" aria-hidden="true">
        <div className="welcome-ribbon" />
        <div className="welcome-pieces">
          <Garment kind="trench" color="#B49A6C" />
          <Garment kind="knit" color="#7A7E86" />
          <Garment kind="jeans" color="#3E5A7E" />
          <Garment kind="boots" color="#5C4033" />
        </div>
      </div>
      <h1 className="t-display-sm">Your closet, dressed for today’s weather.</h1>
      <p className="t-body muted">
        Photograph your clothes once. Every morning, Wearther Mode picks an outfit from them for the hours you’re actually outside.
      </p>
      <div className="stack-actions">
        <button className="btn primary" onClick={() => d({ type: 'go', route: 'onb-day' })}>Start with 15 items</button>
        <p className="t-small muted center">Free for 7 days. No card needed.</p>
        <button className="btn ghost" onClick={() => d({ type: 'go', route: 'signin' })}>I already have an account</button>
      </div>
    </main>
  );
}

const HOURS = Array.from({ length: 19 }, (_, i) => i + 5);
const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;

/** Step 1 of 3: the hours you're out and how you feel the cold, on one screen. */
export function OnbDay() {
  const { s, d } = useStore();
  const opts = [
    { v: 'cold', t: 'I feel the cold' },
    { v: 'neutral', t: 'About average' },
    { v: 'warm', t: 'I run warm' },
  ] as const;
  return (
    <main className="screen">
      <Progress step={1} of={3} />
      <h1 className="t-title">Your day</h1>
      <p className="t-body muted">We dress you for the hours you’re outside, not just the morning.</p>
      <div className="field-row">
        <label className="field">
          <span>I leave at</span>
          <select value={s.win.leave} onChange={(e) => d({ type: 'patch', patch: { win: { ...s.win, leave: +e.target.value } } })}>
            {HOURS.filter((h) => h < s.win.back).map((h) => <option key={h} value={h}>{hh(h)}</option>)}
          </select>
        </label>
        <label className="field">
          <span>I’m back at</span>
          <select value={s.win.back} onChange={(e) => d({ type: 'patch', patch: { win: { ...s.win, back: +e.target.value } } })}>
            {HOURS.filter((h) => h > s.win.leave).map((h) => <option key={h} value={h}>{hh(h)}</option>)}
          </select>
        </label>
      </div>
      <fieldset className="tag-group">
        <legend>How do you feel the cold?</legend>
        <div className="seg seg-wide" role="radiogroup" aria-label="How you feel the cold">
          {opts.map((o) => (
            <button key={o.v} role="radio" aria-checked={s.thermal === o.v} aria-pressed={s.thermal === o.v} onClick={() => d({ type: 'patch', patch: { thermal: o.v } })}>
              {o.t}
            </button>
          ))}
        </div>
        <p className="t-small muted">We fine-tune this from your morning check-ins.</p>
      </fieldset>
      <div className="stack-actions">
        <button className="btn primary" onClick={() => d({ type: 'go', route: 'onb-place' })}>Continue</button>
      </div>
    </main>
  );
}

/** Kept for old links: the thermal question now lives on the first step. */
export const OnbThermal = OnbDay;

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
      <h1 className="t-title">Where are you?</h1>
      <p className="t-body muted">
        We use your location to get the forecast. Only a rough area, about the size of a town, is sent to our server.
      </p>
      <div className="stack-actions">
        <button className="btn primary" onClick={locateMe} disabled={busy !== null}>
          {busy === 'gps' ? 'Finding you…' : 'Use my location'}
        </button>
      </div>
      <form className="city-form" onSubmit={(e) => { e.preventDefault(); void lookUpCity(); }}>
        <label className="field">
          <span>Or type your city instead</span>
          <input value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" />
        </label>
        <button className="btn secondary" type="submit" disabled={busy !== null}>{busy === 'city' ? 'Looking it up…' : 'Use this city'}</button>
      </form>
      {error && <p className="note" role="alert">{error}</p>}
    </main>
  );
}

export function Starter() {
  const { s, d } = useStore();
  const missing = missingSlots(s.closet);
  const count = (slot: string) => s.closet.filter((i) => i.slot === slot).length;
  const done = s.closet.length;
  return (
    <main className="screen">
      <Progress step={3} of={3} />
      <h1 className="t-title">Add the clothes you wear most</h1>
      <p className="t-body muted">
        Fifteen pieces is plenty to start. You do this once, and you can add new things whenever you buy them.
      </p>
      <ul className="starter-list">
        {STARTER.map((row) => {
          const c = count(row.slot);
          const ok = c >= row.want;
          return (
            <li key={row.slot} className={ok ? 'is-done' : ''}>
              <span className="starter-check" aria-hidden="true">{ok ? <Icon name="check" size={16} /> : null}</span>
              <span className="starter-text">
                <span className="starter-title">{SLOT_LABEL[row.slot]}</span>
                <span className="starter-hint">{row.hint}</span>
              </span>
              <span className="starter-count" aria-label={`${c} of ${row.want}`}>{c}/{row.want}</span>
            </li>
          );
        })}
      </ul>

      <AddFlow compact />

      <div className="sticky-cta">
        {missing.length ? (
          <p className="t-small muted center">To see an outfit, add {missing.join(', ')}.</p>
        ) : (
          <p className="t-small muted center">{done} pieces added. Add more any time.</p>
        )}
        <button
          className="btn primary"
          disabled={missing.length > 0}
          onClick={() => {
            void requestPersistence();
            d({ type: 'go', route: s.email ? 'today' : 'signin' });
          }}
        >
          See today’s outfit
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
      <h1 className="t-title">Save your closet</h1>
      <p className="t-body muted">
        Your photos stay on this phone and are backed up to your account, so they’re still here if you change phones. Saving starts your free week.
      </p>
      {!sent ? (
        <form className="city-form" onSubmit={(e) => { e.preventDefault(); if (valid) void send(); }}>
          <label className="field">
            <span>Email</span>
            <input type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <button className="btn primary" type="submit" disabled={!valid || busy}>{busy ? 'Sending…' : 'Email me a code'}</button>
        </form>
      ) : (
        <form className="city-form" onSubmit={(e) => { e.preventDefault(); if (code.length === 6) void verify(); }}>
          <p className="t-body">We sent a 6-digit code to {email}.</p>
          <label className="field">
            <span>Code</span>
            <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
          </label>
          <button className="btn primary" type="submit" disabled={code.length !== 6 || busy}>{busy ? 'Checking…' : 'Start my free week'}</button>
          <button className="btn ghost" type="button" onClick={() => { setSent(false); setCode(''); }}>Use a different email</button>
        </form>
      )}
      {error && <p className="note" role="alert">{error}</p>}
    </main>
  );
}

export function ThermalChips() {
  const { s, d } = useStore();
  return (
    <div className="chips">
      {(['cold', 'neutral', 'warm'] as const).map((t) => (
        <Chip key={t} on={s.thermal === t} onClick={() => d({ type: 'patch', patch: { thermal: t } })}>
          {t === 'cold' ? 'I feel the cold' : t === 'warm' ? 'I run warm' : 'About average'}
        </Chip>
      ))}
    </div>
  );
}
