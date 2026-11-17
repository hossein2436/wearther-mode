/** Keeps the account in step with the server: session, closet backup, photos, weather. */
import { useEffect, useRef } from 'react';
import { api, ApiError, dataUrlToBlob } from '../api';
import { useStore, type State } from './store';
import type { Item } from '../types';

/** What we back up: everything except the photos themselves (those go to /api/images). */
export function snapshot(s: State) {
  return {
    closet: s.closet.map(({ photo, photoSynced: _ps, ...rest }) => ({ ...rest, hasPhoto: !!photo })),
    worn: s.worn,
    win: s.win,
    thermal: s.thermal,
    learnedOffset: s.learnedOffset,
    pairWeights: s.pairWeights,
    units: s.units,
    place: s.place,
    autoWashAfter: s.autoWashAfter,
  };
}

/** Rebuild local state from a server backup (e.g. on a new phone). */
export function restore(data: Record<string, unknown>): Partial<State> {
  const closet = ((data.closet as (Item & { hasPhoto?: boolean })[]) ?? []).map(({ hasPhoto, ...i }) => ({
    ...i,
    photo: hasPhoto ? `/api/images/${i.id}` : undefined,
    photoSynced: hasPhoto,
  }));
  const pick = <K extends keyof State>(k: K) => (data[k] !== undefined ? { [k]: data[k] } : {});
  return {
    closet,
    ...pick('worn'), ...pick('win'), ...pick('thermal'), ...pick('learnedOffset'),
    ...pick('pairWeights'), ...pick('units'), ...pick('place'), ...pick('autoWashAfter'),
  } as Partial<State>;
}

export function useServerSync() {
  const { s, d } = useStore();
  const uploading = useRef(new Set<string>());

  // Check the session once per launch and pick up trial/subscription changes.
  useEffect(() => {
    if (s.demo || !s.email) return;
    api.me()
      .then(({ user }) => d({ type: 'patch', patch: { subscribed: user.subscribed, trialStart: user.trialStart } }))
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) d({ type: 'patch', patch: { email: null } });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.demo, s.email === null]);

  // Back up the closet a couple of seconds after it changes.
  const snap = JSON.stringify(snapshot(s));
  useEffect(() => {
    if (s.demo || !s.email || !s.onboarded) return;
    const t = setTimeout(() => void api.putCloset(JSON.parse(snap)).catch(() => undefined), 2000);
    return () => clearTimeout(t);
  }, [snap, s.demo, s.email, s.onboarded]);

  // Upload photos that aren't on the server yet.
  useEffect(() => {
    if (s.demo || !s.email) return;
    for (const it of s.closet) {
      if (!it.photo?.startsWith('data:') || it.photoSynced || uploading.current.has(it.id)) continue;
      uploading.current.add(it.id);
      void dataUrlToBlob(it.photo)
        .then((b) => api.putImage(it.id, b))
        .then(() => d({ type: 'updateItem', item: { ...it, photoSynced: true } }))
        .catch(() => undefined)
        .finally(() => uploading.current.delete(it.id));
    }
  }, [s.closet, s.demo, s.email, d]);
}

const FRESH_MS = 30 * 60_000;

/** Fetch the forecast when it's missing or older than 30 minutes. */
export function useForecast() {
  const { s, d } = useStore();
  useEffect(() => {
    if (s.demo || (!s.coords && !s.place)) return;
    const age = s.forecast ? Date.now() - Date.parse(s.forecast.fetchedAt) : Infinity;
    const sameLoc = s.forecast && (s.coords
      ? Math.abs(s.forecast.lat - s.coords.lat) < 0.06 && Math.abs(s.forecast.lon - s.coords.lon) < 0.06
      : s.forecast.place.toLowerCase() === s.place.toLowerCase());
    if (age < FRESH_MS && sameLoc) return;
    let live = true;
    api.weather(s.coords ?? { city: s.place })
      .then((w) => live && d({ type: 'patch', patch: { forecast: w, place: s.coords ? w.place : s.place || w.place, offline: false } }))
      .catch((e) => {
        if (!live) return;
        if (e instanceof ApiError && e.code === 'offline') d({ type: 'patch', patch: { offline: true } });
        else if (e instanceof ApiError && e.code === 'place_not_found') d({ type: 'toast', text: `We couldn’t find “${s.place}”. Check the city in Settings.` });
        else d({ type: 'patch', patch: { offline: true } });
      });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.demo, s.coords?.lat, s.coords?.lon, s.place, s.isoToday]);
}
