import { useState } from 'react';
import { Sheet } from '../components/ui';
import { Icon } from '../components/Icon';
import { useStore, trialDay } from '../state/store';
import { api, ApiError, tz } from '../api';

export function PaywallSheet({ onClose }: { onClose?: () => void }) {
  const { s, d } = useStore();
  const [plan, setPlan] = useState<'year' | 'month'>('year');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const subscribe = async () => {
    if (s.demo) {
      d({ type: 'patch', patch: { subscribed: true } });
      d({ type: 'toast', text: 'You’re subscribed. Welcome back.' });
      onClose?.();
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      const { url } = await api.checkout(plan);
      location.href = url;
    } catch (e) {
      setMsg(e instanceof ApiError && e.status === 501
        ? 'Subscriptions open very soon. We’ll email you the moment they do, and your closet stays safe until then.'
        : 'We couldn’t start checkout. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };
  const day = trialDay(s) ?? 1;
  const over = day >= 8;
  const steps = [
    { d: 1, title: 'Your free week starts', text: 'Every look, every morning, free.' },
    { d: 6, title: 'We remind you', text: 'An email two days before it ends.' },
    { d: 8, title: 'Pick a plan to keep going', text: 'No card until then. Your closet is yours either way.' },
  ];
  const upcoming = steps.find((y) => y.d >= day);
  return (
    <Sheet title={over ? 'Your free week is over' : 'How your free week works'} onClose={onClose}>
      <ol className="timeline">
        {steps.map((x) => (
          <li key={x.d} className={day > x.d ? 'is-past' : x === upcoming ? 'is-now' : ''}>
            <span className="dot">{day > x.d ? <Icon name="check" size={16} /> : <span className="t-micro">{x.d}</span>}</span>
            <div><strong>Day {x.d}: {x.title}</strong><span>{x.text}</span></div>
          </li>
        ))}
      </ol>
      <div className="plans" role="radiogroup" aria-label="Choose a plan">
        <button role="radio" aria-checked={plan === 'year'} className="plan" onClick={() => setPlan('year')}>
          <span className="plan-flag">Save 48%</span>
          <span className="plan-name">Yearly</span>
          <span className="plan-price">$24.99</span>
          <span className="plan-note">About $2.08 a month</span>
        </button>
        <button role="radio" aria-checked={plan === 'month'} className="plan" onClick={() => setPlan('month')}>
          <span className="plan-name">Monthly</span>
          <span className="plan-price">$3.99</span>
          <span className="plan-note">Cancel any time</span>
        </button>
      </div>
      <button className="btn primary lg block" onClick={() => void subscribe()} disabled={busy}>
        {busy ? 'Opening checkout…' : `Subscribe ${plan === 'year' ? 'yearly' : 'monthly'}`}
      </button>
      {msg && <p className="note" role="status">{msg}</p>}
      <p className="t-micro muted center">You can still browse and export your closet without a plan.</p>
    </Sheet>
  );
}

export function InstallSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title="Add Wearther Mode to your Home Screen" onClose={onClose}>
      <p className="t-body">It opens like an app, keeps your closet safe on this phone and can send your morning outfit.</p>
      <ol className="install-steps">
        <li><span className="install-icon"><Icon name="share" /></span>Tap Share in Safari’s toolbar.</li>
        <li><span className="install-icon"><Icon name="plusbox" /></span>Choose Add to Home Screen.</li>
        <li><span className="install-icon"><Icon name="today" /></span>Open Wearther Mode from your Home Screen.</li>
      </ol>
      <p className="t-small muted">On Android, Chrome offers Install app on its own. Accept it when it appears.</p>
      <button className="btn secondary block" onClick={onClose}>Done</button>
    </Sheet>
  );
}

export function NotifySheet({ onClose }: { onClose: () => void }) {
  const { s, d } = useStore();
  const [time, setTime] = useState(s.notifyAt ?? '07:30');
  const [busy, setBusy] = useState(false);
  const turnOn = async () => {
    setBusy(true);
    let text = `We’ll send your outfit at ${time}`;
    try {
      if (s.demo) throw new Error('demo');
      if (!s.email) throw new Error('signin');
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) throw new Error('unsupported');
      if ((await Notification.requestPermission()) !== 'granted') throw new Error('denied');
      const reg = await navigator.serviceWorker.ready;
      const { publicKey } = await api.pushKey();
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: publicKey }));
      await api.pushSubscribe({ subscription: sub.toJSON(), notifyAt: time, tz: tz(), lat: s.coords?.lat, lon: s.coords?.lon, place: s.place });
      d({ type: 'patch', patch: { notifyAt: time } });
    } catch (e) {
      const m = (e as Error).message;
      text = m === 'demo' ? `Saved for ${time}` : m === 'signin' ? 'Save your closet first, then turn this on.'
        : m === 'unsupported' ? 'This browser can’t receive notifications. On iPhone, add the app to your Home Screen first.'
        : m === 'denied' ? 'Notifications are blocked. Allow them in your browser settings.'
        : 'We couldn’t turn on notifications. Try again.';
      if (m === 'demo') d({ type: 'patch', patch: { notifyAt: time } });
    } finally {
      setBusy(false);
    }
    d({ type: 'toast', text });
    onClose();
  };
  return (
    <Sheet title="Your look, before you’re up" onClose={onClose}>
      <p className="t-body">One notification each morning: the temperature, any rain, and what to wear. Nothing else.</p>
      <label className="field">
        <span>Send it at</span>
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </label>
      <p className="t-small muted">On iPhone, this works once Wearther Mode is on your Home Screen (iOS 16.4 or later).</p>
      <button className="btn primary lg block" onClick={() => void turnOn()} disabled={busy}>{busy ? 'Turning on…' : 'Turn on notifications'}</button>
      <button className="btn quiet" onClick={onClose}>Not now</button>
    </Sheet>
  );
}
