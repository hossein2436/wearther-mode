process.env.LOG_LEVEL = 'silent';
import { beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDb, type DB } from '../src/db';
import { WeatherService, cellOf, feelsLike, parseMet, toDays } from '../src/weather';
import { buildApp } from '../src/app';
import { buildMessage } from '../src/push';
import { sampleCloset } from '../../src/data/mock';

/** A MET Locationforecast `complete` body: 30 hourly steps from 2026-11-18T06:00Z. */
function metBody() {
  const start = Date.parse('2026-11-18T06:00:00Z');
  return {
    properties: {
      timeseries: Array.from({ length: 30 }, (_, i) => ({
        time: new Date(start + i * 3_600_000).toISOString(),
        data: {
          instant: { details: { air_temperature: 6 + Math.min(i, 8), relative_humidity: 80, wind_speed: 4, ultraviolet_index_clear_sky: 1 } },
          next_1_hours: { details: { precipitation_amount: i >= 11 ? 1.2 : 0, probability_of_precipitation: i >= 11 ? 85 : 3 } },
        },
      })),
    },
  };
}

function fakeFetch(calls: string[]): typeof fetch {
  return (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push(url);
    if (url.includes('api.met.no')) {
      expect((init?.headers as Record<string, string>)['User-Agent']).toMatch(/WeartherMode/);
      return new Response(JSON.stringify(metBody()), { headers: { Expires: new Date(Date.now() + 3_600_000).toUTCString(), 'Last-Modified': 'Tue, 17 Nov 2026 10:00:00 GMT' } });
    }
    if (url.includes('nominatim') && url.includes('reverse')) return Response.json({ address: { city: 'London' } });
    if (url.includes('nominatim')) return Response.json([{ lat: '51.5072', lon: '-0.1276', name: 'London', display_name: 'London, England' }]);
    if (url.includes('cutout')) return new Response(new Uint8Array([137, 80, 78, 71]), { headers: { 'Content-Type': 'image/png' } });
    return new Response('not found', { status: 404 });
  }) as typeof fetch;
}

describe('weather maths', () => {
  it('wind chill below 10 °C, heat index above 27 °C, air temperature otherwise', () => {
    expect(Math.round(feelsLike(0, 20, 80))).toBe(-5);
    expect(Math.round(feelsLike(32, 5, 60))).toBeGreaterThan(35);
    expect(feelsLike(18, 20, 50)).toBe(18);
  });
  it('rounds to ~11 km cells with at most 4 decimals', () => {
    expect(cellOf(51.50721, -0.12759).key).toBe('51.5,-0.1');
  });
  it('parses MET and groups by local day in the user time zone', () => {
    const days = toDays(parseMet(metBody()), 'Europe/London');
    expect(days[0].date).toBe('2026-11-18');
    expect(days[0].hours[0]).toMatchObject({ hour: 6, precipProb: 3 });
    expect(days[0].hours.find((h) => h.hour === 17)?.precipProb).toBe(85);
    const tehran = toDays(parseMet(metBody()), 'Asia/Tehran');
    expect(tehran[0].hours[0].hour).toBe(9); // 06:00Z = 09:30 local, hour 9
  });
});

describe('API', () => {
  let db: DB;
  let calls: string[];
  let lastCode = '';
  const H = { 'x-wearther': '1' };

  async function app() {
    const f = fakeFetch(calls);
    return buildApp({
      db, weather: new WeatherService(db, { userAgent: 'WeartherMode/test test@example.com', fetcher: f }),
      mailer: { sendCode: async (_e, c) => { lastCode = c; } },
      dataDir: mkdtempSync(join(tmpdir(), 'wm-')), secret: 'test', cutoutUrl: 'http://cutout/cutout',
      cookieSecure: false, vapidPublicKey: 'BPUBLIC', fetcher: f,
    });
  }

  async function signIn(a: Awaited<ReturnType<typeof app>>, email = 'maya@example.com') {
    await a.inject({ method: 'POST', url: '/api/auth/request', headers: H, payload: { email } });
    const res = await a.inject({ method: 'POST', url: '/api/auth/verify', headers: H, payload: { email, code: lastCode } });
    const cookie = res.cookies.find((c) => c.name === 'wm_session')!;
    return { res, cookie: `wm_session=${cookie.value}` };
  }

  beforeEach(() => {
    db = openDb(':memory:');
    calls = [];
  });

  it('rejects state-changing requests without the CSRF header', async () => {
    const a = await app();
    const res = await a.inject({ method: 'POST', url: '/api/auth/request', payload: { email: 'a@b.co' } });
    expect(res.statusCode).toBe(403);
  });

  it('signs in with an emailed code and starts a 7-day trial', async () => {
    const a = await app();
    const { res, cookie } = await signIn(a);
    expect(res.json().user).toMatchObject({ email: 'maya@example.com', trialDay: 1, entitled: true, subscribed: false });
    const me = await a.inject({ url: '/api/me', headers: { cookie } });
    expect(me.json().user.email).toBe('maya@example.com');
  });

  it('refuses a wrong code and locks after 5 tries', async () => {
    const a = await app();
    await a.inject({ method: 'POST', url: '/api/auth/request', headers: H, payload: { email: 'x@example.com' } });
    for (let i = 0; i < 5; i++) {
      const r = await a.inject({ method: 'POST', url: '/api/auth/verify', headers: H, payload: { email: 'x@example.com', code: '000000' === lastCode ? '111111' : '000000' } });
      expect(r.json().error).toBe('wrong_code');
    }
    const r = await a.inject({ method: 'POST', url: '/api/auth/verify', headers: H, payload: { email: 'x@example.com', code: lastCode } });
    expect(r.json().error).toBe('code_expired');
  });

  it('serves weather for a location and caches it per cell', async () => {
    const a = await app();
    const r1 = await a.inject({ url: '/api/weather?lat=51.5072&lon=-0.1276&tz=Europe/London' });
    expect(r1.statusCode).toBe(200);
    expect(r1.json()).toMatchObject({ place: 'London', lat: 51.5, lon: -0.1 });
    expect(r1.json().attribution).toMatch(/MET Norway/);
    await a.inject({ url: '/api/weather?lat=51.52&lon=-0.11&tz=Europe/London' });
    expect(calls.filter((c) => c.includes('api.met.no'))).toHaveLength(1);
    expect(calls[0]).toContain('lat=51.5&lon=-0.1');
  });

  it('finds a city by name', async () => {
    const a = await app();
    const r = await a.inject({ url: '/api/weather?city=London&tz=Europe/London' });
    expect(r.json().place).toBe('London');
  });

  it('backs up the closet and photos per user, and deletes everything on request', async () => {
    const a = await app();
    const { cookie } = await signIn(a);
    const put = await a.inject({ method: 'PUT', url: '/api/closet', headers: { ...H, cookie }, payload: { data: { closet: [{ id: 'a1' }] } } });
    expect(put.statusCode).toBe(200);
    const img = await a.inject({ method: 'PUT', url: '/api/images/a1', headers: { ...H, cookie, 'content-type': 'image/webp' }, payload: Buffer.from('RIFF') });
    expect(img.statusCode).toBe(200);
    expect((await a.inject({ url: '/api/images/a1', headers: { cookie } })).body).toBe('RIFF');
    expect((await a.inject({ url: '/api/closet', headers: { cookie } })).json().data.closet[0].id).toBe('a1');
    const other = await signIn(a, 'sam@example.com');
    expect((await a.inject({ url: '/api/images/a1', headers: { cookie: other.cookie } })).statusCode).toBe(404);
    await a.inject({ method: 'DELETE', url: '/api/me', headers: { ...H, cookie } });
    expect((await a.inject({ url: '/api/closet', headers: { cookie } })).statusCode).toBe(401);
  });

  it('proxies cut-outs to the cut-out service', async () => {
    const a = await app();
    const r = await a.inject({ method: 'POST', url: '/api/cutout', headers: { ...H, 'content-type': 'image/jpeg' }, payload: Buffer.from([255, 216]) });
    expect(r.statusCode).toBe(200);
    expect(r.headers['content-type']).toBe('image/png');
  });

  it('collects anonymous taste counts only from signed-in users and serves a prior', async () => {
    const a = await app();
    const anon = await a.inject({ method: 'POST', url: '/api/taste', headers: H, payload: { events: [{ f: ['scheme:accent'], y: 1 }] } });
    expect(anon.statusCode).toBe(401);
    const { cookie } = await signIn(a);
    const bad = await a.inject({ method: 'POST', url: '/api/taste', headers: { ...H, cookie }, payload: { events: [{ f: ['Navy shirt id-123'], y: 1 }] } });
    expect(bad.statusCode).toBe(400);
    const events = Array.from({ length: 25 }, (_, i) => ({ f: ['scheme:accent', 'scheme:clash'], y: i < 22 ? 1 : -1 }));
    const ok = await a.inject({ method: 'POST', url: '/api/taste', headers: { ...H, cookie }, payload: { events } });
    expect(ok.json()).toMatchObject({ ok: true, accepted: 25 });
    const prior = (await a.inject({ url: '/api/taste/prior' })).json();
    expect(prior.weights['scheme:accent']).toBeGreaterThan(0);
    const cols = db.prepare('PRAGMA table_info(taste_stats)').all() as { name: string }[];
    expect(cols.map((c) => c.name)).toEqual(['feature', 'pos', 'neg']); // nothing that identifies a person
  });

  it('says payments are not configured yet', async () => {
    const a = await app();
    const { cookie } = await signIn(a);
    const r = await a.inject({ method: 'POST', url: '/api/billing/checkout', headers: { ...H, cookie } });
    expect(r.statusCode).toBe(501);
  });

  it('builds the morning notification from the real engine', async () => {
    const w = new WeatherService(db, { userAgent: 'WeartherMode/test', fetcher: fakeFetch(calls) });
    const msg = await buildMessage(w, { closet: sampleCloset(), win: { leave: 8, back: 19 } }, 51.5, -0.1, 'Europe/London', 'London', '2026-11-18');
    expect(msg?.title).toBe('Today in London');
    expect(msg?.body).toMatch(/rain from 17:00/);
  });
});
