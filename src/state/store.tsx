import { PLAN, accessFor, imagePeriod, type Access } from '../plans';
import { createContext, useContext, useEffect, useReducer, useRef, type ReactNode } from 'react';
import type { DayWindow, Item, Thermal } from '../types';
import { sampleCloset, type ScenarioId } from '../data/mock';
import { load, save, clearAll } from './db';
import { pairKey } from '../engine';
import { learn, label, type Signal, type Taste } from '../engine/taste';
import type { WeatherResponse } from '../api';

export type Route =
  | 'welcome' | 'onb-day' | 'onb-thermal' | 'onb-place' | 'starter'
  | 'add' | 'signin' | 'today' | 'closet' | 'item' | 'settings';

export interface DraftItem {
  id: string;
  photo?: string;
  sample?: Item; // demo item with illustration
  state: 'cutting' | 'ready';
  item?: Item;
}

export interface State {
  route: Route;
  itemId?: string;
  onboarded: boolean;
  closet: Item[];
  win: DayWindow;
  thermal: Thermal;
  learnedOffset: number;
  place: string;
  coords: { lat: number; lon: number } | null;
  forecast: WeatherResponse | null;
  units: 'C' | 'F';
  notifyAt: string | null;
  email: string | null;
  trialStart: string | null;
  subscribed: boolean;
  pairWeights: Record<string, number>;
  /** Learned weights over look features (engine/taste.ts). */
  taste: Taste;
  tasteEvidence: number;
  /** Opt-in: send anonymous look features to improve everyone's starting point. Off by default. */
  shareTaste: boolean;
  tasteQueue: { f: string[]; y: 1 | -1 }[];
  prior: Taste;
  loved: string[];
  /** Looks (by signature) shown after the free week ended; capped at PLAN.freeLooks. */
  freeLooksSeen: string[];
  /** Pictures of a look on you made in a period (imagePeriod in plans.ts). */
  modelImages: { period: string; used: number };
  worn: { date: string; ids: string[] }[];
  checkInFor: string | null; // date of the wear awaiting a check-in
  autoWashAfter: number;
  drafts: DraftItem[];
  toast: string | null;
  // Prototype controls
  scenario: ScenarioId;
  simDay: number | null; // override trial day
  offline: boolean;
  isoToday: string;
  /** Review link or prototype: uses scenario weather and no server. */
  demo: boolean;
}

/** Local calendar date, YYYY-MM-DD. */
export const todayIso = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const initialState: State = {
  route: 'welcome',
  onboarded: false,
  closet: [],
  win: { leave: 8, back: 18 },
  thermal: 'neutral',
  learnedOffset: 0,
  place: '',
  coords: null,
  forecast: null,
  units: 'C',
  notifyAt: null,
  email: null,
  trialStart: null,
  subscribed: false,
  pairWeights: {},
  taste: {},
  tasteEvidence: 0,
  shareTaste: false,
  tasteQueue: [],
  prior: {},
  loved: [],
  freeLooksSeen: [],
  modelImages: { period: '', used: 0 },
  worn: [],
  checkInFor: null,
  autoWashAfter: 3,
  drafts: [],
  toast: null,
  scenario: 'mixed',
  simDay: null,
  offline: false,
  isoToday: todayIso(),
  demo: false,
};

export type Action =
  | { type: 'go'; route: Route; itemId?: string }
  | { type: 'patch'; patch: Partial<State> }
  | { type: 'addDrafts'; drafts: DraftItem[] }
  | { type: 'draftReady'; id: string; item: Item }
  | { type: 'confirmDraft'; id: string; item: Item }
  | { type: 'discardDraft'; id: string }
  | { type: 'updateItem'; item: Item }
  | { type: 'deleteItem'; id: string }
  | { type: 'wear'; ids: string[] }
  | { type: 'seeFreeLook'; sig: string }
  | { type: 'rate'; ids: string[]; delta: number }
  | { type: 'tasteSent'; n: number }
  | { type: 'feedback'; signal: Signal; ids: string[]; features: string[]; quiet?: boolean }
  | { type: 'checkIn'; feel: 'cold' | 'right' | 'warm' }
  | { type: 'laundryDone' }
  | { type: 'loadSample' }
  | { type: 'toast'; text: string | null }
  | { type: 'hydrate'; state: Partial<State> }
  | { type: 'reset' };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'go':
      return { ...s, route: a.route, itemId: a.itemId ?? s.itemId };
    case 'patch':
      return { ...s, ...a.patch };
    case 'addDrafts':
      return { ...s, drafts: [...s.drafts, ...a.drafts] };
    case 'draftReady':
      return { ...s, drafts: s.drafts.map((d) => (d.id === a.id ? { ...d, state: 'ready', item: a.item } : d)) };
    case 'confirmDraft':
      return { ...s, drafts: s.drafts.filter((d) => d.id !== a.id), closet: [...s.closet, a.item] };
    case 'discardDraft':
      return { ...s, drafts: s.drafts.filter((d) => d.id !== a.id) };
    case 'updateItem':
      return { ...s, closet: s.closet.map((i) => (i.id === a.item.id ? a.item : i)) };
    case 'deleteItem':
      return { ...s, closet: s.closet.filter((i) => i.id !== a.id), route: 'closet' };
    case 'seeFreeLook': {
      if (s.freeLooksSeen.includes(a.sig) || s.freeLooksSeen.length >= PLAN.freeLooks) return s;
      return { ...s, freeLooksSeen: [...s.freeLooksSeen, a.sig] };
    }
    case 'wear': {
      const date = s.isoToday;
      const closet = s.closet.map((i) => {
        if (!a.ids.includes(i.id)) return i;
        const wearCount = i.wearCount + 1;
        const sinceWash = s.worn.filter((w) => w.ids.includes(i.id)).length + 1;
        const status = i.slot !== 'outer' && i.slot !== 'shoes' && sinceWash % s.autoWashAfter === 0 ? 'wash' : i.status;
        return { ...i, wearCount, lastWorn: date, status } as Item;
      });
      return { ...s, closet, worn: [...s.worn.filter((w) => w.date !== date), { date, ids: a.ids }], checkInFor: date }; // the Today stamp confirms it; no toast
    }
    case 'rate': {
      const pw = { ...s.pairWeights };
      for (let x = 0; x < a.ids.length; x++)
        for (let y = x + 1; y < a.ids.length; y++) {
          const k = pairKey(a.ids[x], a.ids[y]);
          pw[k] = Math.max(-3, Math.min(3, (pw[k] ?? 0) + a.delta));
        }
      return { ...s, pairWeights: pw, toast: a.delta > 0 ? 'Noted. More like this.' : 'Noted. Here’s something different.' };
    }
    case 'tasteSent':
      return { ...s, tasteQueue: s.tasteQueue.slice(a.n) };
    case 'feedback': {
      const delta = a.signal === 'love' ? 1 : a.signal === 'dislike' ? -1 : a.signal === 'wear' ? 0.5 : -0.25;
      const pw = { ...s.pairWeights };
      for (let x = 0; x < a.ids.length; x++)
        for (let y = x + 1; y < a.ids.length; y++) {
          const k = pairKey(a.ids[x], a.ids[y]);
          pw[k] = Math.max(-3, Math.min(3, (pw[k] ?? 0) + delta));
        }
      const sig = [...a.ids].sort().join('+');
      return {
        ...s,
        pairWeights: pw,
        taste: learn(s.taste, a.features, a.signal),
        tasteEvidence: s.tasteEvidence + 1,
        tasteQueue: s.shareTaste ? [...s.tasteQueue, { f: a.features, y: label(a.signal) }].slice(-200) : s.tasteQueue,
        loved: a.signal === 'love' ? [...new Set([...s.loved, sig])] : s.loved,
        toast: a.quiet ? s.toast : a.signal === 'love' ? 'Saved. You’ll see more like this.' : a.signal === 'dislike' ? 'Got it. Less like this.' : s.toast,
      };
    }
    case 'checkIn': {
      const d = a.feel === 'cold' ? -1 : a.feel === 'warm' ? 1 : 0;
      return { ...s, learnedOffset: Math.max(-4, Math.min(4, s.learnedOffset + d)), checkInFor: null, toast: d ? 'Thanks. Tomorrow’s outfit will adjust.' : 'Good to hear.' };
    }
    case 'laundryDone':
      return { ...s, closet: s.closet.map((i) => (i.status === 'wash' ? { ...i, status: 'available' } : i)), toast: 'Laundry’s back in the closet' };
    case 'loadSample':
      return { ...s, closet: sampleCloset() };
    case 'toast':
      return { ...s, toast: a.text };
    case 'hydrate':
      return { ...s, ...a.state, drafts: [], toast: null, isoToday: todayIso() };
    case 'reset':
      return { ...initialState, isoToday: todayIso(), demo: s.demo };
  }
}

const Ctx = createContext<{ s: State; d: (a: Action) => void } | null>(null);

const PERSIST: (keyof State)[] = [
  'onboarded', 'closet', 'win', 'thermal', 'learnedOffset', 'place', 'coords', 'forecast', 'units', 'notifyAt', 'email',
  'trialStart', 'subscribed', 'pairWeights', 'taste', 'tasteEvidence', 'shareTaste', 'tasteQueue', 'prior', 'loved', 'freeLooksSeen', 'modelImages', 'worn', 'checkInFor', 'autoWashAfter', 'scenario', 'simDay',
];

export function StoreProvider({ children, initial }: { children: ReactNode; initial?: Partial<State> }) {
  const [s, d] = useReducer(reducer, { ...initialState, ...initial, demo: !!initial });
  const hydrated = useRef(!!initial);

  useEffect(() => {
    if (hydrated.current) return;
    load<Partial<State>>('state').then((saved) => {
      if (saved) d({ type: 'hydrate', state: { ...saved, route: saved.onboarded ? 'today' : 'welcome' } });
      hydrated.current = true;
    });
  }, []);

  useEffect(() => {
    if (!hydrated.current || initial) return; // review links never overwrite a real closet
    const snapshot = Object.fromEntries(PERSIST.map((k) => [k, s[k]]));
    void save('state', snapshot);
  }, [s, initial]);

  useEffect(() => {
    if (!s.toast) return;
    const t = setTimeout(() => d({ type: 'toast', text: null }), 2600);
    return () => clearTimeout(t);
  }, [s.toast]);

  return <Ctx.Provider value={{ s, d }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('StoreProvider missing');
  return v;
}

export async function resetEverything() {
  await clearAll();
}

/** What this user can see and make right now (plans.ts). */
export function accessOf(s: State): Access {
  const day = trialDay(s);
  const subscribed = s.subscribed;
  const tier = subscribed ? 'paid' : day === null || day <= PLAN.trialDays ? 'trial' : 'free';
  const period = imagePeriod(s.isoToday, tier);
  return accessFor({
    subscribed, trialDay: day, freeLooksUsed: s.freeLooksSeen.length,
    modelImagesUsed: s.modelImages.period === period ? s.modelImages.used : 0,
  });
}

/** Trial day, 1-based. Day 8+ means the free week is over. */
export function trialDay(s: State): number | null {
  if (s.simDay !== null) return s.simDay;
  if (!s.trialStart) return null;
  return Math.floor((Date.parse(s.isoToday) - Date.parse(s.trialStart)) / 86_400_000) + 1;
}
