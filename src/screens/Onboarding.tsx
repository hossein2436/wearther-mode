import { useState } from 'react';
import { useStore } from '../state/store';
import { Progress, Chip } from '../components/ui';
import { Icon } from '../components/Icon';
import { Garment } from '../components/Garment';
import { STARTER, SLOT_LABEL } from '../data/catalog';
import { missingSlots } from '../engine';
import { AddFlow } from './AddFlow';
import { requestPersistence } from '../state/db';

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
      </div>
    </main>
  );
}

const HOURS = Array.from({ length: 19 }, (_, i) => i + 5);
const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;

export function OnbDay() {
  const { s, d } = useStore();
  return (
    <main className="screen">
      <Progress step={1} of={4} />
      <h1 className="t-title">When are you out?</h1>
      <p className="t-body muted">We dress you for these hours, not just the morning.</p>
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
      <div className="stack-actions">
        <button className="btn primary" onClick={() => d({ type: 'go', route: 'onb-thermal' })}>Continue</button>
        <button className="btn ghost" onClick={() => d({ type: 'go', route: 'onb-thermal' })}>Skip, use 08:00 to 18:00</button>
      </div>
    </main>
  );
}

export function OnbThermal() {
  const { s, d } = useStore();
  const opts = [
    { v: 'cold', t: 'I feel the cold', sub: 'Usually the one wearing a jumper' },
    { v: 'neutral', t: 'About average', sub: '' },
    { v: 'warm', t: 'I run warm', sub: 'T-shirt while others wear coats' },
  ] as const;
  return (
    <main className="screen">
      <Progress step={2} of={4} />
      <h1 className="t-title">How do you feel the cold?</h1>
      <p className="t-body muted">We’ll fine-tune this from your morning check-ins.</p>
      <div className="choice-list" role="radiogroup" aria-label="How you feel the cold">
        {opts.map((o) => (
          <button key={o.v} role="radio" aria-checked={s.thermal === o.v} className="choice" onClick={() => d({ type: 'patch', patch: { thermal: o.v } })}>
            <span className="choice-title">{o.t}</span>
            {o.sub && <span className="choice-sub">{o.sub}</span>}
          </button>
        ))}
      </div>
      <div className="stack-actions">
        <button className="btn primary" onClick={() => d({ type: 'go', route: 'onb-place' })}>Continue</button>
      </div>
    </main>
  );
}

export function OnbPlace() {
  const { s, d } = useStore();
  const [asked, setAsked] = useState(false);
  const [city, setCity] = useState(s.place);
  const useLocation = () => {
    setAsked(true);
    navigator.geolocation?.getCurrentPosition(
      () => d({ type: 'go', route: 'starter' }),
      () => d({ type: 'toast', text: 'No problem. Type your city instead.' }),
      { maximumAge: 3_600_000, timeout: 8000 },
    );
  };
  return (
    <main className="screen">
      <Progress step={3} of={4} />
      <h1 className="t-title">Where are you?</h1>
      <p className="t-body muted">
        We use your location to get the forecast. Only a rough area, about the size of a town, is sent to our server.
      </p>
      <div className="stack-actions">
        <button className="btn primary" onClick={useLocation}>Use my location</button>
      </div>
      <form
        className="city-form"
        onSubmit={(e) => {
          e.preventDefault();
          d({ type: 'patch', patch: { place: city.trim() || s.place } });
          d({ type: 'go', route: 'starter' });
        }}
      >
        <label className="field">
          <span>{asked ? 'Or type your city' : 'Or type your city instead'}</span>
          <input value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" />
        </label>
        <button className="btn secondary" type="submit">Use this city</button>
      </form>
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
      <Progress step={4} of={4} />
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
  const valid = /.+@.+\..+/.test(email);
  return (
    <main className="screen">
      <h1 className="t-title">Save your closet</h1>
      <p className="t-body muted">
        Your photos stay on this phone and are backed up to your account, so they’re still here if you change phones. Saving starts your free week.
      </p>
      {!sent ? (
        <form className="city-form" onSubmit={(e) => { e.preventDefault(); if (valid) setSent(true); }}>
          <label className="field">
            <span>Email</span>
            <input type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <button className="btn primary" type="submit" disabled={!valid}>Email me a code</button>
        </form>
      ) : (
        <form
          className="city-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.length !== 6) return;
            d({ type: 'patch', patch: { email, trialStart: s.isoToday, onboarded: true } });
            d({ type: 'go', route: 'today' });
          }}
        >
          <p className="t-body">We sent a 6-digit code to {email}.</p>
          <label className="field">
            <span>Code</span>
            <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
          </label>
          <button className="btn primary" type="submit" disabled={code.length !== 6}>Start my free week</button>
          <p className="t-small muted">Prototype: any 6 digits work.</p>
        </form>
      )}
      <div className="stack-actions">
        <button className="btn ghost" onClick={() => { d({ type: 'patch', patch: { onboarded: true, trialStart: s.isoToday } }); d({ type: 'go', route: 'today' }); }}>
          Skip for now
        </button>
      </div>
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
