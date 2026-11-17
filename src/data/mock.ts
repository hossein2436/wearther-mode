import type { Forecast, GarmentKind, HourForecast, Item } from '../types';
import { KINDS } from './catalog';
import { nameColor } from '../engine/color';

let n = 0;
function item(kind: GarmentKind, color: string, name: string, extra: Partial<Item> = {}): Item {
  const k = KINDS[kind];
  return {
    id: `s${++n}`,
    name,
    kind,
    slot: k.slot,
    color,
    colorName: nameColor(color),
    warmth: k.warmth,
    formality: k.formality,
    status: 'available',
    wearCount: Math.floor((n * 7) % 11),
    addedAt: '2026-11-10',
    ...extra,
  };
}

/** A realistic starter closet of 18 pieces, drawn as illustrations in the prototype. */
export function sampleCloset(): Item[] {
  n = 0;
  return [
    item('tshirt', '#F4F4F2', 'White tee'),
    item('tshirt', '#1F2A44', 'Navy tee'),
    item('longsleeve', '#8A8F96', 'Grey long-sleeve'),
    item('shirt', '#A9C4E2', 'Pale blue shirt'),
    item('shirt', '#F1ECE2', 'Ecru linen shirt', { warmth: 1 }),
    item('knit', '#7A7E86', 'Grey merino knit'),
    item('knit', '#2F6B4F', 'Bottle-green knit', { warmth: 3 }),
    item('hoodie', '#C8B79A', 'Oat hoodie'),
    item('trench', '#B49A6C', 'Camel trench', { waterproof: true }),
    item('puffer', '#1B1F24', 'Black puffer', { waterproof: true }),
    item('raincoat', '#3B5B4A', 'Olive rain jacket', { waterproof: true }),
    item('jeans', '#3E5A7E', 'Mid-blue jeans'),
    item('chinos', '#2B2F36', 'Charcoal trousers', { formality: 4 }),
    item('shorts', '#C8B79A', 'Stone shorts'),
    item('sneakers', '#F4F4F2', 'White sneakers'),
    item('boots', '#5C4033', 'Brown Chelsea boots', { waterproof: true }),
    item('loafers', '#1B1F24', 'Black loafers', { keepOutOfRain: true }),
    item('sandals', '#A7773F', 'Tan sandals'),
  ];
}

export type ScenarioId = 'mixed' | 'cold' | 'hot';

export const SCENARIOS: Record<ScenarioId, { label: string; place: string }> = {
  mixed: { label: 'Mixed day with evening rain', place: 'London' },
  cold: { label: 'Cold and dry', place: 'Toronto' },
  hot: { label: 'Hot and sunny', place: 'Lisbon' },
};

function hours(spec: (h: number) => Omit<HourForecast, 'hour'>): HourForecast[] {
  return Array.from({ length: 24 }, (_, h) => ({ hour: h, ...spec(h) }));
}

const curve = (h: number, low: number, high: number, peak = 14) =>
  low + (high - low) * Math.max(0, Math.cos(((h - peak) / 12) * Math.PI) * 0.5 + 0.5);

export function scenarioForecast(id: ScenarioId, fetchedAt = new Date().toISOString()): Forecast {
  const place = SCENARIOS[id].place;
  if (id === 'cold')
    return {
      place, fetchedAt,
      hours: hours((h) => {
        const t = curve(h, -4, 3);
        return { tempC: Math.round(t), feelsC: Math.round(t - 5), precipProb: 5, windKmh: 22, uv: h > 10 && h < 15 ? 1 : 0 };
      }),
    };
  if (id === 'hot')
    return {
      place, fetchedAt,
      hours: hours((h) => {
        const t = curve(h, 19, 33, 15);
        return { tempC: Math.round(t), feelsC: Math.round(t + (t > 28 ? 2 : 0)), precipProb: 0, windKmh: 9, uv: h >= 11 && h <= 16 ? 8 : h >= 9 && h <= 18 ? 4 : 0 };
      }),
    };
  return {
    place, fetchedAt,
    hours: hours((h) => {
      const t = curve(h, 6, 15);
      return {
        tempC: Math.round(t),
        feelsC: Math.round(t - (h >= 17 ? 4 : 2)),
        precipProb: h >= 17 && h <= 21 ? 80 : h === 16 ? 40 : 10,
        windKmh: h >= 16 ? 28 : 14,
        uv: h >= 11 && h <= 14 ? 2 : 0,
      };
    }),
  };
}
