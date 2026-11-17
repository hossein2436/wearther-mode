/**
 * The stylist rule table. Each rule is one sentence a stylist would say, a weight, and a test.
 * A test returns false (doesn't apply), true (applies, no reason to show) or a short reason
 * (applies, and is worth telling the user). Positive weights reward, negative ones penalise.
 *
 * Keep rules few, specific and explainable. A rule that can't be explained to a user doesn't belong here.
 * Sources for the conventions: common menswear/womenswear styling guidance (neutral base + one accent,
 * darker bottoms ground an outfit, shoes at least as dark as trousers in smart looks, one pattern at a time).
 * Hue-only harmony misses lightness and saturation, so contrast and loudness are separate rules.
 */
import type { Item } from '../types';
import type { LookFacts } from './style';
import { hueDist } from './style';

export interface StyleRule {
  id: string;
  /** What a stylist would say. Documentation, and the basis of the reason text. */
  says: string;
  weight: number;
  test: (f: LookFacts) => boolean | string;
}

const nm = (i: Item) => i.name.charAt(0).toLowerCase() + i.name.slice(1);
const L = (f: LookFacts, i?: Item) => (i ? f.oklch.get(i.id)!.L : 0);

export const RULES: StyleRule[] = [
  // ----- Colour scheme -----
  {
    id: 'neutral-plus-one', weight: 5,
    says: 'A neutral base with one colour is the easiest look to get right.',
    test: (f) => f.scheme === 'accent' && f.items.length >= 3 && `Neutral base, ${f.fam.get(f.accents[0].id)} as the one colour`,
  },
  {
    id: 'tonal', weight: 4,
    says: 'Shades of one colour family look deliberate.',
    test: (f) => f.scheme === 'tonal' && f.accents.length >= 2 && `Tonal ${f.fam.get(f.accents[0].id)}s`,
  },
  {
    id: 'tonal-neutrals', weight: 2,
    says: 'Two neutrals, worn head to toe, read calm and expensive.',
    test: (f) => f.scheme === 'tonal' && f.accents.length === 0 && 'Quiet, two-neutral palette',
  },
  {
    id: 'analogous', weight: 3,
    says: 'Neighbouring colours on the wheel blend.',
    test: (f) => f.scheme === 'analogous' && `Neighbouring ${f.accents.map((i) => f.fam.get(i.id)).join(' and ')}`,
  },
  {
    id: 'complementary-muted', weight: 3,
    says: 'Opposite colours work when at least one is muted.',
    test: (f) => f.scheme === 'complementary' && f.loud.length <= 1 && `${cap(f.fam.get(f.accents[0].id)!)} against ${f.fam.get(f.accents[1].id)}, one kept soft`,
  },
  {
    id: 'complementary-loud', weight: -4,
    says: 'Two saturated opposites fight for attention.',
    test: (f) => f.scheme === 'complementary' && f.loud.length >= 2,
  },
  { id: 'triadic', weight: 1, says: 'Three evenly spaced colours can work, carefully.', test: (f) => f.scheme === 'triadic' },
  { id: 'clash', weight: -8, says: 'Colours a quarter-turn apart on the wheel tend to clash.', test: (f) => f.scheme === 'clash' },
  {
    id: 'one-statement', weight: -5,
    says: 'Only one piece should be loud.',
    test: (f) => f.loud.length >= 2 && f.scheme !== 'tonal' && f.scheme !== 'analogous',
  },

  // ----- Lightness -----
  {
    id: 'grounded', weight: 2,
    says: 'Darker on the bottom grounds an outfit.',
    test: (f) => {
      const up = f.top ?? f.mid, legs = f.bottom;
      return !!up && !!legs && L(f, legs) < L(f, up) - 0.15 && f.contrast !== 'low' && `Darker ${nm(legs)} ground the lighter top`;
    },
  },
  {
    id: 'flat', weight: -2,
    says: 'Top and bottom at the same lightness, in different colours, look accidental.',
    test: (f) => {
      if (f.contrast !== 'low' || !f.upper || !f.bottom) return false;
      return f.fam.get(f.upper.id) !== f.fam.get(f.bottom.id) && f.scheme !== 'tonal';
    },
  },
  {
    id: 'echo', weight: 2,
    says: 'Repeating a colour from top to toe ties a look together.',
    test: (f) => {
      if (!f.shoes) return false;
      const s = f.oklch.get(f.shoes.id)!;
      const match = f.items.find((i) => i !== f.shoes && i.slot !== 'bottom' && near(s, f.oklch.get(i.id)!));
      return !!match && `The ${nm(f.shoes)} echo the ${nm(match)}`;
    },
  },
  {
    id: 'calm-outer', weight: 1,
    says: 'A neutral coat calms whatever is under it.',
    test: (f) => !!f.outer && f.accents.length > 0 && !f.accents.includes(f.outer) && `The ${nm(f.outer)} keeps it calm`,
  },

  // ----- Shape and formality -----
  {
    id: 'shoes-darker', weight: -3,
    says: 'In smart outfits, shoes should be at least as dark as the trousers.',
    test: (f) => !!f.shoes && !!f.bottom && f.formality >= 3 && L(f, f.shoes) > L(f, f.bottom) + 0.2,
  },
  {
    id: 'shoes-match-level', weight: -4,
    says: 'Shoes should sit at the same dress level as the trousers.',
    test: (f) => !!f.shoes && !!(f.bottom ?? f.onepiece) && Math.abs(f.shoes.formality - (f.bottom ?? f.onepiece)!.formality) >= 2.5,
  },
  { id: 'boots-shorts', weight: -6, says: 'Heavy boots with shorts look like a mistake.', test: (f) => f.shoes?.kind === 'boots' && f.bottom?.kind === 'shorts' },
  { id: 'blazer-hoodie', weight: -5, says: 'A hoodie under a blazer is a costume unless you mean it.', test: (f) => f.outer?.kind === 'blazer' && f.mid?.kind === 'hoodie' },
  {
    id: 'denim-on-denim', weight: -4,
    says: 'Denim on denim needs clear contrast between the two blues.',
    test: (f) => {
      const up = f.top ?? f.mid ?? f.outer;
      return !!up && f.bottom?.kind === 'jeans' && f.fam.get(up.id) === 'denim' && Math.abs(L(f, up) - L(f, f.bottom)) < 0.15;
    },
  },
  {
    id: 'smart-casual-mix', weight: 1,
    says: 'One smart piece lifts a casual outfit.',
    test: (f) => {
      const levels = f.items.map((i) => i.formality);
      return f.formality < 2.6 && levels.some((x) => x >= 3) && levels.filter((x) => x >= 3).length === 1 && 'One smart piece lifts it';
    },
  },

  // ----- Pattern -----
  {
    id: 'one-pattern', weight: 1,
    says: 'One pattern, everything else plain.',
    test: (f) => f.patterns.filter((p) => p !== 'solid').length === 1 && 'One pattern, the rest plain',
  },
  {
    id: 'pattern-clash', weight: -5,
    says: 'Two patterns compete unless you are very sure.',
    test: (f) => f.patterns.filter((p) => p !== 'solid').length >= 2,
  },
];

function near(a: { L: number; C: number; h: number }, b: { L: number; C: number; h: number }): boolean {
  if (a.C < 0.04 && b.C < 0.04) return Math.abs(a.L - b.L) < 0.08; // two neutrals of similar lightness
  return a.C >= 0.04 && b.C >= 0.04 && hueDist(a.h, b.h) < 18 && Math.abs(a.L - b.L) < 0.15;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
