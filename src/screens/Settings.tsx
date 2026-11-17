import { useState } from 'react';
import { useStore, trialDay, resetEverything } from '../state/store';
import { Header, Chip, Sheet } from '../components/ui';
import { ThermalChips } from './Onboarding';
import { InstallSheet, NotifySheet, PaywallSheet } from './Sheets';
import { SCENARIOS, type ScenarioId } from '../data/mock';

const HOURS = Array.from({ length: 19 }, (_, i) => i + 5);
const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;

export function Settings() {
  const { s, d } = useStore();
  const [sheet, setSheet] = useState<null | 'install' | 'notify' | 'plans' | 'delete'>(null);
  const [typed, setTyped] = useState('');
  const day = trialDay(s);

  const exportCloset = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), closet: s.closet, worn: s.worn }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'wearther-mode-closet.json';
    a.click();
    URL.revokeObjectURL(a.href);
    d({ type: 'toast', text: 'Closet exported' });
  };

  return (
    <main className="screen has-tabs settings">
      <Header title="Settings" />

      <section aria-labelledby="set-day">
        <h2 id="set-day" className="t-heading">Your day</h2>
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
        <label className="field">
          <span>City</span>
          <input value={s.place} onChange={(e) => d({ type: 'patch', patch: { place: e.target.value } })} />
        </label>
      </section>

      <section aria-labelledby="set-feel">
        <h2 id="set-feel" className="t-heading">How you feel the cold</h2>
        <ThermalChips />
        {s.learnedOffset !== 0 && (
          <p className="t-small muted">
            From your check-ins we dress you {Math.abs(s.learnedOffset)}° {s.learnedOffset < 0 ? 'warmer' : 'cooler'} than average.
          </p>
        )}
      </section>

      <section aria-labelledby="set-units">
        <h2 id="set-units" className="t-heading">Temperature</h2>
        <div className="chips">
          <Chip on={s.units === 'C'} onClick={() => d({ type: 'patch', patch: { units: 'C' } })}>Celsius</Chip>
          <Chip on={s.units === 'F'} onClick={() => d({ type: 'patch', patch: { units: 'F' } })}>Fahrenheit</Chip>
        </div>
      </section>

      <section aria-labelledby="set-notify">
        <h2 id="set-notify" className="t-heading">Morning outfit</h2>
        <p className="t-body muted">{s.notifyAt ? `Sent every day at ${s.notifyAt}.` : 'Off.'}</p>
        <div className="row-actions">
          <button className="btn secondary" onClick={() => setSheet('notify')}>{s.notifyAt ? 'Change time' : 'Turn on'}</button>
          {s.notifyAt && <button className="btn ghost" onClick={() => d({ type: 'patch', patch: { notifyAt: null } })}>Turn off</button>}
        </div>
        <button className="btn ghost" onClick={() => setSheet('install')}>Add to Home Screen</button>
      </section>

      <section aria-labelledby="set-sub">
        <h2 id="set-sub" className="t-heading">Subscription</h2>
        <p className="t-body muted">
          {s.subscribed
            ? 'You’re subscribed. Thank you.'
            : day === null
              ? 'Your free week starts when you save your closet.'
              : day >= 8
                ? 'Your free week has ended.'
                : `Free week: ${8 - day} ${8 - day === 1 ? 'day' : 'days'} left.`}
        </p>
        {!s.subscribed && <button className="btn secondary" onClick={() => setSheet('plans')}>See plans</button>}
        {s.email && <p className="t-small muted">Signed in as {s.email}</p>}
      </section>

      <section aria-labelledby="set-privacy">
        <h2 id="set-privacy" className="t-heading">Your data</h2>
        <p className="t-body muted">
          Photos of your clothes are cut out on our server, then the original is deleted. Your closet is kept on this phone and backed up to your account. For the forecast we send only a rough area, never your exact location. No ads, and we never sell data.
        </p>
        <div className="row-actions">
          <button className="btn secondary" onClick={exportCloset}>Export my closet</button>
          <button className="btn danger-ghost" onClick={() => setSheet('delete')}>Delete all my data</button>
        </div>
      </section>

      <section className="proto" aria-labelledby="set-proto">
        <h2 id="set-proto" className="t-heading">Prototype controls</h2>
        <p className="t-small muted">For reviewing the design. Not part of the real app.</p>
        <p className="t-small">Weather</p>
        <div className="chips">
          {(Object.keys(SCENARIOS) as ScenarioId[]).map((id) => (
            <Chip key={id} on={s.scenario === id} onClick={() => d({ type: 'patch', patch: { scenario: id, place: SCENARIOS[id].place } })}>
              {SCENARIOS[id].label}
            </Chip>
          ))}
        </div>
        <p className="t-small">Trial day</p>
        <div className="chips">
          {[null, 1, 5, 8].map((v) => (
            <Chip key={String(v)} on={s.simDay === v} onClick={() => d({ type: 'patch', patch: { simDay: v, subscribed: false } })}>
              {v === null ? 'Real' : `Day ${v}`}
            </Chip>
          ))}
        </div>
        <div className="chips">
          <Chip on={s.offline} onClick={() => d({ type: 'patch', patch: { offline: !s.offline } })}>Offline</Chip>
          <Chip on={false} onClick={() => { d({ type: 'patch', patch: { checkInFor: '2000-01-01' } }); d({ type: 'go', route: 'today' }); }}>Show morning check-in</Chip>
          <Chip on={false} onClick={() => { d({ type: 'loadSample' }); d({ type: 'toast', text: 'Sample closet loaded' }); }}>Load sample closet</Chip>
        </div>
      </section>

      {sheet === 'install' && <InstallSheet onClose={() => setSheet(null)} />}
      {sheet === 'notify' && <NotifySheet onClose={() => setSheet(null)} />}
      {sheet === 'plans' && <PaywallSheet onClose={() => setSheet(null)} />}
      {sheet === 'delete' && (
        <Sheet title="Delete all your data?" onClose={() => setSheet(null)}>
          <p className="t-body">This removes your closet, photos, wear history and account from this phone and our server. It can’t be undone.</p>
          <label className="field">
            <span>Type delete to confirm</span>
            <input value={typed} onChange={(e) => setTyped(e.target.value)} autoCapitalize="none" />
          </label>
          <button
            className="btn danger"
            disabled={typed.trim().toLowerCase() !== 'delete'}
            onClick={async () => { await resetEverything(); d({ type: 'reset' }); }}
          >
            Delete everything
          </button>
        </Sheet>
      )}
    </main>
  );
}
