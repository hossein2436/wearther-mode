import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { useStore, type Route } from '../state/store';

export function TabBar() {
  const { s, d } = useStore();
  const tabs: { route: Route; label: string; icon: string }[] = [
    { route: 'today', label: 'Today', icon: 'sunny' },
    { route: 'closet', label: 'Closet', icon: 'hanger' },
    { route: 'add', label: 'Add', icon: 'plusbox2' },
    { route: 'settings', label: 'You', icon: 'sliders' },
  ];
  const active = s.route === 'item' ? 'closet' : s.route;
  return (
    <nav className="tabbar" aria-label="Main">
      <span className="tab-blob" aria-hidden="true" style={{ ['--i' as string]: Math.max(0, tabs.findIndex((t) => t.route === active)) }} />
      {tabs.map((t) => (
        <button
          key={t.route}
          className="tab"
          aria-current={active === t.route ? 'page' : undefined}
          onClick={() => d({ type: 'go', route: t.route })}
        >
          <Icon name={t.icon} size={24} duo={active === t.route} />
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
