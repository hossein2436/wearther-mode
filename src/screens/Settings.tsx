import { useState } from 'react';
import { useStore, trialDay, resetEverything } from '../state/store';
import { Header, Chip, Sheet } from '../components/ui';
import { Icon } from '../components/Icon';
import { ThermalChips } from './Onboarding';
import { InstallSheet, NotifySheet, PaywallSheet } from './Sheets';
import { SCENARIOS, type ScenarioId } from '../data/mock';
import { describeFeature, strongest } from '../engine/taste';
import { api } from '../api';
import { protoMode } from './format';

const HOURS = Array.from({ length: 19 }, (_, i) => i + 5);
const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;

export function Settings() {
  const { s, d } = useStore();
  const [sheet, setSheet] = useState<null | 'install' | 'notify' | 'plans' | 'delete' | 'city' | 'style'>(null);
  const [typed, setTyped] = useState('');
  const [city, setCity] = useState(s.place);
  const [cityMsg, setCityMsg] = useState('');
  const day = trialDay(s);
  const learned = strongest(s.taste, 4);

  const saveCity = async () => {
    const q = city.trim();
    if (!q) return;
    setCityMsg('Looking it up…');
    try {
      const g = s.demo ? { name: q, lat: 0, lon: 0 } : await api.geocode(q);
      d({ type: 'patch', patch: { place: g.name, coords: s.demo ? null : { lat: g.lat, lon: g.lon }, forecast: null } });
      setCity(g.name);
      setSheet(null);
      d({ type: 'toast', text: `Forecast set to ${g.name}` });
    } catch {
      setCityMsg(`We couldn’t find “${q}”. Try the nearest big city.`);
    }
  };
  const locateMe = () =>
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        d({ type: 'patch', patch: { coords: { lat: Math.round(pos.coords.latitude * 100) / 100, lon: Math.round(pos.coords.longitude * 100) / 100 }, forecast: null } });
        setSheet(null);
        d({ type: 'toast', text: 'Using your location' });
      },
      () => setCityMsg('Location is off. Type your city instead.'),
    );
  const exportCloset = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), closet: s.closet, worn: s.worn }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'wearther-mode-closet.json';
    a.click();
    URL.revokeObjectURL(a.href);
    d({ type: 'toast', text: 'Closet exported' });
  };
  const subText = s.subscribed ? 'Subscribed. Thank you.'
    : day === null ? 'Starts when you save your closet'
    : day >= 8 ? 'Free week ended'
    : `${8 - day} ${8 - day === 1 ? 'day' : 'days'} of your free week left`;

  return (
    <main className="screen has-tabs">
      <Header title="You" />

      <h2 className="list-head">Your day</h2>
      <div className="list">
        <div className="list-row">
          <span className="row-icon" style={{ ['--a' as string]: '#ffd23f', ['--b' as string]: '#ff9f0a' }}><Icon name="sunny" size={20} /></span>
          <span className="label"><strong>Out at</strong></span>
          <select aria-label="Out at" value={s.win.leave} onChange={(e) => d({ type: 'patch', patch: { win: { ...s.win, leave: +e.target.value } } })}>
            {HOURS.filter((h) => h < s.win.back).map((h) => <option key={h} value={h}>{hh(h)}</option>)}
          </select>
        </div>
        <div className="list-row">
          <span className="row-icon" style={{ ['--a' as string]: '#7b95ff', ['--b' as string]: '#4b63ff' }}><Icon name="today" size={20} /></span>
          <span className="label"><strong>Back at</strong></span>
          <select aria-label="Back at" value={s.win.back} onChange={(e) => d({ type: 'patch', patch: { win: { ...s.win, back: +e.target.value } } })}>
            {HOURS.filter((h) => h > s.win.leave).map((h) => <option key={h} value={h}>{hh(h)}</option>)}
          </select>
        </div>
        <button className="list-row tap" onClick={() => { setCityMsg(''); setSheet('city'); }}>
          <span className="row-icon" style={{ ['--a' as string]: '#2fbfae', ['--b' as string]: '#11a08f' }}><Icon name="pin" size={20} /></span>
          <span className="label"><strong>Forecast for</strong><small>{s.place || (s.coords ? 'Your location' : 'Not set')}</small></span>
          <Icon name="chevron" />
        </button>
        <div className="list-row">
          <span className="row-icon" style={{ ['--a' as string]: '#ff8a5c', ['--b' as string]: '#ff3d00' }}><Icon name="light" size={20} /></span>
          <span className="label"><strong>Temperature</strong></span>
          <div className="seg" role="radiogroup" aria-label="Temperature units" style={{ width: 132 }}>
            <button role="radio" aria-checked={s.units === 'C'} onClick={() => d({ type: 'patch', patch: { units: 'C' } })}>°C</button>
            <button role="radio" aria-checked={s.units === 'F'} onClick={() => d({ type: 'patch', patch: { units: 'F' } })}>°F</button>
          </div>
        </div>
      </div>

      <h2 className="list-head">How you feel the cold</h2>
      <ThermalChips />
      {s.learnedOffset !== 0 && (
        <p className="t-small muted">From your check-ins, we dress you {Math.abs(s.learnedOffset)}° {s.learnedOffset < 0 ? 'warmer' : 'cooler'} than average.</p>
      )}

      <h2 className="list-head">Your style</h2>
      <div className="list">
        <div className="list-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <span className="label">
            <strong>What we’ve learned</strong>
            <small>{s.tasteEvidence ? `From ${s.tasteEvidence} looks you wore, loved or skipped.` : 'Wear, love or skip a few looks and this fills in.'}</small>
          </span>
          {(learned.likes.length > 0 || learned.avoids.length > 0) && (
            <div className="taste-tags" style={{ marginTop: 8 }}>
              {learned.likes.map((f) => <span key={f} className="taste-tag">{describeFeature(f)}</span>)}
              {learned.avoids.map((f) => <span key={f} className="taste-tag no">{describeFeature(f)}</span>)}
            </div>
          )}
        </div>
        <label className="list-row">
          <span className="row-icon" style={{ ['--a' as string]: '#b07bff', ['--b' as string]: '#7b3dff' }}><Icon name="sparkle" size={20} /></span>
          <span className="label">
            <strong>Help improve picks for everyone</strong>
            <small>Shares which kinds of looks you choose, never photos or item names.</small>
          </span>
          <input
            type="checkbox"
            className="toggle"
            checked={s.shareTaste}
            onChange={(e) => d({ type: 'patch', patch: { shareTaste: e.target.checked, tasteQueue: [] } })}
          />
        </label>
        <button className="list-row tap" onClick={() => setSheet('style')}>
          <span className="row-icon" style={{ ['--a' as string]: '#ff6fa3', ['--b' as string]: '#ff3d7f' }}><Icon name="hanger" size={20} /></span>
          <span className="label"><strong>How we pick looks</strong></span>
          <Icon name="chevron" />
        </button>
      </div>

      <h2 className="list-head">Mornings</h2>
      <div className="list">
        <div className="list-row">
          <span className="row-icon" style={{ ['--a' as string]: '#ffc53a', ['--b' as string]: '#ff9d00' }}><Icon name="bell" size={20} /></span>
          <span className="label"><strong>Morning look</strong><small>{s.notifyAt ? `Every day at ${s.notifyAt}` : 'Off'}</small></span>
          {s.notifyAt ? (
            <button className="btn quiet" onClick={() => { if (!s.demo) void api.pushUnsubscribe().catch(() => undefined); d({ type: 'patch', patch: { notifyAt: null } }); }}>Turn off</button>
          ) : (
            <button className="btn secondary" onClick={() => setSheet('notify')}>Turn on</button>
          )}
        </div>
        <button className="list-row tap" onClick={() => setSheet('install')}>
          <span className="row-icon" style={{ ['--a' as string]: '#5b6bff', ['--b' as string]: '#2a35d8' }}><Icon name="plusbox2" size={20} /></span>
          <span className="label"><strong>Add to Home Screen</strong></span>
          <Icon name="chevron" />
        </button>
      </div>

      <h2 className="list-head">Account</h2>
      <div className="list">
        <div className="list-row">
          <span className="row-icon" style={{ ['--a' as string]: '#ffcf4a', ['--b' as string]: '#f59e0b' }}><Icon name="crown" size={20} /></span>
          <span className="label"><strong>Subscription</strong><small>{subText}</small></span>
          {!s.subscribed && <button className="btn secondary" onClick={() => setSheet('plans')}>See plans</button>}
        </div>
        {s.email && (
          <div className="list-row">
            <span className="row-icon" style={{ ['--a' as string]: '#9aa3b5', ['--b' as string]: '#5b6475' }}><Icon name="user" size={20} /></span>
            <span className="label"><strong>Signed in</strong><small>{s.email}</small></span>
            <button className="btn quiet" onClick={() => { if (!s.demo) void api.logout().catch(() => undefined); d({ type: 'patch', patch: { email: null } }); }}>Sign out</button>
          </div>
        )}
      </div>

      <h2 className="list-head">Your data</h2>
      <p className="t-small muted">
        Photos are cut out on our server and the original is deleted. Your closet lives on this phone and is backed up to your account. The forecast uses only a rough area. No ads, and we never sell data.
      </p>
      <div className="list">
        <button className="list-row tap" onClick={exportCloset}>
          <span className="row-icon" style={{ ['--a' as string]: '#2fbf71', ['--b' as string]: '#14935a' }}><Icon name="share" size={20} /></span>
          <span className="label"><strong>Export my closet</strong></span>
          <Icon name="share" />
        </button>
        <button className="list-row tap danger" onClick={() => setSheet('delete')}>
          <span className="row-icon" style={{ ['--a' as string]: '#ff7a6b', ['--b' as string]: '#e5402a' }}><Icon name="trash" size={20} /></span>
          <span className="label"><strong>Delete all my data</strong></span>
        </button>
      </div>

      {(s.demo || protoMode()) && (
        <section className="proto" aria-labelledby="set-proto">
          <h2 id="set-proto" className="t-small" style={{ fontWeight: 650 }}>Prototype controls</h2>
          <p className="t-micro muted">For reviewing the design. Not part of the real app.</p>
          <div className="chips">
            {(Object.keys(SCENARIOS) as ScenarioId[]).map((id) => (
              <Chip key={id} on={s.scenario === id} onClick={() => d({ type: 'patch', patch: { scenario: id, place: SCENARIOS[id].place } })}>{SCENARIOS[id].label}</Chip>
            ))}
          </div>
          <div className="chips">
            {[null, 1, 5, 8].map((v) => (
              <Chip key={String(v)} on={s.simDay === v} onClick={() => d({ type: 'patch', patch: { simDay: v, subscribed: false } })}>{v === null ? 'Real trial' : `Day ${v}`}</Chip>
            ))}
          </div>
          <div className="chips">
            <Chip on={s.offline} onClick={() => d({ type: 'patch', patch: { offline: !s.offline } })}>Offline</Chip>
            <Chip on={false} onClick={() => { d({ type: 'patch', patch: { checkInFor: '2000-01-01' } }); d({ type: 'go', route: 'today' }); }}>Morning check-in</Chip>
            <Chip on={false} onClick={() => { d({ type: 'loadSample' }); d({ type: 'toast', text: 'Sample closet loaded' }); }}>Sample closet</Chip>
          </div>
        </section>
      )}

      {sheet === 'install' && <InstallSheet onClose={() => setSheet(null)} />}
      {sheet === 'notify' && <NotifySheet onClose={() => setSheet(null)} />}
      {sheet === 'plans' && <PaywallSheet onClose={() => setSheet(null)} />}
      {sheet === 'city' && (
        <Sheet title="Forecast for" onClose={() => setSheet(null)}>
          <button className="btn secondary block" type="button" onClick={locateMe}><Icon name="pin" /> Use my location</button>
          <form className="stack" onSubmit={(e) => { e.preventDefault(); void saveCity(); }}>
            <label className="field">
              <span>Or type a city</span>
              <input value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" />
            </label>
            <button className="btn primary block" type="submit">Save city</button>
            {cityMsg && <p className="t-small muted" role="status">{cityMsg}</p>}
          </form>
        </Sheet>
      )}
      {sheet === 'style' && (
        <Sheet title="How we pick looks" onClose={() => setSheet(null)}>
          <ol className="timeline">
            <li className="is-past"><span className="dot"><Icon name="sun" size={16} /></span><div><strong>Weather first</strong><span>Hour by hour for the time you’re out: warm enough at the coldest hour, not too hot once the coat is off, nothing that hates rain on a wet day.</span></div></li>
            <li className="is-past"><span className="dot"><Icon name="hanger" size={16} /></span><div><strong>Then what goes together</strong><span>Colour (neutral base with one colour, tonal, neighbouring or softened opposites), light against dark, one loud piece at most, shoes at the same dress level, one pattern at a time.</span></div></li>
            <li className="is-now"><span className="dot"><Icon name="heart" size={16} /></span><div><strong>Then you</strong><span>Every look you wear, love or skip teaches us your taste. It counts more than any rule.</span></div></li>
          </ol>
          <button className="btn quiet" onClick={() => { d({ type: 'patch', patch: { taste: {}, tasteEvidence: 0, loved: [] } }); d({ type: 'toast', text: 'Your style is reset' }); setSheet(null); }}>Reset what we’ve learned</button>
        </Sheet>
      )}
      {sheet === 'delete' && (
        <Sheet title="Delete all your data?" onClose={() => setSheet(null)}>
          <p className="t-body">This removes your closet, photos, wear history and account from this phone and our server. It can’t be undone.</p>
          <label className="field">
            <span>Type delete to confirm</span>
            <input value={typed} onChange={(e) => setTyped(e.target.value)} autoCapitalize="none" />
          </label>
          <button
            className="btn danger block"
            disabled={typed.trim().toLowerCase() !== 'delete'}
            onClick={async () => {
              if (s.email && !s.demo) {
                try { await api.deleteMe(); } catch { d({ type: 'toast', text: 'We couldn’t reach the server. Try again when you’re online.' }); return; }
              }
              await resetEverything();
              d({ type: 'reset' });
            }}
          >
            Delete everything
          </button>
        </Sheet>
      )}
    </main>
  );
}
