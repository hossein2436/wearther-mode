# Wearther Mode (PWA, v1 prototype)

Your closet, dressed for today's weather.

## Run
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production PWA in dist/ (service worker + manifest)
npx vitest run     # engine tests
```

## Deploy on your server
Docker + Caddy (automatic HTTPS). Step-by-step commands: [deploy/SERVER-SETUP.md](deploy/SERVER-SETUP.md).
```bash
cp .env.example .env   # set SITE_ADDRESS=your.domain
docker compose up -d --build
```

## Review links (skip onboarding, load a sample closet)
`?demo=today&scenario=mixed|cold|hot` · `&day=5` (trial banner) · `&day=8` (paywall) · `&offline=1` · `&checkin=1`
Other screens: `?demo=welcome|onb-thermal|starter|add&closet=empty|closet|item|settings`

## Structure
- `src/engine/`: pure TypeScript outfit engine (shared with the future native app)
- `src/screens/`, `src/components/`: UI
- `src/state/`: store and IndexedDB persistence
- `src/data/mock.ts`: sample closet and weather scenarios (replaced by the server in Phase 3)
- `docs/`: research, PRD, user stories, UX flows, design system, design review, screenshots
