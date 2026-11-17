# ---- Build the PWA ----
ARG BASE_REGISTRY=docker.io/library
FROM ${BASE_REGISTRY}/node:22-slim AS build
WORKDIR /app
# Override with a closer npm mirror if registry.npmjs.org is slow from your server
ARG NPM_REGISTRY=https://registry.npmjs.org/
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --registry=$NPM_REGISTRY
COPY . .
RUN npx vitest run && npm run build

# ---- Serve it with Caddy (automatic HTTPS) ----
FROM ${BASE_REGISTRY}/caddy:2-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
