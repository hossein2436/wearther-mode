import Fastify, { type FastifyInstance, type FastifyRequest } from 'fastify';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { createHash, randomBytes, randomInt, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import type { DB } from './db';
import { ATTRIBUTION, WeatherService, cellOf, toDays, validTz } from './weather';
import type { Mailer } from './mail';
import { publicUser, type UserRow } from './billing';

export interface AppConfig {
  db: DB;
  weather: WeatherService;
  mailer: Mailer;
  dataDir: string;
  secret: string;
  cutoutUrl: string;
  cookieSecure: boolean;
  vapidPublicKey: string;
  billingProvider?: string;
  fetcher?: typeof fetch;
}

const SESSION = 'wm_session';
const SESSION_DAYS = 180;
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;
const IMAGE_TYPES = ['image/webp', 'image/png', 'image/jpeg'];

export async function buildApp(cfg: AppConfig): Promise<FastifyInstance> {
  const { db } = cfg;
  const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? 'info' }, bodyLimit: 2 * 1024 * 1024, trustProxy: true });
  const fetcher = cfg.fetcher ?? fetch;
  const imagesDir = join(cfg.dataDir, 'images');
  mkdirSync(imagesDir, { recursive: true });

  await app.register(cookie);
  await app.register(rateLimit, { max: 300, timeWindow: '1 minute' });
  for (const t of IMAGE_TYPES) {
    app.addContentTypeParser(t, { parseAs: 'buffer', bodyLimit: 8 * 1024 * 1024 }, (_req, body, done) => done(null, body));
  }

  const hash = (s: string) => createHash('sha256').update(`${cfg.secret}:${s}`).digest('hex');

  // CSRF defence: every state-changing request must carry our custom header (browsers can't add it cross-site).
  app.addHook('onRequest', async (req, reply) => {
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.headers['x-wearther'] !== '1') {
      return reply.code(403).send({ error: 'missing_header' });
    }
  });

  function currentUser(req: FastifyRequest): UserRow | null {
    const token = req.cookies[SESSION];
    if (!token) return null;
    const row = db
      .prepare('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?')
      .get(hash(token), Date.now()) as unknown as UserRow | undefined;
    return row ?? null;
  }

  const requireUser = (req: FastifyRequest) => {
    const u = currentUser(req);
    if (!u) throw Object.assign(new Error('Sign in first'), { statusCode: 401 });
    return u;
  };

  app.get('/api/health', async () => ({ ok: true }));

  // ---------- Auth: email one-time code ----------
  app.post('/api/auth/request', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }, async (req, reply) => {
    const email = String((req.body as { email?: string })?.email ?? '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return reply.code(400).send({ error: 'invalid_email' });
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    db.prepare('INSERT OR REPLACE INTO login_codes (email, code_hash, expires_at, attempts) VALUES (?, ?, ?, 0)')
      .run(email, hash(`${email}:${code}`), Date.now() + 10 * 60_000);
    await cfg.mailer.sendCode(email, code);
    return { ok: true };
  });

  app.post('/api/auth/verify', { config: { rateLimit: { max: 20, timeWindow: '15 minutes' } } }, async (req, reply) => {
    const body = (req.body ?? {}) as { email?: string; code?: string };
    const email = String(body.email ?? '').trim().toLowerCase();
    const code = String(body.code ?? '').trim();
    const row = db.prepare('SELECT * FROM login_codes WHERE email = ?').get(email) as
      | { code_hash: string; expires_at: number; attempts: number } | undefined;
    if (!row || row.expires_at < Date.now() || row.attempts >= 5) return reply.code(400).send({ error: 'code_expired' });
    if (row.code_hash !== hash(`${email}:${code}`)) {
      db.prepare('UPDATE login_codes SET attempts = attempts + 1 WHERE email = ?').run(email);
      return reply.code(400).send({ error: 'wrong_code' });
    }
    db.prepare('DELETE FROM login_codes WHERE email = ?').run(email);
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as unknown as UserRow | undefined;
    if (!user) {
      const now = new Date().toISOString();
      db.prepare('INSERT INTO users (id, email, created_at, trial_start) VALUES (?, ?, ?, ?)').run(randomUUID(), email, now, now);
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as unknown as UserRow;
    }
    const token = randomBytes(32).toString('base64url');
    db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(hash(token), user.id, Date.now() + SESSION_DAYS * 86_400_000);
    reply.setCookie(SESSION, token, { path: '/', httpOnly: true, secure: cfg.cookieSecure, sameSite: 'lax', maxAge: SESSION_DAYS * 86_400 });
    return { user: publicUser(user) };
  });

  app.post('/api/auth/logout', async (req, reply) => {
    const token = req.cookies[SESSION];
    if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hash(token));
    reply.clearCookie(SESSION, { path: '/' });
    return { ok: true };
  });

  app.get('/api/me', async (req, reply) => {
    const u = currentUser(req);
    if (!u) return reply.code(401).send({ error: 'signed_out' });
    return { user: publicUser(u) };
  });

  app.delete('/api/me', async (req, reply) => {
    const u = requireUser(req);
    db.prepare('DELETE FROM users WHERE id = ?').run(u.id); // cascades to sessions, closet, push
    rmSync(join(imagesDir, u.id), { recursive: true, force: true });
    reply.clearCookie(SESSION, { path: '/' });
    return { ok: true };
  });

  // ---------- Weather ----------
  app.get('/api/weather', async (req, reply) => {
    const q = req.query as { lat?: string; lon?: string; city?: string; tz?: string };
    const tz = validTz(q.tz);
    let lat = Number(q.lat), lon = Number(q.lon), place: string | undefined;
    if (q.city && !(Number.isFinite(lat) && Number.isFinite(lon))) {
      const g = await cfg.weather.geocode(q.city).catch(() => null);
      if (!g) return reply.code(404).send({ error: 'place_not_found' });
      ({ lat, lon, name: place } = g);
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return reply.code(400).send({ error: 'need_location' });
    const cell = cellOf(lat, lon);
    try {
      const { slots, fetchedAt, stale } = await cfg.weather.slots(cell.lat, cell.lon);
      place ??= await cfg.weather.placeName(cell.lat, cell.lon);
      return { place, lat: cell.lat, lon: cell.lon, fetchedAt, stale, attribution: ATTRIBUTION, days: toDays(slots, tz) };
    } catch {
      return reply.code(503).send({ error: 'weather_unavailable' });
    }
  });

  app.get('/api/geocode', async (req, reply) => {
    const q = String((req.query as { q?: string }).q ?? '').slice(0, 120);
    if (!q.trim()) return reply.code(400).send({ error: 'need_query' });
    const g = await cfg.weather.geocode(q).catch(() => null);
    return g ?? reply.code(404).send({ error: 'place_not_found' });
  });

  // ---------- Cut-out (background removal on our server; original is never stored) ----------
  app.post('/api/cutout', { config: { rateLimit: { max: 120, timeWindow: '1 hour' } } }, async (req, reply) => {
    const type = String(req.headers['content-type'] ?? '').split(';')[0];
    if (!IMAGE_TYPES.includes(type) || !Buffer.isBuffer(req.body)) return reply.code(415).send({ error: 'send_an_image' });
    try {
      const res = await fetcher(cfg.cutoutUrl, {
        method: 'POST', headers: { 'Content-Type': type }, body: new Uint8Array(req.body as Buffer),
        signal: AbortSignal.timeout(90_000),
      });
      if (!res.ok) throw new Error(String(res.status));
      reply.header('Content-Type', 'image/png');
      return Buffer.from(await res.arrayBuffer());
    } catch {
      return reply.code(503).send({ error: 'cutout_unavailable' });
    }
  });

  // ---------- Closet backup ----------
  app.get('/api/closet', async (req) => {
    const u = requireUser(req);
    const row = db.prepare('SELECT data, updated_at FROM closets WHERE user_id = ?').get(u.id) as { data: string; updated_at: string } | undefined;
    return row ? { data: JSON.parse(row.data), updatedAt: row.updated_at } : { data: null, updatedAt: null };
  });

  app.put('/api/closet', async (req) => {
    const u = requireUser(req);
    const data = (req.body as { data?: unknown })?.data;
    if (!data || typeof data !== 'object') throw Object.assign(new Error('Bad closet'), { statusCode: 400 });
    const updatedAt = new Date().toISOString();
    db.prepare('INSERT OR REPLACE INTO closets (user_id, data, updated_at) VALUES (?, ?, ?)').run(u.id, JSON.stringify(data), updatedAt);
    return { updatedAt };
  });

  const imgPath = (userId: string, id: string) => {
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) throw Object.assign(new Error('Bad id'), { statusCode: 400 });
    return join(imagesDir, userId, id);
  };

  app.put('/api/images/:id', async (req, reply) => {
    const u = requireUser(req);
    const type = String(req.headers['content-type'] ?? '').split(';')[0];
    if (!IMAGE_TYPES.includes(type) || !Buffer.isBuffer(req.body)) return reply.code(415).send({ error: 'send_an_image' });
    const p = imgPath(u.id, (req.params as { id: string }).id);
    mkdirSync(join(imagesDir, u.id), { recursive: true });
    writeFileSync(p, req.body as Buffer);
    writeFileSync(`${p}.type`, type);
    return { ok: true };
  });

  app.get('/api/images/:id', async (req, reply) => {
    const u = requireUser(req);
    const p = imgPath(u.id, (req.params as { id: string }).id);
    if (!existsSync(p)) return reply.code(404).send({ error: 'not_found' });
    reply.header('Content-Type', existsSync(`${p}.type`) ? readFileSync(`${p}.type`, 'utf8') : 'image/webp');
    reply.header('Cache-Control', 'private, max-age=31536000, immutable');
    return readFileSync(p);
  });

  app.delete('/api/images/:id', async (req) => {
    const u = requireUser(req);
    const p = imgPath(u.id, (req.params as { id: string }).id);
    for (const f of [p, `${p}.type`]) if (existsSync(f)) unlinkSync(f);
    return { ok: true };
  });

  // ---------- Push ----------
  app.get('/api/push/key', async () => ({ publicKey: cfg.vapidPublicKey }));

  app.post('/api/push/subscribe', async (req, reply) => {
    const u = requireUser(req);
    const b = (req.body ?? {}) as {
      subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      notifyAt?: string; tz?: string; lat?: number; lon?: number; place?: string;
    };
    const sub = b.subscription;
    if (!sub?.endpoint?.startsWith('https://') || !sub.keys?.p256dh || !sub.keys?.auth) return reply.code(400).send({ error: 'bad_subscription' });
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(b.notifyAt ?? '')) return reply.code(400).send({ error: 'bad_time' });
    const cell = typeof b.lat === 'number' && typeof b.lon === 'number' ? cellOf(b.lat, b.lon) : null;
    db.prepare(`INSERT OR REPLACE INTO push_subs (endpoint, user_id, keys, notify_at, tz, lat, lon, place, last_sent_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`)
      .run(sub.endpoint, u.id, JSON.stringify(sub.keys), b.notifyAt!, validTz(b.tz), cell?.lat ?? null, cell?.lon ?? null, String(b.place ?? '').slice(0, 80));
    return { ok: true };
  });

  app.delete('/api/push/subscribe', async (req) => {
    const u = requireUser(req);
    db.prepare('DELETE FROM push_subs WHERE user_id = ?').run(u.id);
    return { ok: true };
  });

  // ---------- Billing ----------
  app.post('/api/billing/checkout', async (req, reply) => {
    requireUser(req);
    if (!cfg.billingProvider) return reply.code(501).send({ error: 'payments_not_configured' });
    return reply.code(501).send({ error: 'provider_not_implemented', provider: cfg.billingProvider });
  });

  app.setErrorHandler((err: Error & { statusCode?: number }, _req, reply) => {
    const code = err.statusCode ?? 500;
    if (code >= 500) app.log.error(err);
    reply.code(code).send({ error: code === 401 ? 'signed_out' : code === 429 ? 'too_many_requests' : code >= 500 ? 'server_error' : err.message });
  });

  return app;
}
