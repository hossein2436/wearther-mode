import { describe, expect, it } from 'vitest';
import { pick, summarize, missingSlots } from '../index';
import { sampleCloset, scenarioForecast } from '../../data/mock';

const win = { leave: 8, back: 19 };
const today = '2026-11-18';
const run = (id: 'mixed' | 'cold' | 'hot', closet = sampleCloset()) => {
  const summary = summarize(scenarioForecast(id), win, 0);
  return { summary, ...pick({ closet, summary, today }) };
};

describe('engine v0', () => {
  it('hot day: no warm layers, no boots', () => {
    const { hero } = run('hot');
    expect(hero).not.toBeNull();
    expect(hero!.items.some((i) => i.slot === 'mid' || (i.slot === 'outer' && i.warmth >= 3))).toBe(false);
    expect(hero!.items.some((i) => i.kind === 'boots')).toBe(false);
  });
  it('cold day: always has an outer layer', () => {
    const { hero } = run('cold');
    expect(hero!.items.some((i) => i.slot === 'outer')).toBe(true);
  });
  it('rainy day: nothing that must stay out of the rain', () => {
    const { hero, planB } = run('mixed');
    for (const o of [hero, planB]) expect(o!.items.some((i) => i.keepOutOfRain)).toBe(false);
    expect(hero!.why).toMatch(/Rain from 17:00/);
  });
  it('plan B shares at most one piece', () => {
    const { hero, planB } = run('mixed');
    const ids = new Set(hero!.items.map((i) => i.id));
    expect(planB!.items.filter((i) => ids.has(i.id)).length).toBeLessThanOrEqual(1);
  });
  it('empty closet: reports what is missing', () => {
    expect(missingSlots([])).toEqual(['a top', 'trousers, jeans or a skirt', 'shoes']);
    expect(run('mixed', []).hero).toBeNull();
  });
  it('cold day with no jacket: explains instead of failing', () => {
    const closet = sampleCloset().filter((i) => i.slot !== 'outer');
    const { hero } = run('cold', closet);
    expect(hero!.notes[0]).toMatch(/no jacket/);
  });
});
