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
RUN npm ci --include-workspace-root --workspace=apps/backend --workspace=packages/config

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
RUN npx medusa build

# ─── runtime ────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app/apps/backend
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production

COPY --from=builder /app/apps/backend/.medusa/server ./.medusa/server
COPY --from=builder /app/apps/backend/package.json ./package.json
COPY --from=builder /app/apps/backend/medusa-config.ts ./medusa-config.ts
COPY --from=builder /app/node_modules /app/node_modules

EXPOSE 9000
CMD ["sh", "-c", "npx medusa db:migrate && node .medusa/server/server.js"]
