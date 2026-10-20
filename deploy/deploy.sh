#!/usr/bin/env bash
# Build the web app and (re)start Caddy plus the castle API.
set -euo pipefail
cd "$(dirname "$0")/../web"
npm ci --no-audit --no-fund
npm run build
cd ../deploy
docker compose up -d --build
docker compose restart web
