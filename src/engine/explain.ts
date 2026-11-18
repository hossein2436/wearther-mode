/**
 * Plain-language reasons for a look, from the same weather numbers the engine used. Deterministic
 * rules, no AI: rain decides the coat and shoes, the feels-like range decides the layers, the
 * midday high decides shorts and sandals. Same rules for every look, so the explanation can never
 * contradict the outfit. Ported from the v4.4 prototype (`whyLines` in redesign/v4/wearther-v4.html).
 */
import type { Item, Slot, WindowSummary } from '../types';

export const SLOT_ORDER: Slot[] = ['outer', 'mid', 'top', 'onepiece', 'bottom', 'shoes'];
export const bodyOrder = (items: Item[]) => [...items].sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));

const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;

export function pieceReasons(items: Item[], s: WindowSummary, deg: (c: number) => string): { id: string; name: string; text: string }[] {
  const rain = s.rainFrom !== null ? hh(s.rainFrom) : null;
  const lo = deg(s.minFeels), hi = deg(s.maxFeels);
  return bodyOrder(items).map((it) => {
    const r = (text: string) => ({ id: it.id, name: it.name, text });
    switch (it.slot) {
      case 'outer':
        if (rain) return r(it.waterproof ? `rain from ${rain}, and this one is waterproof.` : `rain from ${rain}: the outer layer keeps the worst of it off.`);
        if (s.minFeels <= 0) return r(`coldest hour ${lo}: the warmest layer you have.`);
        return r(`it drops to ${lo}, so a coat for the cold end of the day.`);
      case 'mid':
        return r(`feels ${lo} to ${hi}: a warm layer you can take off indoors.`);
      case 'top':
        if (it.kind === 'shirt') return r('a shirt, not a tee: neat on its own, comfortable under a layer.');
        if (it.kind === 'tshirt') return r(s.maxFeels >= 22 ? `${hi} at the warmest: the lightest top that still covers.` : 'a light base layer under everything else.');
        return r(`long sleeves, so no bare arms at ${lo}.`);
      case 'onepiece':
        return r(`${hi} at the warmest: one easy piece, nothing to match.`);
      case 'bottom':
        if (it.kind === 'shorts') return r(`${hi} at midday: shorts, nothing heavier.`);
        if (it.kind === 'skirt') return r(`${hi} at the warmest: light and cool.`);
        return r(`full-length legs: warm enough at ${lo}${s.maxWind >= 25 ? ', and the wind stays out' : ''}.`);
      case 'shoes':
        if (it.kind === 'sandals') return r(`${hi}: sandals, nothing closed.`);
        if (it.kind === 'boots') return r(rain ? `closed boots for the wet streets after ${rain}.` : 'boots: warm and grippy, no cold feet.');
        if (it.kind === 'loafers') return r('loafers: smart without the weight of boots.');
        return r(rain ? `sneakers, back before the rain gets heavy.` : 'sneakers for a dry day: easy walking.');
      default:
        return r('');
    }
  });
}

/** Short condition label for the weather chip: "Rain from 17:00", "Dry and cold", "Hot and dry". */
export function conditionLabel(s: WindowSummary): string {
  if (s.rainFrom !== null) return `Rain from ${hh(s.rainFrom)}`;
  const mean = (s.minFeels + s.maxFeels) / 2;
  if (mean < 4) return 'Dry and cold';
  if (mean >= 26) return 'Hot and dry';
  if (s.maxWind >= 25) return 'Dry and windy';
  return 'Dry all day';
}
