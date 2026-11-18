import { useState } from 'react';
import { Sheet } from '../components/ui';
import { Icon } from '../components/Icon';
import { useStore, trialDay, accessOf } from '../state/store';
import { PLAN } from '../plans';
import { api, ApiError, tz } from '../api';

export function PaywallSheet({ onClose }: { onClose?: () => void }) {
  const { s, d } = useStore();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const access = accessOf(s);
  const subscribe = async () => {
    if (s.demo) {
      d({ type: 'patch', patch: { subscribed: true } });
      d({ type: 'toast', text: 'You’re subscribed. Thank you.' });
      onClose?.();
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      const { url } = await api.checkout('month');
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
  const after = PLAN.trialDays + 1;
  const steps = [
    { d: 1, title: 'Your free week starts', text: `Every look, every morning, plus ${PLAN.trialModelImages} picture of a look on you.` },
    { d: PLAN.trialDays - 1, title: 'We remind you', text: 'An email two days before it ends.' },
    { d: after, title: `${PLAN.freeLooks} more free looks`, text: 'Then pick the plan to keep going. No card until then.' },
  ];
  const upcoming = steps.find((y) => y.d >= day);
  const title = access.tier === 'locked' ? `You’ve used your ${PLAN.freeLooks} free looks`
    : access.tier === 'free' ? 'Your free week is over' : 'How your free week works';
  return (
    <Sheet title={title} onClose={onClose}>
      <ol className="timeline">
        {steps.map((x) => (
          <li key={x.d} className={day > x.d ? 'is-past' : x === upcoming ? 'is-now' : ''}>
            <span className="dot">{day > x.d ? <Icon name="check" size={16} /> : <span className="t-micro">{x.d}</span>}</span>
            <div><strong>Day {x.d}: {x.title}</strong><span>{x.text}</span></div>
          </li>
        ))}
      </ol>
      <section className="plan-card" aria-labelledby="plan-name">
        <p className="plan-head"><span id="plan-name">Wearther Mode</span><span className="plan-price"><b>{PLAN.priceLabel}</b> a month</span></p>
        <ul className="plan-list">
          <li><Icon name="check" size={18} /> A look from your own closet every morning, as many as you like</li>
          <li><Icon name="check" size={18} /> {PLAN.modelImagesPerMonth} pictures a month of a look on you</li>
          <li><Icon name="check" size={18} /> Cancel any time</li>
        </ul>
      </section>
      <button className="btn primary lg block" onClick={() => void subscribe()} disabled={busy}>
        {busy ? 'Opening checkout…' : `Subscribe for ${PLAN.priceLabel} a month`}
      </button>
      {msg && <p className="note" role="status">{msg}</p>}
      <p className="t-micro muted center">Without the plan you can still browse and export your closet.</p>
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
