import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { useStore, type Route } from '../state/store';

/** Line icon at rest, filled when active (v4: no blob, no animation; the pill background marks the page). */
const TAB_ICONS: Record<string, [ReactNode, ReactNode]> = {
  today: [
    <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3L19 19M19 5l-1.7 1.7M6.7 17.3L5 19" /></>,
    <><circle cx="12" cy="12" r="4.4" /><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3L19 19M19 5l-1.7 1.7M6.7 17.3L5 19" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></>,
  ],
  closet: [
    <><path d="M12 7a2 2 0 1 0-2-2" /><path d="M12 7l7.5 3.6a1 1 0 0 1 .5.9v8.1a1 1 0 0 1-1 1h-5.5a1 1 0 0 1-1-1v-6h-1v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8.1a1 1 0 0 1 .5-.9L12 7z" /></>,
    <><path d="M12 6.2a2.1 2.1 0 1 0-2.1-2.1" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /><path d="M12 6.2l7.9 3.8a1 1 0 0 1 .6 1v8.4a1 1 0 0 1-1 1h-5.9a1 1 0 0 1-1-1v-5.9h-1.2v5.9a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1V11a1 1 0 0 1 .6-1L12 6.2z" /></>,
  ],
  add: [
    <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>,
    <><circle cx="12" cy="12" r="9.2" /><path d="M12 7.5v9M7.5 12h9" stroke="var(--paper)" strokeWidth="2.4" strokeLinecap="round" /></>,
  ],
  settings: [
    <><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" /></>,
    <><circle cx="12" cy="7.6" r="4.2" /><path d="M4.6 20.4a7.6 7.6 0 0 1 14.8 0z" /></>,
  ],
};

export function TabBar() {
  const { s, d } = useStore();
  const tabs: { route: Route; label: string }[] = [
    { route: 'today', label: 'Today' },
    { route: 'closet', label: 'Closet' },
    { route: 'add', label: 'Add' },
    { route: 'settings', label: 'You' },
  ];
  const active = s.route === 'item' ? 'closet' : s.route;
  return (
    <nav className="tabbar" aria-label="Main">
      {tabs.map((t) => (
        <button
          key={t.route}
          className="tab"
          aria-current={active === t.route ? 'page' : undefined}
          onClick={() => d({ type: 'go', route: t.route })}
        >
          <svg className="ic-line" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{TAB_ICONS[t.route][0]}</svg>
          <svg className="ic-fill" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{TAB_ICONS[t.route][1]}</svg>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function Sheet({
  title, onClose, children, labelledBy = 'sheet-title',
}: {
  title: string;
  onClose?: () => void;
  children: ReactNode;
  labelledBy?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="scrim" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        ref={ref}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-head">
          <h2 id={labelledBy} className="t-title">{title}</h2>
          {onClose && (
            <button className="icon-btn" aria-label="Close" onClick={onClose}>
              <Icon name="close" />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

export function Toast() {
  const { s } = useStore();
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {s.toast && <div className="toast">{s.toast}</div>}
    </div>
  );
}

export function Header({ title, back, children }: { title: string; back?: () => void; children?: ReactNode }) {
  return (
    <header className="head">
      {back && (
        <button className="icon-btn" aria-label="Back" onClick={back}>
          <Icon name="back" />
        </button>
      )}
      <h1 className={back ? 't-title' : 't-display'}>{title}</h1>
      {children}
    </header>
  );
}

export function Progress({ step, of }: { step: number; of: number }) {
  return (
    <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={of} aria-valuenow={step} aria-label={`Step ${step} of ${of}`}>
      {Array.from({ length: of }, (_, i) => (
        <span key={i} className={i < step ? 'on' : ''} />
      ))}
    </div>
  );
}

export function Chip({ on, onClick, children, label }: { on: boolean; onClick: () => void; children: ReactNode; label?: string }) {
  return (
    <button className="chip" aria-pressed={on} aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}
