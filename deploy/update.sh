#!/usr/bin/env bash
# Pull the latest code and rebuild/restart the app with zero manual steps.
set -euo pipefail
cd "$(dirname "$0")/.."
git pull --ff-only
docker compose up -d --build
docker image prune -f >/dev/null
docker compose ps
