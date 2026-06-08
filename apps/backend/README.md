# Backend — Medusa 2.0

Headless commerce backend para **rtbunker**.

## Arranque

```bash
# Desde la raíz del monorepo:
docker compose up -d postgres redis meilisearch
cp apps/backend/.env.example apps/backend/.env
# rellena STRIPE_*, RESEND_*, R2_*, MEILISEARCH_*

cd apps/backend
npm install
npm run db:setup        # crea db + migra + seed
npx medusa user -e admin@example.com -p change_me   # crea admin
npm run dev
```

Admin disponible en <http://localhost:9000/app>.
API store en <http://localhost:9000/store>.

## Estructura

```
src/
├── api/
│   └── store/search/      → endpoint público para autocomplete (Meilisearch)
├── modules/
│   └── resend-notification/  → provider de notificación custom (Resend)
├── workflows/emails/
│   ├── steps/send-email.ts
│   ├── send-order-placed-email.ts
│   ├── send-order-shipped-email.ts
│   └── send-customer-created-email.ts
├── subscribers/
│   ├── order-placed.ts        → dispara email order.placed
│   ├── order-shipped.ts       → dispara email shipment.created
│   ├── customer-created.ts    → email de bienvenida
│   └── meilisearch-sync.ts    → indexa productos en Meilisearch
└── scripts/seed.ts
```

## Notas de arquitectura

- **R2** se usa con `@medusajs/file-s3` (R2 expone API S3-compatible).
- **Meilisearch** se sincroniza vía subscriber + SDK, no plugin (los plugins
  `medusa-plugin-meilisearch` son para v1.x).
- **Resend** está implementado como módulo provider local en
  `src/modules/resend-notification`. El template HTML de los emails está en
  `src/workflows/emails/templates.ts` — reemplázalo con react-email cuando
  necesites algo más serio.
- El feature flag `translations` se activa en `medusa-config.ts` (ver `featureFlags`).

## Worker mode

En desarrollo `MEDUSA_WORKER_MODE=shared` (un solo proceso). En producción se
suele separar en dos contenedores: `MEDUSA_WORKER_MODE=server` (HTTP) y
`MEDUSA_WORKER_MODE=worker` (jobs/subscribers).
