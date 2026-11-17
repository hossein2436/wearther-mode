import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { openDb } from './db';
import { WeatherService } from './weather';
import { createMailer } from './mail';
import { loadVapid, startScheduler } from './push';
import { buildApp } from './app';
import { fixtureFetch } from './fixtures';

const env = process.env;
const dataDir = env.DATA_DIR ?? '/data';
mkdirSync(dataDir, { recursive: true });

// A random secret generated on first boot and kept in the data volume.
const secretFile = join(dataDir, 'secret');
if (!existsSync(secretFile)) writeFileSync(secretFile, randomBytes(32).toString('hex'), { mode: 0o600 });
const secret = env.APP_SECRET || readFileSync(secretFile, 'utf8').trim();

const contact = env.CONTACT_EMAIL || 'admin@example.com';
const site = env.PUBLIC_URL || 'https://example.com';
const db = openDb(join(dataDir, 'wearther.db'));
const fetcher = env.UPSTREAM_FIXTURES === '1' ? fixtureFetch(fetch) : fetch;
if (env.UPSTREAM_FIXTURES === '1') console.warn('UPSTREAM_FIXTURES=1: using fake weather. Development only.');
const weather = new WeatherService(db, { userAgent: `WeartherMode/0.1 ${site} ${contact}`, fetcher });
const vapid = loadVapid(join(dataDir, 'vapid.json'), `mailto:${contact}`);

const app = await buildApp({
  db,
  weather,
  mailer: createMailer(env.SMTP_URL, env.MAIL_FROM || `Wearther Mode <${contact}>`, (m) => console.log(m)),
  dataDir,
  secret,
  cutoutUrl: env.CUTOUT_URL || 'http://cutout:8000/cutout',
  cookieSecure: env.COOKIE_SECURE !== 'false',
  vapidPublicKey: vapid.publicKey,
  billingProvider: env.BILLING_PROVIDER || undefined,
});

startScheduler(db, weather, (m) => app.log.warn(m));
await app.listen({ host: '0.0.0.0', port: Number(env.PORT ?? 3000) });
