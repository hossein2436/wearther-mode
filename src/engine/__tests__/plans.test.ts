import { describe, expect, it } from 'vitest';
import { PLAN, accessFor, imagePeriod } from '../../plans';

const base = { subscribed: false, trialDay: 1, freeLooksUsed: 0, modelImagesUsed: 0 };

describe('plans', () => {
  it('free week: every look and one picture on you', () => {
    expect(accessFor(base)).toEqual({ tier: 'trial', looksLeft: null, modelImagesLeft: 1 });
    expect(accessFor({ ...base, trialDay: 7, modelImagesUsed: 1 }).modelImagesLeft).toBe(0);
  });
  it('after the free week: 3 looks in total, then locked', () => {
    expect(accessFor({ ...base, trialDay: 8 })).toEqual({ tier: 'free', looksLeft: 3, modelImagesLeft: 0 });
    expect(accessFor({ ...base, trialDay: 40, freeLooksUsed: 2 }).looksLeft).toBe(1);
    expect(accessFor({ ...base, trialDay: 40, freeLooksUsed: 3 }).tier).toBe('locked');
  });
  it('plan: unlimited looks, 8 pictures a month', () => {
    expect(PLAN.priceUsd).toBe(1.99);
    expect(accessFor({ ...base, subscribed: true, trialDay: 90, freeLooksUsed: 3, modelImagesUsed: 5 }))
      .toEqual({ tier: 'paid', looksLeft: null, modelImagesLeft: 3 });
    expect(imagePeriod('2026-11-18', 'paid')).toBe('2026-11');
    expect(imagePeriod('2026-11-18', 'trial')).toBe('trial');
  });
});
