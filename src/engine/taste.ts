/**
 * Learned taste: one weight per look feature (see style.ts lookFeatures), learned online from what
 * the person does. A small logistic model, so it needs no training run and works from the first tap.
 *
 *   wear  → strong yes     love → strongest yes
 *   skip  → weak no        dislike → strong no
 *
 * An optional community prior (aggregated from people who opted in) fills in for features
 * this person hasn't taught us yet, and fades out as their own evidence grows.
 */
export type Taste = Record<string, number>;
export type Signal = 'wear' | 'love' | 'skip' | 'dislike';

const RATE: Record<Signal, { y: 1 | 0; lr: number }> = {
  wear: { y: 1, lr: 0.35 },
  love: { y: 1, lr: 0.5 },
  skip: { y: 0, lr: 0.12 },
  dislike: { y: 0, lr: 0.45 },
};
const CLAMP = 3;
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

export function tasteScore(features: string[], taste: Taste, prior: Taste = {}, evidence = 0): number {
  // The prior counts fully for a new user and fades to 20% after ~40 signals.
  const priorWeight = Math.max(0.2, 1 - evidence / 50);
  let z = 0;
  for (const f of features) z += (taste[f] ?? 0) + (prior[f] ?? 0) * priorWeight;
  return z;
}

/** One SGD step of logistic regression on this look's features. Returns a new object. */
export function learn(taste: Taste, features: string[], signal: Signal): Taste {
  const { y, lr } = RATE[signal];
  const p = sigmoid(tasteScore(features, taste));
  const g = (y - p) * lr;
  const next = { ...taste };
  for (const f of features) {
    const w = (next[f] ?? 0) + g;
    next[f] = Math.max(-CLAMP, Math.min(CLAMP, Math.round(w * 1000) / 1000));
  }
  return next;
}

/** Labels for the server: positive or negative, nothing else. */
export const label = (s: Signal): 1 | -1 => (RATE[s].y === 1 ? 1 : -1);

/** The features this person most clearly likes or avoids, for "What we've learned" in Settings. */
export function strongest(taste: Taste, n = 3): { likes: string[]; avoids: string[] } {
  const e = Object.entries(taste).filter(([k]) => /^(scheme|accent|pair|contrast|formality):/.test(k));
  const likes = e.filter(([, w]) => w >= 0.6).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);
  const avoids = e.filter(([, w]) => w <= -0.6).sort((a, b) => a[1] - b[1]).slice(0, n).map(([k]) => k);
  return { likes, avoids };
}

const SCHEME_TEXT: Record<string, string> = {
  neutral: 'all-neutral outfits', tonal: 'tonal, one-family colour', accent: 'a neutral base with one colour',
  analogous: 'neighbouring colours', complementary: 'opposite colours', triadic: 'three-colour looks', clash: 'bold colour clashes',
};

/** "scheme:accent" → "a neutral base with one colour". */
export function describeFeature(f: string): string {
  const [k, v] = f.split(':');
  if (k === 'scheme') return SCHEME_TEXT[v] ?? v;
  if (k === 'accent') return `${v} as a colour`;
  if (k === 'pair') return v.replace('+', ' with ');
  if (k === 'contrast') return v === 'high' ? 'strong light–dark contrast' : v === 'low' ? 'soft, low contrast' : 'medium contrast';
  if (k === 'formality') return `${v.replace('-', ' ')} outfits`;
  return v;
}
