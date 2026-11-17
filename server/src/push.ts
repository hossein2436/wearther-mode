/** Morning outfit notifications (Web Push) built with the same engine the app uses. */
import * as webpush from 'web-push';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { DB } from './db';
import { toDays, type WeatherService } from './weather';
import { pick, summarize, thermalOffset } from '../../src/engine';
import type { DayWindow, Item, Thermal } from '../../src/types';
import { isEntitled, type UserRow } from './billing';

export interface Vapid { publicKey: string; privateKey: string }

export function loadVapid(file: string, subject: string): Vapid {
  let keys: Vapid;
  if (existsSync(file)) keys = JSON.parse(readFileSync(file, 'utf8'));
  else {
    keys = webpush.generateVAPIDKeys();
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(keys), { mode: 0o600 });
  }
  webpush.setVapidDetails(subject, keys.publicKey, keys.privateKey);
  return keys;
}

export interface ClosetData {
  closet?: Item[];
  win?: DayWindow;
  thermal?: Thermal;
  learnedOffset?: number;
  pairWeights?: Record<string, number>;
  worn?: { date: string; ids: string[] }[];
  units?: 'C' | 'F';
}

function localNow(tz: string, now: Date) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const p = Object.fromEntries(f.formatToParts(now).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hhmm: `${p.hour}:${p.minute}` };
}

export async function buildMessage(
  weather: WeatherService, data: ClosetData, lat: number, lon: number, tz: string, place: string, today: string,
): Promise<{ title: string; body: string } | null> {
  const { slots } = await weather.slots(lat, lon);
  const day = toDays(slots, tz).find((d) => d.date === today);
  if (!day || !data.closet?.length) return null;
  const win = data.win ?? { leave: 8, back: 18 };
  const summary = summarize({ place, fetchedAt: new Date().toISOString(), hours: day.hours }, win, thermalOffset(data.thermal ?? 'neutral', data.learnedOffset ?? 0));
  const recent = (data.worn ?? []).map((w) => [...w.ids].sort().join('+'));
  const { hero } = pick({ closet: data.closet, summary, today, pairWeights: data.pairWeights, recentOutfits: recent });
  const deg = (c: number) => (data.units === 'F' ? `${Math.round((c * 9) / 5 + 32)}°` : `${c}°`);
  const rain = summary.rainFrom !== null ? `, rain from ${String(summary.rainFrom).padStart(2, '0')}:00` : '';
  const head = `${deg(summary.minFeels)} to ${deg(summary.maxFeels)}${rain}.`;
  const body = hero ? `${head} ${hero.items.map((i) => i.name).join(', ')}.` : `${head} Open Wearther Mode to pick an outfit.`;
  return { title: `Today in ${place}`, body };
}

/** Runs every minute; sends each subscriber's outfit once a day at their chosen local time. */
export function startScheduler(db: DB, weather: WeatherService, log: (m: string) => void) {
  const tick = async () => {
    const subs = db.prepare('SELECT * FROM push_subs').all() as {
      endpoint: string; user_id: string; keys: string; notify_at: string; tz: string;
      lat: number | null; lon: number | null; place: string | null; last_sent_date: string | null;
    }[];
    const now = new Date();
    for (const s of subs) {
      try {
        const { date, hhmm } = localNow(s.tz, now);
        if (s.last_sent_date === date || hhmm < s.notify_at || s.lat === null || s.lon === null) continue;
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(s.user_id) as UserRow | undefined;
        if (!user || !isEntitled(user, now)) continue;
        const row = db.prepare('SELECT data FROM closets WHERE user_id = ?').get(s.user_id) as { data: string } | undefined;
        const msg = await buildMessage(weather, row ? JSON.parse(row.data) : {}, s.lat, s.lon, s.tz, s.place ?? 'your area', date);
        db.prepare('UPDATE push_subs SET last_sent_date = ? WHERE endpoint = ?').run(date, s.endpoint);
        if (!msg) continue;
        await webpush.sendNotification({ endpoint: s.endpoint, keys: JSON.parse(s.keys) }, JSON.stringify(msg), { TTL: 3 * 3600 });
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) db.prepare('DELETE FROM push_subs WHERE endpoint = ?').run(s.endpoint);
        else log(`push failed: ${(err as Error).message}`);
      }
    }
  };
  const t = setInterval(() => void tick(), 60_000);
  return () => clearInterval(t);
}
