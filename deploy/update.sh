#!/usr/bin/env bash
# Pull the latest code and rebuild/restart only the "wearther" stack.
# Touches nothing outside this project: no global prune, no daemon restart.
set -euo pipefail
cd "$(dirname "$0")/.."
git pull --ff-only
docker compose up -d --build
docker compose ps
