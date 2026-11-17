/**
 * Style engine v2: how well a set of clothes goes together, independent of weather.
 *
 * Three layers, each explainable:
 *  1. Colour, in OKLCH (perceptual): scheme (tonal, analogous, complementary, neutral + one accent…),
 *     lightness contrast between the big blocks, and how many loud pieces compete.
 *  2. A stylist rule table (rules.ts): declarative, each with a weight and a human reason.
 *  3. Learned taste (taste.ts): per-person weights over the features this file emits.
 *
 * Pure functions, no I/O. Higher score = better. Reasons are short phrases for the look card.
 */
import type { Item, Pattern } from '../types';
import { RULES } from './rules';

// ---------- Colour science ----------

export interface Oklch { L: number; C: number; h: number }

const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

/** sRGB hex → OKLCH (Björn Ottosson's OKLab). L 0–1, C ~0–0.37, h in degrees. */
const memo = new Map<string, Oklch>();
export function toOklch(hex: string): Oklch {
  const hit = memo.get(hex);
  if (hit) return hit;
  const v = oklchOf(hex);
  memo.set(hex, v);
  return v;
}
function oklchOf(hex: string): Oklch {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16);
  const r = lin(((n >> 16) & 255) / 255), g = lin(((n >> 8) & 255) / 255), b = lin((n & 255) / 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.hypot(A, B);
  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { L, C, h };
}

export const hueDist = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

export type Family =
  | 'black' | 'white' | 'grey' | 'navy' | 'denim' | 'camel' | 'brown' | 'olive'
  | 'red' | 'pink' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'purple';

/** Colour family as a stylist would name it. Neutrals include the "honorary" ones: navy, denim, camel, brown, olive. */
export function family(hex: string): Family {
  const { L, C, h } = toOklch(hex);
  if (L < 0.27 && C < 0.06) return 'black';
  if (L > 0.92 && C < 0.04) return 'white';
  if (C < 0.035) return 'grey';
  if (h >= 225 && h < 285 && L < 0.42 && C < 0.13) return 'navy';
  if (h >= 225 && h < 270 && C < 0.11 && L < 0.6) return 'denim';
  if (h >= 40 && h < 95 && C < 0.12 && L >= 0.5) return 'camel';
  if (h >= 20 && h < 95 && L < 0.5 && C < 0.13) return 'brown';
  if (h >= 95 && h < 140 && C < 0.1 && L < 0.62) return 'olive';
  if (h < 38 || h >= 350) return L > 0.68 && C < 0.15 ? 'pink' : 'red';
  if (h < 65) return 'orange';
  if (h < 115) return 'yellow';
  if (h < 175) return 'green';
  if (h < 225) return 'teal';
  if (h < 290) return 'blue';
  return L > 0.75 ? 'pink' : 'purple';
}

const NEUTRAL: ReadonlySet<Family> = new Set(['black', 'white', 'grey', 'navy', 'denim', 'camel', 'brown', 'olive']);
export const isNeutralFamily = (f: Family) => NEUTRAL.has(f);

export type Scheme = 'neutral' | 'tonal' | 'accent' | 'analogous' | 'complementary' | 'triadic' | 'clash';
export type Contrast = 'low' | 'mid' | 'high';

// ---------- Look analysis ----------

export interface LookFacts {
  items: Item[];
  oklch: Map<string, Oklch>;
  fam: Map<string, Family>;
  accents: Item[]; // non-neutral pieces
  loud: Item[]; // high-chroma pieces ("statements")
  scheme: Scheme;
  contrast: Contrast;
  upper?: Item; // the visually dominant upper block (outer if any, else mid, else top/onepiece)
  top?: Item; mid?: Item; outer?: Item; bottom?: Item; onepiece?: Item; shoes?: Item;
  patterns: Pattern[];
  formality: number; // mean
}

const LOUD_C = 0.12;

export function analyse(items: Item[]): LookFacts {
  const oklch = new Map(items.map((i) => [i.id, toOklch(i.color)]));
  const fam = new Map(items.map((i) => [i.id, family(i.color)]));
  const by = (slot: Item['slot']) => items.find((i) => i.slot === slot);
  const top = by('top'), mid = by('mid'), outer = by('outer'), bottom = by('bottom'), onepiece = by('onepiece'), shoes = by('shoes');
  const accents = items.filter((i) => !isNeutralFamily(fam.get(i.id)!));
  const loud = accents.filter((i) => oklch.get(i.id)!.C >= LOUD_C);

  // Scheme over the accent hues (neutrals are free).
  let scheme: Scheme;
  const hues = accents.map((i) => oklch.get(i.id)!.h);
  if (!accents.length) {
    const fams = new Set(items.map((i) => fam.get(i.id)));
    scheme = fams.size <= 2 ? 'tonal' : 'neutral';
  } else if (accents.length === 1) scheme = 'accent';
  else {
    let maxD = 0;
    for (let a = 0; a < hues.length; a++) for (let b = a + 1; b < hues.length; b++) maxD = Math.max(maxD, hueDist(hues[a], hues[b]));
    if (maxD <= 25) scheme = 'tonal';
    else if (maxD <= 50) scheme = 'analogous';
    else if (hues.length === 2 && maxD >= 140) scheme = 'complementary';
    else if (hues.length === 3 && isTriad(hues)) scheme = 'triadic';
    else scheme = 'clash';
  }

  // Lightness contrast between the two biggest blocks: upper body vs legs.
  const upper = outer ?? mid ?? top ?? onepiece;
  const legs = bottom ?? onepiece;
  let contrast: Contrast = 'mid';
  if (upper && legs && upper !== legs) {
    const dL = Math.abs(oklch.get(upper.id)!.L - oklch.get(legs.id)!.L);
    contrast = dL < 0.1 ? 'low' : dL > 0.35 ? 'high' : 'mid';
  }

  return {
    items, oklch, fam, accents, loud, scheme, contrast, upper,
    top, mid, outer, bottom, onepiece, shoes,
    patterns: items.map((i) => i.pattern ?? 'solid'),
    formality: items.reduce((s, i) => s + i.formality, 0) / items.length,
  };
}

function isTriad(h: number[]): boolean {
  const s = [...h].sort((a, b) => a - b);
  const gaps = [s[1] - s[0], s[2] - s[1], 360 - s[2] + s[0]];
  return gaps.every((g) => Math.abs(g - 120) <= 30);
}

// ---------- Scoring ----------

export interface StyleResult {
  score: number;
  /** Up to two short, positive phrases that explain why the look works, best first. */
  reasons: string[];
  /** Feature strings for the taste model, e.g. "scheme:accent". */
  features: string[];
  scheme: Scheme;
}

export function styleScore(items: Item[]): StyleResult {
  const f = analyse(items);
  let score = 0;
  const reasons: { text: string; w: number }[] = [];
  const fired: string[] = [];
  for (const r of RULES) {
    const res = r.test(f);
    if (!res) continue;
    score += r.weight;
    fired.push(r.id);
    if (r.weight > 0 && res !== true) reasons.push({ text: res, w: r.weight });
  }
  return {
    score,
    reasons: reasons.sort((a, b) => b.w - a.w).slice(0, 2).map((r) => r.text),
    features: lookFeatures(f, fired),
    scheme: f.scheme,
  };
}

const level = (x: number) => (x < 2 ? 'casual' : x < 3.25 ? 'smart-casual' : 'smart');

/** Generic, anonymous features: no ids, names or photos, so they are safe to share if the user opts in. */
export function lookFeatures(f: LookFacts, fired: string[] = []): string[] {
  const fams = [...new Set(f.items.map((i) => f.fam.get(i.id)!))].sort();
  const out = [
    `scheme:${f.scheme}`,
    `contrast:${f.contrast}`,
    `formality:${level(f.formality)}`,
    `loud:${Math.min(f.loud.length, 2)}`,
    ...fired.map((id) => `rule:${id}`),
    ...f.accents.map((i) => `accent:${f.fam.get(i.id)}`),
  ];
  for (let a = 0; a < fams.length; a++) for (let b = a + 1; b < fams.length; b++) out.push(`pair:${fams[a]}+${fams[b]}`);
  if (f.bottom) out.push(`kind:${f.bottom.kind}`);
  if (f.shoes) out.push(`kind:${f.shoes.kind}`);
  if (f.outer) out.push(`kind:${f.outer.kind}`);
  return [...new Set(out)];
}

/** Readable colour-family name, for reasons. */
export const familyLabel = (fm: Family) => fm;
