import { useId } from 'react';
import type { HourForecast, WindowSummary } from '../types';
import type { Mood } from '../state/day';
import { RAIN_THRESHOLD } from '../engine';

export type GlyphKind = 'sun' | 'heat' | 'partly' | 'cloud' | 'rain' | 'snow';

/**
 * Soft-3D ("clay") weather icons drawn in SVG: radial fills lit from the top-left, a specular
 * highlight, a contact shadow, and small motions (rays turn, clouds drift, drops fall).
 */
export function WeatherGlyph({ kind, className = 'glyph', label }: { kind: GlyphKind; className?: string; label?: string }) {
  const id = useId().replace(/:/g, '');
  const sun = kind === 'sun' || kind === 'heat' || kind === 'partly';
  const cloud = kind !== 'sun' && kind !== 'heat';
  const hot = kind === 'heat';
  return (
    <svg viewBox="0 0 100 100" className={className} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <defs>
        <radialGradient id={`s${id}`} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor={hot ? '#fff1b8' : '#fff4c2'} />
          <stop offset="0.45" stopColor={hot ? '#ffb02e' : '#ffd23f'} />
          <stop offset="1" stopColor={hot ? '#ff5a1f' : '#ff9f0a'} />
        </radialGradient>
        <radialGradient id={`c${id}`} cx="0.4" cy="0.25" r="0.85">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#eef2fb" />
          <stop offset="1" stopColor={kind === 'rain' ? '#b7c3e6' : '#cdd6ee'} />
        </radialGradient>
        <linearGradient id={`d${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9fd0ff" />
          <stop offset="1" stopColor="#2f6bff" />
        </linearGradient>
        <filter id={`b${id}`}><feGaussianBlur stdDeviation="1.6" /></filter>
      </defs>

      {sun && (
        <g transform={cloud ? 'translate(14 -6) scale(.78)' : undefined}>
          <g className="wg-rays">
            {Array.from({ length: 10 }, (_, i) => (
              <rect key={i} x="47" y="2" width="6" height="15" rx="3" fill={hot ? '#ff7a1f' : '#ffb21a'} transform={`rotate(${i * 36} 50 50)`} />
            ))}
          </g>
          <g className={hot ? 'wg-heat' : undefined} style={{ transformOrigin: '50px 50px' }}>
            <circle cx="50" cy="50" r="26" fill={`url(#s${id})`} />
            <ellipse cx="41" cy="38" rx="9" ry="6" fill="#fff" opacity="0.7" filter={`url(#b${id})`} />
          </g>
        </g>
      )}

      {cloud && (
        <g className="wg-cloud">
          <ellipse cx="52" cy="80" rx="30" ry="5" fill="#000" opacity="0.08" />
          <path
            d="M24 72a14 14 0 0 1 1-28 20 20 0 0 1 38-6 15 15 0 0 1 14 22 12 12 0 0 1-3 12z"
            fill={`url(#c${id})`}
            stroke="#ffffff" strokeOpacity="0.9" strokeWidth="1.2"
          />
          <ellipse cx="44" cy="40" rx="10" ry="5" fill="#fff" opacity="0.9" filter={`url(#b${id})`} />
        </g>
      )}

      {kind === 'rain' && [30, 46, 62].map((x, i) => (
        <path key={x} className="wg-drop" style={{ ['--d' as string]: `${i * 0.35}s` }}
          d={`M${x} 76c-3 5-4 7-4 9a4 4 0 0 0 8 0c0-2-1-4-4-9z`} fill={`url(#d${id})`} />
      ))}
      {kind === 'snow' && [30, 48, 64].map((x, i) => (
        <g key={x} className="wg-flake" style={{ ['--d' as string]: `${i * 0.7}s` }}>
          <circle cx={x} cy="82" r="4.2" fill="#fff" stroke="#c9d6ff" strokeWidth="1" />
        </g>
      ))}
    </svg>
  );
}

export function glyphForMood(m: Mood): GlyphKind {
  return m === 'frost' ? 'snow' : m === 'rain' ? 'rain' : m === 'cool' ? 'cloud' : m === 'mild' ? 'partly' : m === 'sun' ? 'sun' : 'heat';
}

export function glyphForHour(h: HourForecast): GlyphKind {
  if (h.precipProb >= RAIN_THRESHOLD) return h.tempC <= 0.5 ? 'snow' : 'rain';
  if (h.precipProb >= 25) return 'cloud';
  if (h.feelsC >= 29) return 'heat';
  return h.uv >= 3 ? 'sun' : 'partly';
}

export function moodLabel(s: WindowSummary): string {
  return s.rainFrom !== null ? 'Rain' : s.maxFeels >= 27 ? 'Hot' : s.minFeels < 4 ? 'Cold' : 'Clear';
}
