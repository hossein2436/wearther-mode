import type { State } from '../state/store';

export const degFor = (units: State['units']) => (c: number) =>
  units === 'C' ? `${c}°` : `${Math.round((c * 9) / 5 + 32)}°`;

export function longDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true);

/** Prototype helpers (sample clothes, weather scenarios) show only in review links or with ?proto. */
export const protoMode = () => typeof location !== 'undefined' && new URLSearchParams(location.search).has('proto');
