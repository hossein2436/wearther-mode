# Build from the repo root:  docker build -f server/Dockerfile .
FROM node:22-slim AS build
ARG NPM_REGISTRY=https://registry.npmjs.org/
WORKDIR /app
COPY server/package.json server/package-lock.json server/
RUN cd server && npm ci --no-audit --no-fund --registry=$NPM_REGISTRY
COPY src/ src/
COPY server/ server/
RUN cd server && npx vitest run && npm run build && npm prune --omit=dev

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production DATA_DIR=/data NODE_OPTIONS=--disable-warning=ExperimentalWarning
COPY --from=build /app/server/node_modules node_modules
COPY --from=build /app/server/dist dist
COPY server/package.json .
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/index.js"]
