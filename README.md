# Wearther Mode (PWA v1)

Your closet, dressed for today's weather.

## What's inside
| Folder | Service |
|---|---|
| `src/` | The PWA (Vite + React + TypeScript), including the pure outfit engine in `src/engine/` |
| `server/` | API (Fastify + built-in SQLite): email-code sign-in, MET Norway weather, closet and photo backup, trial, web push |
| `cutout/` | Background removal (Python, rembg with the Apache-2.0 `u2net` model) |
| `deploy/` | Caddyfile, server setup guide, update script |

## Run locally
```bash
npm install && (cd server && npm install)
# terminal 1: API with fake weather (no internet needed)
cd server && npm run build && DATA_DIR=./.data COOKIE_SECURE=false UPSTREAM_FIXTURES=1 node dist/index.js
# terminal 2: the app, proxying /api to the API
npm run dev        # http://localhost:5173  (sign-in codes appear in terminal 1)
# optional terminal 3: background removal
cd cutout && pip install -r requirements.txt && uvicorn app:app --port 8000
```
Tests: `npx vitest run` (engine) and `cd server && npx vitest run` (API).

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
