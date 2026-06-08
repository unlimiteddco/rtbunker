# rtbunker

Headless ecommerce monorepo:
- **Backend** — Medusa 2.0 (TypeScript, PostgreSQL, Redis)
- **Storefront** — Next.js 15 (App Router, TypeScript, Tailwind 4, shadcn/ui)
- **Storage** — Cloudflare R2 (S3-compatible)
- **Pagos** — Stripe
- **Emails** — Resend (provider custom)
- **Búsqueda** — Meilisearch (subscriber + endpoint store)
- **Multi-idioma** — feature flag `translations` + next-intl con `/[locale]/...`
- **Deploy** — Docker + Dokploy en Hetzner

## Estructura

```
rtbunker/
├── apps/
│   ├── backend/         → Medusa 2.0
│   └── storefront/      → Next.js 15
├── packages/
│   ├── ui/              → componentes shadcn compartidos
│   └── config/          → tsconfig / eslint / tailwind base
├── scripts/migration/   → Woo → Medusa
├── docker-compose.yml
└── README.md
```

## Arranque local

### 1. Variables de entorno

```bash
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/storefront/.env.example apps/storefront/.env
```

Rellena al menos:
- `JWT_SECRET` y `COOKIE_SECRET` en `apps/backend/.env` (`openssl rand -hex 32`)
- `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`, `RESEND_FROM`
- R2: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`, `R2_PUBLIC_URL`

### 2. Levantar dependencias

```bash
docker compose up -d postgres redis meilisearch
```

### 3. Backend

```bash
npm install
cd apps/backend
npm run db:setup                                       # crea db + migra + seed
npx medusa user -e admin@example.com -p change_me     # admin user
npm run dev                                            # http://localhost:9000
```

El seed imprime una **publishable API key**. Cópiala a
`apps/storefront/.env` como `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`.

### 4. Storefront

```bash
cd apps/storefront
npm run dev    # http://localhost:8000
```

### 5. Despliegue full Docker (opcional)

```bash
docker compose --profile apps up -d --build
```

## Comandos útiles

```bash
npm run dev                 # backend + storefront en paralelo
npm run build               # build de ambas apps
npm run typecheck           # tsc en todos los workspaces
npm run docker:up           # solo dependencias (postgres, redis, meilisearch)
npm run docker:down
```

## Despliegue (Dokploy / Hetzner)

1. **Servidor** — VPS Hetzner con Docker y Dokploy.
2. **Compose stack** — apunta Dokploy a este repo, perfil `apps`.
3. **Variables** — configúralas en Dokploy (Environment) por servicio.
4. **Migrations** — el `CMD` del backend ejecuta `medusa db:migrate` antes de
   arrancar, así que cada deploy migra automáticamente.
5. **Stripe webhook** — apunta a `https://<dominio-backend>/hooks/payment/stripe`.

## Skills de Medusa para Claude Code

Las skills de [`medusajs/medusa-agent-skills`](https://github.com/medusajs/medusa-agent-skills)
están copiadas en `.claude/skills/` para asistir desarrollo del backend
(módulos, workflows, API routes, links). El MCP server con la documentación
oficial de Medusa está configurado en `.mcp.json`.

Para activarlo como **plugin gestionado** (con auto-actualizaciones), desde
Claude Code:

```text
/plugin marketplace add medusajs/medusa-agent-skills
/plugin install medusa-dev@medusa
/plugin install ecommerce-storefront@medusa
```

## Roadmap pendiente (ya tracked)

- [ ] Templates de email con react-email (hoy son HTML inline básico).
- [ ] Conectar un CMS real (Sanity/Strapi) en lugar del módulo `lib/cms.ts`.
- [ ] Tests con Vitest en backend y Storefront.
