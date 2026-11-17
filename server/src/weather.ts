/**
 * Weather from MET Norway Locationforecast 2.0 (free incl. commercial use, CC BY 4.0).
 * Terms we follow: identifying User-Agent, ≤ 4 decimals in coordinates, honour Expires and
 * If-Modified-Since, cache everything server-side so traffic stays far below 20 req/s.
 * Geocoding from OpenStreetMap Nominatim (1 req/s max, cached forever, attribution required).
 */
import type { DB } from './db';
import type { HourForecast } from '../../src/types';

export const ATTRIBUTION = 'Weather data: MET Norway, CC BY 4.0. Places: © OpenStreetMap contributors';

/** One slot of the cached timeseries, in UTC. */
export interface Slot {
  t: string; // ISO UTC
  temp: number; // °C
  rh: number; // %
  windMs: number; // m/s
  uv: number;
  pp: number; // probability of precipitation, %
}

export type Fetcher = typeof fetch;

export interface WeatherConfig {
  userAgent: string;
  fetcher?: Fetcher;
  now?: () => number;
}

/** Round to ~11 km cells: protects privacy and lets many users share one cached forecast. */
export function cellOf(lat: number, lon: number): { lat: number; lon: number; key: string } {
  const r = (x: number) => Math.round(x * 10) / 10;
  const la = Math.max(-90, Math.min(90, r(lat)));
  const lo = Math.max(-180, Math.min(180, r(lon)));
  return { lat: la, lon: lo, key: `${la.toFixed(1)},${lo.toFixed(1)}` };
}

/**
 * Feels-like temperature (°C).
 * Wind chill (NWS/Environment Canada) when T ≤ 10 °C and wind > 4.8 km/h;
 * heat index (NWS Rothfusz regression) when T ≥ 27 °C and RH ≥ 40 %; otherwise air temperature.
 */
export function feelsLike(tempC: number, windKmh: number, rh: number): number {
  if (tempC <= 10 && windKmh > 4.8) {
    const v = Math.pow(windKmh, 0.16);
    return 13.12 + 0.6215 * tempC - 11.37 * v + 0.3965 * tempC * v;
  }
  if (tempC >= 27 && rh >= 40) {
    const T = tempC * 9 / 5 + 32;
    const R = rh;
    const hi = -42.379 + 2.04901523 * T + 10.14333127 * R - 0.22475541 * T * R - 0.00683783 * T * T
      - 0.05481717 * R * R + 0.00122874 * T * T * R + 0.00085282 * T * R * R - 0.00000199 * T * T * R * R;
    return ((hi - 32) * 5) / 9;
  }
  return tempC;
}

interface MetStep {
  time: string;
  data: {
    instant: { details: Record<string, number | undefined> };
    next_1_hours?: { details?: Record<string, number | undefined> };
    next_6_hours?: { details?: Record<string, number | undefined> };
  };
}

/** Parse a Locationforecast `complete` response into hourly slots (first 48 h). */
export function parseMet(json: unknown): Slot[] {
  const steps = (json as { properties?: { timeseries?: MetStep[] } })?.properties?.timeseries ?? [];
  const out: Slot[] = [];
  for (const s of steps) {
    const d = s.data?.instant?.details ?? {};
    if (typeof d.air_temperature !== 'number') continue;
    const n1 = s.data.next_1_hours?.details ?? {};
    const n6 = s.data.next_6_hours?.details ?? {};
    let pp = n1.probability_of_precipitation ?? n6.probability_of_precipitation;
    if (pp === undefined) {
      const mm = n1.precipitation_amount ?? (n6.precipitation_amount !== undefined ? n6.precipitation_amount / 6 : 0);
      pp = mm >= 0.3 ? 70 : mm > 0 ? 35 : 5;
    }
    out.push({
      t: s.time,
      temp: d.air_temperature,
      rh: d.relative_humidity ?? 60,
      windMs: d.wind_speed ?? 0,
      uv: d.ultraviolet_index_clear_sky ?? 0,
      pp,
    });
    if (out.length >= 48) break;
  }
  return out;
}

function localParts(iso: string, tz: string): { date: string; hour: number } {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' });
  const p = Object.fromEntries(f.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) };
}

export function validTz(tz: string | undefined): string {
  try {
    if (tz) {
      new Intl.DateTimeFormat('en', { timeZone: tz });
      return tz;
    }
  } catch {
    /* fall through */
  }
  return 'UTC';
}

/** Group slots into local days (hour 0–23) for the user's time zone. */
export function toDays(slots: Slot[], tz: string): { date: string; hours: HourForecast[] }[] {
  const days = new Map<string, HourForecast[]>();
  for (const s of slots) {
    const { date, hour } = localParts(s.t, tz);
    const windKmh = s.windMs * 3.6;
    const h: HourForecast = {
      hour,
      tempC: Math.round(s.temp),
      feelsC: Math.round(feelsLike(s.temp, windKmh, s.rh)),
      precipProb: Math.round(s.pp),
      windKmh: Math.round(windKmh),
      uv: Math.round(s.uv * 10) / 10,
    };
    if (!days.has(date)) days.set(date, []);
    const list = days.get(date)!;
    if (!list.some((x) => x.hour === hour)) list.push(h);
  }
  return [...days.entries()].map(([date, hours]) => ({ date, hours }));
}

export class WeatherService {
  private fetcher: Fetcher;
  private now: () => number;
  private lastNominatim = 0;

  constructor(private db: DB, private cfg: WeatherConfig) {
    this.fetcher = cfg.fetcher ?? fetch;
    this.now = cfg.now ?? Date.now;
  }

  /** Cached slots for a cell; refreshes from MET when the cache has expired. */
  async slots(lat: number, lon: number): Promise<{ slots: Slot[]; fetchedAt: string; stale: boolean }> {
    const cell = cellOf(lat, lon);
    const row = this.db.prepare('SELECT body, expires_at, last_modified FROM weather_cache WHERE cell = ?').get(cell.key) as
      | { body: string; expires_at: number; last_modified: string | null }
      | undefined;
    const cached = row ? (JSON.parse(row.body) as { slots: Slot[]; fetchedAt: string }) : null;
    if (row && cached && row.expires_at > this.now()) return { ...cached, stale: false };

    const url = `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${cell.lat}&lon=${cell.lon}`;
    const headers: Record<string, string> = { 'User-Agent': this.cfg.userAgent, Accept: 'application/json' };
    if (row?.last_modified) headers['If-Modified-Since'] = row.last_modified;
    try {
      const res = await this.fetcher(url, { headers, signal: AbortSignal.timeout(10_000) });
      const expires = Date.parse(res.headers.get('expires') ?? '') || this.now() + 30 * 60_000;
      if (res.status === 304 && cached) {
        this.db.prepare('UPDATE weather_cache SET expires_at = ? WHERE cell = ?').run(expires, cell.key);
        return { ...cached, stale: false };
      }
      if (!res.ok) throw new Error(`MET responded ${res.status}`);
      const fresh = { slots: parseMet(await res.json()), fetchedAt: new Date(this.now()).toISOString() };
      this.db
        .prepare('INSERT OR REPLACE INTO weather_cache (cell, body, expires_at, last_modified) VALUES (?, ?, ?, ?)')
        .run(cell.key, JSON.stringify(fresh), expires, res.headers.get('last-modified'));
      return { ...fresh, stale: false };
    } catch (err) {
      if (cached) return { ...cached, stale: true }; // serve the last good forecast
      throw err;
    }
  }

  private async nominatim(path: string): Promise<unknown> {
    const wait = this.lastNominatim + 1100 - this.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait)); // policy: max 1 request/second
    this.lastNominatim = this.now();
    const res = await this.fetcher(`https://nominatim.openstreetmap.org/${path}`, {
      headers: { 'User-Agent': this.cfg.userAgent, 'Accept-Language': 'en' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Nominatim responded ${res.status}`);
    return res.json();
  }

  async geocode(q: string): Promise<{ name: string; lat: number; lon: number } | null> {
    const key = `q:${q.trim().toLowerCase()}`;
    const hit = this.db.prepare('SELECT body FROM geocode_cache WHERE q = ?').get(key) as { body: string } | undefined;
    if (hit) return JSON.parse(hit.body);
    const list = (await this.nominatim(`search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(q)}`)) as {
      lat: string; lon: string; name?: string; display_name: string;
    }[];
    const r = list[0] ? { name: list[0].name || list[0].display_name.split(',')[0], lat: Number(list[0].lat), lon: Number(list[0].lon) } : null;
    if (r) this.db.prepare('INSERT OR REPLACE INTO geocode_cache (q, body) VALUES (?, ?)').run(key, JSON.stringify(r));
    return r;
  }

  async placeName(lat: number, lon: number): Promise<string> {
    const cell = cellOf(lat, lon);
    const key = `r:${cell.key}`;
    const hit = this.db.prepare('SELECT body FROM geocode_cache WHERE q = ?').get(key) as { body: string } | undefined;
    if (hit) return JSON.parse(hit.body);
    try {
      const r = (await this.nominatim(`reverse?format=jsonv2&zoom=10&lat=${cell.lat}&lon=${cell.lon}`)) as {
        address?: Record<string, string>; name?: string;
      };
      const a = r.address ?? {};
      const name = a.city || a.town || a.village || a.municipality || a.county || r.name || 'Your area';
      this.db.prepare('INSERT OR REPLACE INTO geocode_cache (q, body) VALUES (?, ?)').run(key, JSON.stringify(name));
      return name;
    } catch {
      return 'Your area';
    }
  }
}
