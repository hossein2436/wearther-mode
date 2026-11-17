import type { WindowSummary } from '../types';
import { RAIN_THRESHOLD } from '../engine';

/** Temperature ramp from the design system: data colour only. */
const STOPS: [number, [number, number, number]][] = [
  [0, [0x8f, 0xb3, 0xe0]],
  [8, [0xa9, 0xcb, 0xd8]],
  [15, [0xb9, 0xd7, 0xb4]],
  [23, [0xf2, 0xd2, 0x7a]],
  [30, [0xf0, 0xa0, 0x7a]],
];

export function tempColor(c: number): string {
  if (c <= STOPS[0][0]) return rgb(STOPS[0][1]);
  for (let i = 1; i < STOPS.length; i++) {
    const [t1, c1] = STOPS[i];
    const [t0, c0] = STOPS[i - 1];
    if (c <= t1) {
      const k = (c - t0) / (t1 - t0);
      return rgb([0, 1, 2].map((j) => c0[j] + (c1[j] - c0[j]) * k) as [number, number, number]);
    }
  }
  return rgb(STOPS[STOPS.length - 1][1]);
}
const rgb = (c: [number, number, number]) => `rgb(${c.map(Math.round).join(',')})`;

export const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;

export function ribbonText(s: WindowSummary, deg: (c: number) => string): string {
  const first = s.hours[0].hour, last = s.hours[s.hours.length - 1].hour;
  const rain = s.rainFrom !== null ? `, rain from ${hh(s.rainFrom)}` : ', no rain';
  return `From ${hh(first)} to ${hh(last)} it feels ${deg(s.minFeels)} to ${deg(s.maxFeels)}${rain}.`;
}

export function DayRibbon({
  s, layer, layerName, deg, stale,
}: {
  s: WindowSummary;
  layer: [number, number] | null;
  layerName?: string;
  deg: (c: number) => string;
  stale?: boolean;
}) {
  const hours = s.hours;
  const n = hours.length;
  const first = hours[0].hour;
  const pct = (h: number) => ((h - first) / n) * 100;
  const gradient = `linear-gradient(90deg, ${hours
    .map((h, i) => `${tempColor(h.feelsC)} ${((i + 0.5) / n) * 100}%`)
    .join(', ')})`;
  const ticks = hours.filter((_, i) => i % 2 === 0 || i === n - 1);

  return (
    <figure className={`ribbon${stale ? ' is-stale' : ''}`} aria-label={ribbonText(s, deg)}>
      <div className="ribbon-layer" aria-hidden="true">
        {layer && layerName && (
          <span
            className="ribbon-layer-bar"
            style={{ left: `${pct(layer[0])}%`, width: `${((layer[1] - layer[0] + 1) / n) * 100}%` }}
          >
            {layerName} on
          </span>
        )}
      </div>
      <div className="ribbon-band" style={{ background: gradient }} aria-hidden="true">
        {hours.map((h, i) =>
          h.precipProb >= RAIN_THRESHOLD ? (
            <span key={h.hour} className="ribbon-rain" style={{ left: `${(i / n) * 100}%`, width: `${100 / n}%` }}>
              <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 4c3 4 5 7 5 9.5a5 5 0 0 1-10 0C7 11 9 8 12 4z" fill="currentColor" /></svg>
            </span>
          ) : null,
        )}
      </div>
      <div className="ribbon-ticks" aria-hidden="true">
        {ticks.map((h) => (
          <span key={h.hour} style={{ left: `${pct(h.hour) + 50 / n}%` }}>{String(h.hour).padStart(2, '0')}</span>
        ))}
      </div>
      {/* Legend: the ribbon encodes three things, so name them (recognition over recall). */}
      <figcaption className="ribbon-key" aria-hidden="true">
        <span><i className="key-temp" />Feels like</span>
        {s.rainFrom !== null && <span><i className="key-rain" />Rain</span>}
        {layer && layerName && <span><i className="key-layer" />Layer on</span>}
      </figcaption>
    </figure>
  );
}
