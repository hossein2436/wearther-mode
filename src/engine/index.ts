/**
 * Wearther Mode outfit engine (v0, prototype).
 * Pure and deterministic: same inputs → same outfits. No I/O.
 */
import type { DayWindow, Forecast, Item, Outfit, Thermal, WindowSummary } from '../types';
import { styleScore } from './style';
import { tasteScore, type Taste } from './taste';

export const RAIN_THRESHOLD = 50; // % probability
const HOT = 27; // feels-like °C: no warm mid/outer layers
const COLD = 5; // feels-like °C: an outer layer is required if one exists

/** Personal offset: "I run cold" feels the day 3° colder. */
export function thermalOffset(thermal: Thermal, learned = 0): number {
  const base = thermal === 'cold' ? -3 : thermal === 'warm' ? 3 : 0;
  return base + learned;
}

export function summarize(forecast: Forecast, win: DayWindow, offset = 0): WindowSummary {
  const hours = forecast.hours
    .filter((h) => h.hour >= win.leave && h.hour <= win.back)
    .map((h) => ({ ...h, feelsC: Math.round(h.feelsC + offset) }));
  const safe = hours.length ? hours : forecast.hours.slice(0, 1);
  let min = safe[0], max = safe[0];
  for (const h of safe) {
    if (h.feelsC < min.feelsC) min = h;
    if (h.feelsC > max.feelsC) max = h;
  }
  const wet = safe.filter((h) => h.precipProb >= RAIN_THRESHOLD);
  return {
    hours: safe,
    minFeels: min.feelsC,
    maxFeels: max.feelsC,
    coldestHour: min.hour,
    warmestHour: max.hour,
    rainFrom: wet.length ? wet[0].hour : null,
    rainTo: wet.length ? wet[wet.length - 1].hour : null,
    maxRainProb: Math.max(...safe.map((h) => h.precipProb)),
    maxWind: Math.max(...safe.map((h) => h.windKmh)),
    maxUv: Math.max(...safe.map((h) => h.uv)),
  };
}

/** Warmth units the upper body needs at a feels-like temperature. */
export function needAt(feels: number): number {
  return Math.min(10, Math.max(1, (28 - feels) / 4));
}

const isAvail = (i: Item) => i.status === 'available';

function upperWarmth(items: Item[], withOuter: boolean): number {
  return items
    .filter((i) => i.slot === 'top' || i.slot === 'mid' || i.slot === 'onepiece' || (withOuter && i.slot === 'outer'))
    .reduce((s, i) => s + i.warmth, 0);
}

export interface EngineContext {
  closet: Item[];
  summary: WindowSummary;
  today: string; // ISO date
  pairWeights?: Record<string, number>;
  recentOutfits?: string[]; // signatures worn in last 7 days
  taste?: Taste;
  prior?: Taste;
  /** How many taste signals this person has given; fades the community prior. */
  evidence?: number;
}

export const signature = (items: Item[]) => items.map((i) => i.id).sort().join('+');
const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

/** Returns null when the candidate breaks a hard rule. Lower penalty = better. */
function penalty(items: Item[], ctx: EngineContext, hasOuterAvailable: boolean): number | null {
  const s = ctx.summary;
  const rainy = s.maxRainProb >= RAIN_THRESHOLD;
  const outer = items.find((i) => i.slot === 'outer');
  const mid = items.find((i) => i.slot === 'mid');
  const bottom = items.find((i) => i.slot === 'bottom');
  const shoes = items.find((i) => i.slot === 'shoes');

  // Hard rules: weather is a rule, not a hint.
  if (s.maxFeels >= HOT && ((mid && mid.warmth >= 2) || (outer && outer.warmth >= 3))) return null;
  if (s.minFeels <= COLD && !outer && hasOuterAvailable) return null;
  if (rainy && items.some((i) => i.keepOutOfRain)) return null;

  let p = 0;
  const withOuter = upperWarmth(items, true);
  const without = upperWarmth(items, false);
  const needCold = needAt(s.minFeels);
  const needWarm = needAt(s.maxFeels);

  // Hour-by-hour comfort: the outer layer goes on only in the hours you need it.
  let discomfort = 0;
  for (const h of s.hours) {
    const need = needAt(h.feelsC);
    const wearing = outer && without < need - 0.5 ? withOuter : without;
    discomfort += Math.abs(wearing - need);
  }
  p += (discomfort / s.hours.length) * 8;
  if (withOuter < needCold - 1) p += (needCold - 1 - withOuter) * 6; // never under-dressed at the coldest hour
  if (without > needWarm + 1) p += (without - needWarm - 1) * 6; // not too hot once the layer is off
  if (outer && needCold - without < 0.75 && !(rainy && outer.waterproof)) p += 8; // a jacket you'd only carry

  // Legs and feet
  if (bottom) {
    if ((bottom.kind === 'shorts' || bottom.kind === 'skirt') && s.minFeels < 14) p += (14 - s.minFeels) * 1.5;
    if (bottom.kind !== 'shorts' && bottom.kind !== 'skirt' && s.maxFeels >= 27) p += (s.maxFeels - 26) * 1.5;
  }
  if (shoes) {
    if (shoes.kind === 'sandals' && (s.minFeels < 18 || rainy)) p += 20;
    if (shoes.kind === 'boots' && s.maxFeels >= 25) p += 10;
    if (rainy && (shoes.waterproof || shoes.kind === 'boots')) p -= 3;
    if (s.minFeels < 3 && shoes.kind !== 'boots') p += 4;
  }
  if (rainy && outer?.waterproof) p -= 6;

  // Formality coherence
  const f = items.map((i) => i.formality);
  const spread = Math.max(...f) - Math.min(...f);
  if (spread > 1) p += (spread - 1) * 4;

  // Style: colour scheme, contrast and the stylist rule table (style.ts, rules.ts)
  const st = styleScore(items);
  p -= st.score * 1.5;

  // Recency and repeats
  for (const i of items) {
    if (!i.lastWorn || i.lastWorn >= ctx.today) continue; // chosen today: not a repeat
    const d = daysBetween(i.lastWorn, ctx.today);
    if (d <= 1) p += 5;
    else if (d <= 3) p += 2;
  }
  if (ctx.recentOutfits?.includes(signature(items))) p += 40;

  // Learned taste
  if (ctx.pairWeights) {
    for (let a = 0; a < items.length; a++)
      for (let b = a + 1; b < items.length; b++)
        p -= (ctx.pairWeights[pairKey(items[a].id, items[b].id)] ?? 0) * 4;
  }
  if (ctx.taste || ctx.prior) {
    const z = tasteScore(st.features, ctx.taste ?? {}, ctx.prior, ctx.evidence ?? 0);
    p -= Math.max(-4, Math.min(4, z)) * 3;
  }
  return p;
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967295;
}

/** Every valid outfit, best first. */
export function rankOutfits(ctx: EngineContext): { items: Item[]; penalty: number }[] {
  const pool = ctx.closet.filter(isAvail);
  const by = (slot: Item['slot']) => pool.filter((i) => i.slot === slot);
  const tops = by('top'), bottoms = by('bottom'), ones = by('onepiece'), shoes = by('shoes');
  const mids: (Item | null)[] = [null, ...by('mid')];
  const outers: (Item | null)[] = [null, ...by('outer')];
  const hasOuter = outers.length > 1;

  const bases: Item[][] = [];
  for (const t of tops) for (const b of bottoms) bases.push([t, b]);
  for (const o of ones) bases.push([o]);

  const out: { items: Item[]; penalty: number }[] = [];
  for (const base of bases)
    for (const m of mids)
      for (const o of outers)
        for (const s of shoes) {
          const items = [...base, ...(m ? [m] : []), ...(o ? [o] : []), s];
          const p = penalty(items, ctx, hasOuter);
          if (p === null) continue;
          // Deterministic tie-breaker that changes day to day.
          out.push({ items, penalty: p + hash(ctx.today + signature(items)) * 2 });
        }
  return out.sort((a, b) => a.penalty - b.penalty);
}

const ORDER: Record<Item['slot'], number> = { outer: 0, mid: 1, top: 2, onepiece: 2, bottom: 3, shoes: 4 };
const sortSlots = (items: Item[]) => [...items].sort((a, b) => ORDER[a.slot] - ORDER[b.slot]);

export function layerHours(items: Item[], s: WindowSummary): [number, number] | null {
  if (!items.some((i) => i.slot === 'outer')) return null;
  const without = upperWarmth(items, false);
  const rainy = s.maxRainProb >= RAIN_THRESHOLD;
  const need = s.hours.filter((h) => needAt(h.feelsC) > without + 0.5 || (rainy && h.precipProb >= RAIN_THRESHOLD));
  if (!need.length) return [s.hours[0].hour, s.hours[s.hours.length - 1].hour];
  return [need[0].hour, need[need.length - 1].hour];
}

const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export function explain(items: Item[], s: WindowSummary, layer: [number, number] | null): string {
  const parts: string[] = [];
  const outer = items.find((i) => i.slot === 'outer');
  const mid = items.find((i) => i.slot === 'mid');
  const swing = s.maxFeels - s.minFeels;

  if (swing >= 5) {
    const rising = s.warmestHour > s.coldestHour;
    parts.push(
      rising
        ? `Feels ${s.minFeels}° at ${hh(s.coldestHour)}, ${s.maxFeels}° by ${hh(s.warmestHour)}`
        : `Feels ${s.maxFeels}° at ${hh(s.warmestHour)}, dropping to ${s.minFeels}° by ${hh(s.coldestHour)}`,
    );
  } else {
    parts.push(`Feels ${s.minFeels}° to ${s.maxFeels}° all day`);
  }

  if (s.maxFeels >= HOT) parts.push('Too hot for layers, so keep it light');
  else if (mid && outer) parts.push(`The ${lower(mid.name)} keeps you warm indoors, the ${lower(outer.name)} handles outside`);
  else if (mid) parts.push(`The ${lower(mid.name)} is enough on its own`);

  if (outer && layer) {
    const all = layer[0] === s.hours[0].hour && layer[1] === s.hours[s.hours.length - 1].hour;
    if (!all) {
      const morning = layer[0] === s.hours[0].hour;
      parts.push(
        morning
          ? `Wear the ${lower(outer.name)} until about ${hh(layer[1] + 1)}, then carry it`
          : `You'll want the ${lower(outer.name)} from ${hh(layer[0])}`,
      );
    }
  }

  if (s.rainFrom !== null) {
    const kit = [outer?.waterproof ? lower(outer.name) : null, items.find((i) => i.slot === 'shoes' && (i.waterproof || i.kind === 'boots'))?.name]
      .filter(Boolean)
      .map((x) => lower(x as string));
    parts.push(kit.length ? `Rain from ${hh(s.rainFrom)}, so the ${kit.join(' and ')}` : `Rain from ${hh(s.rainFrom)}, take an umbrella`);
  }
  if (s.maxUv >= 6) parts.push(`UV ${s.maxUv} at midday, bring sunglasses`);
  return parts.join('. ') + '.';
}

function notesFor(items: Item[], ctx: EngineContext): string[] {
  const notes: string[] = [];
  const s = ctx.summary;
  const outers = ctx.closet.filter((i) => i.slot === 'outer');
  if (s.minFeels <= COLD && !items.some((i) => i.slot === 'outer')) {
    notes.push(
      outers.length
        ? `It feels ${s.minFeels}° and your jackets are all in the wash or stored.`
        : `It feels ${s.minFeels}° and your closet has no jacket yet. Add one to stay warm.`,
    );
  }
  return notes;
}

export function build(items: Item[], ctx: EngineContext, penaltyValue: number): Outfit {
  const sorted = sortSlots(items);
  const layer = layerHours(sorted, ctx.summary);
  const st = styleScore(sorted);
  return {
    style: st.reasons,
    features: st.features,
    items: sorted,
    score: Math.round(100 - penaltyValue),
    layerHours: layer,
    why: explain(sorted, ctx.summary, layer),
    notes: notesFor(sorted, ctx),
  };
}

export interface Picks {
  hero: Outfit | null;
  planB: Outfit | null;
}

/** Hero outfit plus Plan B (shares at most one piece with the hero). */
export function pick(ctx: EngineContext, opts: { exclude?: string[]; locked?: string[] } = {}): Picks {
  const ranked = rankOutfits(ctx).filter(
    (c) =>
      !(opts.exclude ?? []).includes(signature(c.items)) &&
      (opts.locked ?? []).every((id) => c.items.some((i) => i.id === id)),
  );
  if (!ranked.length) return { hero: null, planB: null };
  const hero = ranked[0];
  const heroIds = new Set(hero.items.map((i) => i.id));
  const b = ranked.find((c) => c !== hero && c.items.filter((i) => heroIds.has(i.id)).length <= 1);
  return { hero: build(hero.items, ctx, hero.penalty), planB: b ? build(b.items, ctx, b.penalty) : null };
}

/**
 * A short deck of distinct looks, best first. Each new look shares at most two pieces with any
 * look already in the deck (plus whatever the person has kept), so swiping shows real alternatives.
 */
export function pickLooks(ctx: EngineContext, opts: { exclude?: string[]; locked?: string[]; n?: number } = {}): Outfit[] {
  const locked = opts.locked ?? [];
  const ranked = rankOutfits(ctx).filter(
    (c) => !(opts.exclude ?? []).includes(signature(c.items)) && locked.every((id) => c.items.some((i) => i.id === id)),
  );
  const chosen: typeof ranked = [];
  const allow = 2 + locked.length;
  for (const c of ranked) {
    if (chosen.length >= (opts.n ?? 6)) break;
    if (chosen.every((o) => c.items.filter((i) => o.items.some((j) => j.id === i.id)).length <= allow)) chosen.push(c);
  }
  return chosen.map((c) => build(c.items, ctx, c.penalty));
}

/** What's missing before any outfit is possible. */
export function missingSlots(closet: Item[]): string[] {
  const has = (slot: Item['slot']) => closet.some((i) => i.slot === slot);
  const miss: string[] = [];
  if (!has('onepiece') && !has('top')) miss.push('a top');
  if (!has('onepiece') && !has('bottom')) miss.push('trousers, jeans or a skirt');
  if (!has('shoes')) miss.push('shoes');
  return miss;
}

export { pairKey };
