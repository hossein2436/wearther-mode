/**
 * What each kind of user gets. Shared by the app and the server, so the paywall copy, the
 * Today gate and the server's checks can never disagree.
 *
 * - Free week (days 1-7): every look, plus 1 picture of a look on you.
 * - After the free week, without a plan: 3 more looks in total, ever. Then the plan is needed.
 * - Plan, $1.99 a month: every look, plus 8 pictures of a look on you each calendar month.
 *   Looks themselves (the flat lay of your own pieces) are never metered on the plan.
 */
export const PLAN = {
  priceUsd: 1.99,
  priceLabel: '$1.99',
  period: 'month',
  modelImagesPerMonth: 8,
  trialDays: 7,
  trialModelImages: 1,
  freeLooks: 3,
} as const;

export type Tier = 'trial' | 'paid' | 'free' | 'locked';

export interface Access {
  tier: Tier;
  /** null means unlimited. */
  looksLeft: number | null;
  /** Pictures of a look on you still available in the current period. */
  modelImagesLeft: number;
}

/** Calendar month the model-image allowance belongs to, YYYY-MM. The free week has its own bucket. */
export const imagePeriod = (isoDay: string, tier: Tier) => (tier === 'trial' ? 'trial' : isoDay.slice(0, 7));

export function accessFor(o: {
  subscribed: boolean;
  /** 1-based day of the free week; null when it hasn't started (not onboarded yet). */
  trialDay: number | null;
  /** Distinct looks shown after the free week ended. */
  freeLooksUsed: number;
  /** Model images already made in the current period (see imagePeriod). */
  modelImagesUsed: number;
}): Access {
  if (o.subscribed) return { tier: 'paid', looksLeft: null, modelImagesLeft: Math.max(0, PLAN.modelImagesPerMonth - o.modelImagesUsed) };
  if (o.trialDay === null || o.trialDay <= PLAN.trialDays) {
    return { tier: 'trial', looksLeft: null, modelImagesLeft: Math.max(0, PLAN.trialModelImages - o.modelImagesUsed) };
  }
  const left = Math.max(0, PLAN.freeLooks - o.freeLooksUsed);
  return { tier: left > 0 ? 'free' : 'locked', looksLeft: left, modelImagesLeft: 0 };
}
