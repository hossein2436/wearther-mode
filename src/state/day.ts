import { useMemo } from 'react';
import { useStore, todayIso } from './store';
import { scenarioForecast } from '../data/mock';
import { summarize, thermalOffset, RAIN_THRESHOLD } from '../engine';
import type { WindowSummary } from '../types';

export type Mood = 'frost' | 'cool' | 'mild' | 'sun' | 'heat' | 'rain';

/** The day's mood paints the whole app. Rain wins over temperature: it's what you notice first. */
export function moodFor(s: WindowSummary | null): Mood {
  if (!s) return 'cool';
  if (s.hours.filter((h) => h.precipProb >= RAIN_THRESHOLD).length >= 2) return 'rain';
  const mean = (s.minFeels + s.maxFeels) / 2;
  return mean < 4 ? 'frost' : mean < 14 ? 'cool' : mean < 20 ? 'mild' : mean < 27 ? 'sun' : 'heat';
}

/** The day we're dressing for: today, or tomorrow once you're back home. Shared by Today and the app shell. */
export function useDay() {
  const { s } = useStore();
  const now = new Date();
  const tomorrow = now.getHours() >= s.win.back;
  const dayIso = tomorrow ? todayIso(new Date(now.getTime() + 86_400_000)) : s.isoToday;
  const demoFetched = useMemo(() => {
    const t = new Date();
    if (s.offline) t.setHours(7, 12, 0, 0);
    return t.toISOString();
  }, [s.offline]);
  const forecast = useMemo(() => {
    if (s.demo) return { ...scenarioForecast(s.scenario, demoFetched), place: s.place || 'London' };
    const day = s.forecast?.days.find((x) => x.date === dayIso);
    return s.forecast && day ? { place: s.forecast.place, fetchedAt: s.forecast.fetchedAt, hours: day.hours } : null;
  }, [s.demo, s.scenario, demoFetched, s.place, s.forecast, dayIso]);
  const summary = useMemo(
    () => (forecast ? summarize(forecast, s.win, thermalOffset(s.thermal, s.learnedOffset)) : null),
    [forecast, s.win, s.thermal, s.learnedOffset],
  );
  return { tomorrow, dayIso, forecast, summary, stale: s.offline || !!s.forecast?.stale, mood: moodFor(summary), now };
}
