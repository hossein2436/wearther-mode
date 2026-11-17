/**
 * Offline stand-ins for MET Norway and Nominatim, for local development without internet:
 *   UPSTREAM_FIXTURES=1 node dist/index.js
 * Never enable this in production.
 */
export function fixtureFetch(realFetch: typeof fetch): typeof fetch {
  return (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    if (url.includes('api.met.no')) {
      const start = new Date();
      start.setUTCMinutes(0, 0, 0);
      start.setUTCHours(start.getUTCHours() - 2);
      const timeseries = Array.from({ length: 48 }, (_, i) => {
        const t = new Date(start.getTime() + i * 3_600_000);
        const h = t.getUTCHours();
        const temp = 7 + 7 * Math.max(0, Math.cos(((h - 13) / 12) * Math.PI) * 0.5 + 0.5);
        const wet = h >= 16 && h <= 20;
        return {
          time: t.toISOString(),
          data: {
            instant: { details: { air_temperature: Math.round(temp * 10) / 10, relative_humidity: 78, wind_speed: wet ? 7 : 3.5, ultraviolet_index_clear_sky: h > 10 && h < 15 ? 2 : 0 } },
            next_1_hours: { details: { precipitation_amount: wet ? 1.1 : 0, probability_of_precipitation: wet ? 80 : 6 } },
          },
        };
      });
      return Response.json({ properties: { timeseries } }, { headers: { Expires: new Date(Date.now() + 30 * 60_000).toUTCString() } });
    }
    if (url.includes('nominatim') && url.includes('/reverse')) return Response.json({ address: { city: 'London' } });
    if (url.includes('nominatim')) {
      const q = decodeURIComponent(new URL(url).searchParams.get('q') ?? 'London');
      return Response.json([{ lat: '51.5072', lon: '-0.1276', name: q.replace(/\b\w/g, (c) => c.toUpperCase()), display_name: q }]);
    }
    return realFetch(input, init);
  }) as typeof fetch;
}
