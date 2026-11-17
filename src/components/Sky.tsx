import { useEffect, useState } from 'react';
import type { WindowSummary } from '../types';
import { RAIN_THRESHOLD } from '../engine';

/** The sky ramp from tokens.css, as numbers so we can interpolate per hour. */
const LIGHT: [number, string][] = [[0, '#a9c8f2'], [8, '#bcdde8'], [15, '#cfe7c9'], [22, '#f7de96'], [30, '#f8b993']];
const DARK: [number, string][] = [[0, '#1d3254'], [8, '#1c3a44'], [15, '#22392c'], [22, '#43391a'], [30, '#4a2c1d']];

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

export function skyColor(c: number, dark = false): string {
  const ramp = dark ? DARK : LIGHT;
  if (c <= ramp[0][0]) return ramp[0][1];
  for (let i = 1; i < ramp.length; i++) {
    const [t1, h1] = ramp[i], [t0, h0] = ramp[i - 1];
    if (c <= t1) {
      const k = (c - t0) / (t1 - t0), a = rgb(h0), b = rgb(h1);
      return `rgb(${a.map((v, j) => Math.round(v + (b[j] - v) * k)).join(' ')})`;
    }
  }
  return ramp[ramp.length - 1][1];
}

export function usePrefersDark(): boolean {
  const q = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-color-scheme: dark)') : null;
  const [dark, setDark] = useState(!!q?.matches);
  useEffect(() => {
    if (!q) return;
    const on = () => setDark(q.matches);
    q.addEventListener('change', on);
    return () => q.removeEventListener('change', on);
  }, [q]);
  return dark;
}

/** Full-screen sky for the day: top is when you leave, bottom is when you're back. */
export function SkyBackground({ s, fallback = 12 }: { s: WindowSummary | null; fallback?: number }) {
  const dark = usePrefersDark();
  const hours = s?.hours ?? [];
  const n = hours.length;
  const bg = n > 1
    ? `linear-gradient(180deg, ${hours.map((h, i) => `${skyColor(h.feelsC, dark)} ${Math.round((i / (n - 1)) * 100)}%`).join(', ')})`
    : skyColor(fallback, dark);
  const firstWet = hours.findIndex((h) => h.precipProb >= RAIN_THRESHOLD);
  const rainTop = firstWet >= 0 && n > 1 ? `${Math.round((firstWet / (n - 1)) * 100)}%` : '100%';
  return <div className="sky-bg" aria-hidden="true" style={{ background: bg, ['--rain-top' as string]: rainTop }} />;
}
