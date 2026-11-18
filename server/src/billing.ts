import { PLAN } from '../../src/plans';

export const TRIAL_DAYS = PLAN.trialDays;

export interface UserRow {
  id: string;
  email: string;
  created_at: string;
  trial_start: string;
  subscribed_until: string | null;
}

export function trialDay(u: UserRow, now = new Date()): number {
  return Math.floor((now.getTime() - Date.parse(u.trial_start)) / 86_400_000) + 1;
}

export function isSubscribed(u: UserRow, now = new Date()): boolean {
  return !!u.subscribed_until && Date.parse(u.subscribed_until) > now.getTime();
}

export function isEntitled(u: UserRow, now = new Date()): boolean {
  return isSubscribed(u, now) || trialDay(u, now) <= TRIAL_DAYS;
}

export function publicUser(u: UserRow, now = new Date()) {
  return {
    email: u.email,
    trialStart: u.trial_start.slice(0, 10),
    trialDay: trialDay(u, now),
    subscribed: isSubscribed(u, now),
    entitled: isEntitled(u, now),
  };
}
