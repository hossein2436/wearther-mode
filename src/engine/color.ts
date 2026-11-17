/** Colour helpers: hex → HSL, neutral detection, harmony penalty, dominant colour, naming. */

export function hexToHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

/** Neutrals go with anything: greys, black, white, navy, denim, beige, camel, olive drab. */
export function isNeutral(hex: string): boolean {
  const [h, s, l] = hexToHsl(hex);
  if (s < 0.2 || l < 0.16 || l > 0.9) return true;
  if (h >= 200 && h <= 235 && l < 0.45) return true; // navy, denim
  if (h >= 25 && h <= 50 && s < 0.5) return true; // beige, camel, khaki
  return false;
}

export function harmonyPenalty(colors: string[]): number {
  const loud = colors.filter((c) => !isNeutral(c)).map((c) => hexToHsl(c)[0]);
  let p = 0;
  if (loud.length > 2) p += (loud.length - 2) * 10;
  for (let i = 0; i < loud.length; i++)
    for (let j = i + 1; j < loud.length; j++) {
      const d = Math.min(Math.abs(loud[i] - loud[j]), 360 - Math.abs(loud[i] - loud[j]));
      // Analogous (< 35°) or complementary (> 150°) read as intentional; in-between clashes.
      if (d >= 35 && d <= 150) p += 6;
    }
  return p;
}

const NAMES: [string, string][] = [
  ['#111418', 'Black'], ['#F4F4F2', 'White'], ['#8A8F96', 'Grey'], ['#1F2A44', 'Navy'],
  ['#3E5A7E', 'Denim'], ['#C8B79A', 'Beige'], ['#A7773F', 'Camel'], ['#5C4033', 'Brown'],
  ['#5B6B3A', 'Olive'], ['#2F6B4F', 'Green'], ['#B23A3A', 'Red'], ['#E07A8F', 'Pink'],
  ['#E3B23C', 'Mustard'], ['#E8783C', 'Orange'], ['#6B4C9A', 'Purple'], ['#6FA8DC', 'Light blue'],
];

export function nameColor(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  let best = NAMES[0], bd = Infinity;
  for (const c of NAMES) {
    const m = parseInt(c[0].slice(1), 16);
    const d = [(m >> 16) & 255, (m >> 8) & 255, m & 255].reduce((s, v, i) => s + (v - rgb[i]) ** 2, 0);
    if (d < bd) { bd = d; best = c; }
  }
  return best[1];
}

/** Dominant colour of an image, ignoring transparent and near-white background pixels. Runs on-device. */
export async function dominantColor(src: string): Promise<string> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = src;
  await img.decode();
  const size = 48;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) return '#8A8F96';
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  const buckets = new Map<string, { n: number; r: number; g: number; b: number }>();
  let whites = 0;
  for (let y = 8; y < size - 8; y++)
    for (let x = 8; x < size - 8; x++) {
      const i = (y * size + x) * 4;
      const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
      if (a < 128) continue;
      if (r > 225 && g > 225 && b > 225) { whites++; continue; }
      const k = `${r >> 5},${g >> 5},${b >> 5}`;
      const e = buckets.get(k) ?? { n: 0, r: 0, g: 0, b: 0 };
      e.n++; e.r += r; e.g += g; e.b += b;
      buckets.set(k, e);
    }
  let top: { n: number; r: number; g: number; b: number } | undefined;
  for (const e of buckets.values()) if (!top || e.n > top.n) top = e;
  if (whites > (top?.n ?? 0)) return '#F4F4F2'; // a white garment on a transparent cut-out
  if (!top) return '#8A8F96';
  const hex = (v: number) => Math.round(v / top!.n).toString(16).padStart(2, '0');
  return `#${hex(top.r)}${hex(top.g)}${hex(top.b)}`;
}
