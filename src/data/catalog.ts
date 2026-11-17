import type { GarmentKind, Slot } from '../types';

export interface KindInfo {
  label: string;
  slot: Slot;
  warmth: number;
  formality: number;
}

/** Defaults used to pre-fill tags; the user confirms or corrects them. */
export const KINDS: Record<GarmentKind, KindInfo> = {
  tshirt: { label: 'T-shirt', slot: 'top', warmth: 1, formality: 1 },
  longsleeve: { label: 'Long-sleeve top', slot: 'top', warmth: 1.5, formality: 2 },
  shirt: { label: 'Shirt', slot: 'top', warmth: 1.5, formality: 3 },
  knit: { label: 'Knit', slot: 'mid', warmth: 2.5, formality: 3 },
  hoodie: { label: 'Hoodie', slot: 'mid', warmth: 2.5, formality: 1 },
  cardigan: { label: 'Cardigan', slot: 'mid', warmth: 2, formality: 3 },
  blazer: { label: 'Blazer', slot: 'outer', warmth: 1.5, formality: 4 },
  raincoat: { label: 'Rain jacket', slot: 'outer', warmth: 1.5, formality: 2 },
  trench: { label: 'Trench coat', slot: 'outer', warmth: 2.5, formality: 3 },
  puffer: { label: 'Puffer', slot: 'outer', warmth: 4.5, formality: 2 },
  jeans: { label: 'Jeans', slot: 'bottom', warmth: 2, formality: 2 },
  chinos: { label: 'Chinos', slot: 'bottom', warmth: 2, formality: 3 },
  shorts: { label: 'Shorts', slot: 'bottom', warmth: 1, formality: 1 },
  skirt: { label: 'Skirt', slot: 'bottom', warmth: 1, formality: 3 },
  dress: { label: 'Dress', slot: 'onepiece', warmth: 1.5, formality: 3 },
  sneakers: { label: 'Sneakers', slot: 'shoes', warmth: 1, formality: 1 },
  boots: { label: 'Boots', slot: 'shoes', warmth: 2, formality: 3 },
  loafers: { label: 'Loafers', slot: 'shoes', warmth: 1, formality: 4 },
  sandals: { label: 'Sandals', slot: 'shoes', warmth: 0, formality: 1 },
};

export const SLOT_LABEL: Record<Slot, string> = {
  top: 'Top',
  mid: 'Warm layer',
  outer: 'Jacket or coat',
  bottom: 'Bottoms',
  onepiece: 'Dress',
  shoes: 'Shoes',
};

/** Suggested starter closet: 15 pieces. Minimum to start: top + bottom (or dress) + shoes. */
export const STARTER: { slot: Slot; want: number; hint: string }[] = [
  { slot: 'top', want: 4, hint: 'Tees, shirts, long sleeves you wear most' },
  { slot: 'bottom', want: 2, hint: 'Your go-to jeans or trousers' },
  { slot: 'mid', want: 2, hint: 'A knit, a hoodie or a cardigan' },
  { slot: 'outer', want: 2, hint: 'One light jacket, one warm coat' },
  { slot: 'shoes', want: 3, hint: 'Everyday pair, smart pair, rain-proof pair' },
  { slot: 'onepiece', want: 2, hint: 'Optional: dresses or jumpsuits' },
];
