import { useState } from 'react';
import { Sheet } from '../components/ui';
import { Icon } from '../components/Icon';
import { useStore } from '../state/store';

export function PaywallSheet({ onClose }: { onClose?: () => void }) {
  const { d } = useStore();
  const [plan, setPlan] = useState<'year' | 'month'>('year');
  return (
    <Sheet title="Your free week is over" onClose={onClose}>
      <p className="t-body">Keep getting an outfit for your whole day, every morning.</p>
      <div className="plans" role="radiogroup" aria-label="Choose a plan">
        <button role="radio" aria-checked={plan === 'year'} className="plan" onClick={() => setPlan('year')}>
          <span className="plan-name">Yearly</span>
          <span className="plan-price">$24.99 a year</span>
          <span className="plan-note">About $2.08 a month, 48% less than monthly</span>
        </button>
        <button role="radio" aria-checked={plan === 'month'} className="plan" onClick={() => setPlan('month')}>
          <span className="plan-name">Monthly</span>
          <span className="plan-price">$3.99 a month</span>
          <span className="plan-note">Cancel any time</span>
        </button>
      </div>
      <button
        className="btn primary"
        onClick={() => {
          d({ type: 'patch', patch: { subscribed: true } });
          d({ type: 'toast', text: 'You’re subscribed. Welcome back.' });
          onClose?.();
        }}
      >
        Subscribe {plan === 'year' ? 'yearly' : 'monthly'}
      </button>
      <p className="t-small muted">
        Your closet stays yours either way. You can still browse it and export it from Settings. Prices are placeholders for testing.
      </p>
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
      <button className="btn secondary" onClick={onClose}>Done</button>
    </Sheet>
  );
}

export function NotifySheet({ onClose }: { onClose: () => void }) {
  const { s, d } = useStore();
  const [time, setTime] = useState(s.notifyAt ?? '07:30');
  const turnOn = async () => {
    let ok = false;
    try {
      ok = typeof Notification !== 'undefined' && (await Notification.requestPermission()) === 'granted';
    } catch {
      ok = false;
    }
    d({ type: 'patch', patch: { notifyAt: time } });
    d({ type: 'toast', text: ok ? `We’ll send your outfit at ${time}` : `Saved. Allow notifications in your browser to get them.` });
    onClose();
  };
  return (
    <Sheet title="Get your outfit before you get up" onClose={onClose}>
      <p className="t-body">One notification each morning with the temperature, any rain and what to wear. Nothing else.</p>
      <label className="field">
        <span>Send it at</span>
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </label>
      <p className="t-small muted">On iPhone, this works once Wearther Mode is on your Home Screen (iOS 16.4 or later).</p>
      <button className="btn primary" onClick={turnOn}>Turn on notifications</button>
      <button className="btn ghost" onClick={onClose}>Not now</button>
    </Sheet>
  );
}
