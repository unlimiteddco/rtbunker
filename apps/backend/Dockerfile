# syntax=docker/dockerfile:1.7
# Build context: raíz del monorepo (`docker compose build` lo hace bien
# porque el `context` está definido como `.` en docker-compose.yml).

# ─── deps ───────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/config/package.json ./packages/config/
# --no-audit/--no-fund acelera; --loglevel/--foreground-scripts hace visible
# el progreso (sin esto npm calla minutos y parece colgado).
RUN npm ci --include-workspace-root --workspace=apps/backend --workspace=packages/config \
    --no-audit --no-fund --loglevel=notice --foreground-scripts

# ─── build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY package.json package-lock.json* ./
COPY packages ./packages
COPY apps/backend ./apps/backend

WORKDIR /app/apps/backend
ENV NODE_ENV=production
# La URL del backend se "quema" en el bundle del admin durante `medusa build`
# (admin.backendUrl). Sin esto, el admin desplegado llama a localhost:9000 y
# da "Failed to fetch" en el login. Se pasa como build-arg.
ARG MEDUSA_BACKEND_URL=http://localhost:9000
ENV MEDUSA_BACKEND_URL=$MEDUSA_BACKEND_URL
RUN npx medusa build

# ─── runtime ────────────────────────────────────────────────────────
# Patrón oficial de Medusa: la app de producción es el output compilado de
# `medusa build` (.medusa/server), que es autocontenido (package.json +
# medusa-config.js YA en JS — sin TypeScript en runtime). Se instalan solo
# las deps de producción en un directorio limpio.
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production

COPY --from=builder /app/apps/backend/.medusa/server ./
RUN npm install --omit=dev --no-audit --no-fund

EXPOSE 9000
# db:migrate carga el medusa-config.js compilado; luego arranca el server.
CMD ["sh", "-c", "npx medusa db:migrate && npm run start"]
