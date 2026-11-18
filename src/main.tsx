import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/fraunces';
import './theme/tokens.css';
import './theme/app.css';
import App from './App';
import { StoreProvider, type State, type Route } from './state/store';
import { sampleCloset, type ScenarioId } from './data/mock';

/**
 * Review links: ?demo=today&scenario=hot&day=8&free=2 (free looks already used) opens a screen with the sample closet,
 * skipping onboarding. Used for screenshots and design review.
 */
function demoState(): Partial<State> | undefined {
  const q = new URLSearchParams(location.search);
  const screen = q.get('demo') as Route | null;
  if (!screen) return undefined;
  const closet = q.get('closet') === 'empty' ? [] : sampleCloset();
  const day = q.get('day');
  return {
    route: screen,
    itemId: q.get('item') ?? closet[8]?.id,
    onboarded: !['welcome', 'onb-day', 'onb-thermal', 'onb-place', 'starter', 'signin'].includes(screen),
    closet: screen === 'starter' ? closet.slice(0, 5) : closet,
    scenario: (q.get('scenario') as ScenarioId) ?? 'mixed',
    place: { mixed: 'London', cold: 'Toronto', hot: 'Lisbon' }[(q.get('scenario') as ScenarioId) ?? 'mixed'],
    email: 'maya@example.com',
    trialStart: new Date().toISOString().slice(0, 10),
    simDay: day ? Number(day) : null,
    freeLooksSeen: Array.from({ length: Number(q.get('free') ?? 0) }, (_, i) => `demo-${i}`),
    offline: q.get('offline') === '1',
    checkInFor: q.get('checkin') === '1' ? '2000-01-01' : null,
    thermal: (q.get('thermal') as State['thermal']) ?? 'neutral',
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider initial={demoState()}>
      <App />
    </StoreProvider>
  </StrictMode>,
);
