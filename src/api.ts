/** Thin client for the Wearther Mode API (same origin, cookie session). */
import type { HourForecast } from './types';

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

async function call<T>(method: string, path: string, body?: unknown, raw?: Blob): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: {
        'X-Wearther': '1',
        ...(raw ? { 'Content-Type': raw.type } : body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new ApiError(0, 'offline');
  }
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(res.status, j.error ?? `http_${res.status}`);
  }
  const type = res.headers.get('content-type') ?? '';
  return (type.startsWith('image/') ? await res.blob() : await res.json()) as T;
}

export interface ServerUser {
  email: string;
  trialStart: string;
  trialDay: number;
  subscribed: boolean;
  entitled: boolean;
}

export interface WeatherResponse {
  place: string;
  lat: number;
  lon: number;
  fetchedAt: string;
  stale: boolean;
  attribution: string;
  days: { date: string; hours: HourForecast[] }[];
}

export const tz = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export const api = {
  requestCode: (email: string) => call<{ ok: true }>('POST', '/api/auth/request', { email }),
  verify: (email: string, code: string) => call<{ user: ServerUser }>('POST', '/api/auth/verify', { email, code }),
  logout: () => call<{ ok: true }>('POST', '/api/auth/logout', {}),
  me: () => call<{ user: ServerUser }>('GET', '/api/me'),
  deleteMe: () => call<{ ok: true }>('DELETE', '/api/me', {}),
  weather: (loc: { lat?: number; lon?: number; city?: string }) => {
    const q = new URLSearchParams({ tz: tz() });
    if (loc.lat !== undefined && loc.lon !== undefined) {
      q.set('lat', loc.lat.toFixed(2));
      q.set('lon', loc.lon.toFixed(2));
    } else if (loc.city) q.set('city', loc.city);
    return call<WeatherResponse>('GET', `/api/weather?${q}`);
  },
  geocode: (q: string) => call<{ name: string; lat: number; lon: number }>('GET', `/api/geocode?q=${encodeURIComponent(q)}`),
  cutout: (img: Blob) => call<Blob>('POST', '/api/cutout', undefined, img),
  getCloset: () => call<{ data: Record<string, unknown> | null; updatedAt: string | null }>('GET', '/api/closet'),
  putCloset: (data: Record<string, unknown>) => call<{ updatedAt: string }>('PUT', '/api/closet', { data }),
  putImage: (id: string, img: Blob) => call<{ ok: true }>('PUT', `/api/images/${id}`, undefined, img),
  deleteImage: (id: string) => call<{ ok: true }>('DELETE', `/api/images/${id}`, {}),
  pushKey: () => call<{ publicKey: string }>('GET', '/api/push/key'),
  pushSubscribe: (body: Record<string, unknown>) => call<{ ok: true }>('POST', '/api/push/subscribe', body),
  pushUnsubscribe: () => call<{ ok: true }>('DELETE', '/api/push/subscribe', {}),
  tastePrior: () => call<{ weights: Record<string, number> }>('GET', '/api/taste/prior'),
  sendTaste: (events: { f: string[]; y: 1 | -1 }[]) => call<{ ok: true }>('POST', '/api/taste', { events }),
  checkout: (plan: 'month') => call<{ url: string }>('POST', '/api/billing/checkout', { plan }),
};

export async function dataUrlToBlob(url: string): Promise<Blob> {
  return (await fetch(url)).blob();
}

export function blobToDataUrl(b: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(b);
  });
}
