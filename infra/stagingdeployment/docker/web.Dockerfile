# syntax=docker/dockerfile:1
# Static SPA + nginx that also reverse-proxies /api and /health to ccdr-api.
# Build from the repo root:
#   docker build -f infra/stagingdeployment/docker/web.Dockerfile -t ccdr-staging-web .

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
# Repo lock is generated with npm 11; node:22 ships npm 10 and rejects `npm ci`.
RUN npm install --no-audit --no-fund
COPY . .
RUN npx ng build --configuration production --output-path dist/web

FROM nginx:1.27-alpine
COPY infra/stagingdeployment/nginx/spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/web/browser /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=5s --retries=8 CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
