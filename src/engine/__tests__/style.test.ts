import { describe, expect, it } from 'vitest';
import type { Item } from '../../types';
import { analyse, family, styleScore, toOklch } from '../style';
import { learn, tasteScore } from '../taste';
import { pick, summarize } from '../index';
import { sampleCloset, scenarioForecast } from '../../data/mock';

let n = 0;
const it_ = (slot: Item['slot'], kind: Item['kind'], color: string, extra: Partial<Item> = {}): Item => ({
  id: `i${n++}`, name: `${kind}`, slot, kind, color, colorName: '', warmth: 2, formality: 2,
  status: 'available', wearCount: 0, addedAt: '2026-01-01', ...extra,
});

describe('colour science', () => {
  it('OKLCH: white is light and grey, saturated red has chroma', () => {
    const w = toOklch('#ffffff');
    expect(w.L).toBeCloseTo(1, 2);
    expect(w.C).toBeLessThan(0.001);
    expect(toOklch('#d0312d').C).toBeGreaterThan(0.15);
  });
  it('families: stylists’ neutrals are neutral', () => {
    expect(family('#1F2A44')).toBe('navy');
    expect(family('#3E5A7E')).toBe('denim');
    expect(family('#C19A6B')).toBe('camel');
    expect(family('#5C4033')).toBe('brown');
    expect(family('#111418')).toBe('black');
    expect(family('#B23A3A')).toBe('red');
    expect(family('#2F6B4F')).toBe('green');
  });
});

describe('style rules', () => {
  const navy = it_('top', 'knit', '#1F2A44');
  const jeans = it_('bottom', 'jeans', '#3E5A7E');
  const white = it_('shoes', 'sneakers', '#F4F4F2');
  const red = it_('top', 'tshirt', '#C0392B');
  const green = it_('bottom', 'chinos', '#2E8B57');
  const orange = it_('shoes', 'sneakers', '#E8783C');

  it('neutral base + one colour scores well and says why', () => {
    const r = styleScore([red, jeans, white]);
    expect(r.scheme).toBe('accent');
    expect(r.score).toBeGreaterThan(0);
    expect(r.reasons[0]).toMatch(/one colour/);
  });
  it('a hue clash scores below an all-neutral look', () => {
    const purple = it_('bottom', 'chinos', '#6B4C9A');
    expect(analyse([red, purple, orange]).scheme).not.toBe('accent');
    expect(styleScore([red, green, orange]).score).toBeLessThan(styleScore([navy, jeans, white]).score);
  });
  it('two loud pieces are penalised', () => {
    const r = styleScore([red, it_('bottom', 'chinos', '#2E9BD6', { formality: 2 }), white]);
    expect(r.features).toContain('rule:one-statement');
  });
  it('boots with shorts is a mistake', () => {
    const r = styleScore([navy, it_('bottom', 'shorts', '#C8B79A'), it_('shoes', 'boots', '#5C4033')]);
    expect(r.features).toContain('rule:boots-shorts');
  });
  it('two patterns compete, one pattern is fine', () => {
    const striped = { ...navy, id: 'p1', pattern: 'stripes' as const };
    const check = { ...jeans, id: 'p2', pattern: 'check' as const };
    expect(styleScore([striped, check, white]).features).toContain('rule:pattern-clash');
    expect(styleScore([striped, jeans, white]).features).toContain('rule:one-pattern');
  });
  it('features never contain ids or names', () => {
    for (const f of styleScore([red, jeans, white]).features) expect(f).toMatch(/^[a-z]+:[a-z0-9+-]+$/);
  });
});

describe('taste', () => {
  it('learns from wears and skips, bounded', () => {
    const f = ['scheme:accent', 'accent:red'];
    let t = {};
    for (let i = 0; i < 10; i++) t = learn(t, f, 'wear');
    expect(tasteScore(f, t)).toBeGreaterThan(1);
    let u = {};
    for (let i = 0; i < 200; i++) u = learn(u, f, 'dislike');
    expect(Object.values(u).every((w) => (w as number) >= -3)).toBe(true);
    expect(tasteScore(f, u)).toBeLessThan(0);
  });
  it('the community prior fades as personal evidence grows', () => {
    const prior = { 'scheme:accent': 1 };
    expect(tasteScore(['scheme:accent'], {}, prior, 0)).toBeGreaterThan(tasteScore(['scheme:accent'], {}, prior, 100));
  });
  it('taste changes what the engine picks', () => {
    const closet = sampleCloset();
    const summary = summarize(scenarioForecast('mixed'), { leave: 8, back: 18 }, 0);
    const base = pick({ closet, summary, today: '2026-11-18' }).hero!;
    let taste = {};
    for (let i = 0; i < 25; i++) taste = learn(taste, base.features, 'dislike');
    const after = pick({ closet, summary, today: '2026-11-18', taste, evidence: 25 }).hero!;
    expect(after.items.map((i) => i.id).sort()).not.toEqual(base.items.map((i) => i.id).sort());
    expect(base.style.length).toBeGreaterThan(0);
  });
});

describe('why this look', async () => {
  const { pieceReasons, conditionLabel, bodyOrder } = await import('../explain');
  const deg = (c: number) => `${Math.round(c)}°`;
  it('explains every piece, in body order, from the weather', () => {
    const closet = sampleCloset();
    const s = summarize(scenarioForecast('mixed'), { leave: 8, back: 18 }, 0);
    const look = pick({ closet, summary: s, today: '2026-11-18' }).hero!;
    const r = pieceReasons(look.items, s, deg);
    expect(r.map((x) => x.id)).toEqual(bodyOrder(look.items).map((i) => i.id));
    expect(r.every((x) => x.text.length > 10)).toBe(true);
    const outer = look.items.find((i) => i.slot === 'outer');
    if (outer && s.rainFrom !== null) expect(r.find((x) => x.id === outer.id)!.text).toMatch(/rain from/);
    expect(conditionLabel(s)).toMatch(/Rain from|Dry/);
  });
  it('says hot and dry on a hot day', () => {
    const s = summarize(scenarioForecast('hot'), { leave: 8, back: 18 }, 0);
    expect(conditionLabel(s)).toBe('Hot and dry');
  });
});
