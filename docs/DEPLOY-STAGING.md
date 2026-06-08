# RT Bunker — Checklist de despliegue a STAGING (preview para el cliente)

> Objetivo: subir backend + storefront + base de datos a tu servidor para que el cliente lo pruebe, **sin que lo indexen los buscadores** y **con Stripe en modo TEST** (sin cobros reales). Reemplaza `STAGING_DOMAIN` por tu dominio (p.ej. `staging.rtbunker.com`; el backend/admin en `api.staging.rtbunker.com`).

---

## 0. Pre-requisitos en el servidor
- **Node 20+**, **PostgreSQL 16**, **Redis 7**, **Meilisearch 1.11** (Docker o nativos).
- **HTTPS/SSL** en los dominios (Let's Encrypt o Cloudflare). Stripe Elements y las cookies `secure` lo exigen.
- Reverse proxy (Nginx/Caddy/Traefik) enrutando:
  - `STAGING_DOMAIN` → storefront (Next, puerto 8000).
  - `api.STAGING_DOMAIN` → backend Medusa (puerto 9000). El admin se sirve en `api.STAGING_DOMAIN/app`.

## 1. Variables de entorno
- Backend: copia `apps/backend/.env.staging.example` → `.env` y rellena (DB, secrets, Stripe **test**, R2, Meili, Resend, CORS, URLs).
- Storefront: copia `apps/storefront/.env.staging.example` → `.env`.
  - ✅ **`NEXT_PUBLIC_SITE_NOINDEX=true`** → activa `noindex` + `robots.txt` disallow-all.

## 2. Base de datos
**Opción A (recomendada): subir tu DB local** para que el cliente vea datos reales.
```bash
# En tu máquina (la DB está en Docker `rtbunker-postgres`):
docker exec rtbunker-postgres pg_dump -U postgres -d medusa -Fc > rtbunker.dump
# Súbelo al servidor (scp/rsync) y restaura:
pg_restore -U USER -d medusa --clean --if-exists rtbunker.dump
```
**Opción B: DB nueva** → migrar + seedear desde cero (`npm run seed`, importar productos de Woo, etc.).

> ⚠️ Si subes tu DB local, las **URLs de imágenes** apuntarán a donde estén ahora. Si están en `localhost:9000/static`, **no se verán** en el servidor → necesitas R2 (paso 4) y actualizar las URLs.

## 3. Build de ambas apps
```bash
# Backend
cd apps/backend && npm ci && npm run build
# Storefront
cd apps/storefront && npm ci && npm run build
```

## 4. Imágenes (Cloudflare R2) — IMPRESCINDIBLE
Sin esto los productos salen sin foto.
- Configura R2 en el `.env` del backend (paso 1).
- Sube los media: `npm run upload:media` (script de migración) **o** sincroniza el bucket.
- Si las URLs en la DB apuntan a local, córrelas al dominio público de R2 (script `update-product-images.ts` si existe, o un UPDATE en la DB).

## 5. Migraciones + setup del backend (en el servidor)
```bash
cd apps/backend
npx medusa db:migrate                                   # aplica migraciones (incl. memberships, custom_order priority)
npx medusa exec ./src/scripts/setup-memberships.ts      # grupos + promos del Club (descuento + envío gratis)
npx medusa exec ./src/scripts/reindex-meilisearch.ts    # llena el buscador
# Si la DB es nueva, asegúrate de tener: región EUR, sales channel "Tienda Online",
# opción de envío "Envio urgente", producto base `pegatina-personalizada`:
#   npx medusa exec ./src/scripts/seed-personalizadas-product.ts
# Crear usuario admin (si DB nueva):
#   npx medusa user -e info@bellostas.studio -p CONTRASEÑA
```

## 6. Stripe (modo TEST) — webhooks
En el dashboard de Stripe (test), crea **dos** endpoints apuntando al backend:
1. **Pagos**: `https://api.STAGING_DOMAIN/hooks/payment/pp_stripe_stripe`
   - Eventos: `payment_intent.succeeded`, `payment_intent.payment_failed` (y los que use el módulo).
   - Copia el `whsec_…` → `STRIPE_WEBHOOK_SECRET`.
2. **Suscripciones del Club**: `https://api.STAGING_DOMAIN/webhooks/stripe-subscriptions`
   - Eventos: `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.paid`.
   - Copia el `whsec_…` → `STRIPE_SUBSCRIPTIONS_WEBHOOK_SECRET`.
- Tarjeta de prueba para el cliente: `4242 4242 4242 4242`, fecha futura, CVC cualquiera.

## 7. Arrancar los servicios
```bash
# Backend (modo prod)
cd apps/backend && npm run start          # medusa start (puerto 9000)
# Storefront
cd apps/storefront && npm run start        # next start (puerto 8000)
```
(Usa PM2 / systemd / Docker / Dokploy según tu setup para mantenerlos vivos.)

## 8. Verificar el "no index"
- `https://STAGING_DOMAIN/robots.txt` → debe devolver `User-agent: *  Disallow: /`.
- Ver el `<head>` de cualquier página → `<meta name="robots" content="noindex, nofollow">`.

## 9. Smoke test (probar antes de pasárselo al cliente)
- [ ] Home carga con **fotos** de producto (si no → R2/paso 4).
- [ ] Buscador del header devuelve resultados (si no → reindex/paso 5).
- [ ] `/tienda`, `/categoria/marcas-de-coches`, una PDP.
- [ ] Registro + login de un cliente nuevo.
- [ ] Añadir producto al carrito → checkout → pagar con `4242…` → pedido OK + email (al buzón de `RESEND_DEV_REDIRECT_TO`).
- [ ] `/planes` → "Hazte socio" → Stripe Checkout test → vuelve → `/cuenta/suscripcion` muestra el plan (el webhook de suscripciones debe estar configurado).
- [ ] Como socio: descuento −10% en checkout · canje de créditos en `/personalizadas` (tamaño ≤10 cm) → checkout gratis.
- [ ] Admin `https://api.STAGING_DOMAIN/app` → "RT Bunker Club" (lista de socios) y "Personalizadas" (badge ⚡ Prioritario en pedidos de socio).

---

## Notas
- **Pasar a producción real** (cuando el cliente apruebe): quitar `NEXT_PUBLIC_SITE_NOINDEX`, cambiar Stripe a **live** (claves + webhooks live), verificar el dominio en **Resend** y quitar `RESEND_DEV_REDIRECT_TO`, dominio definitivo + DNS, y backup automático de Postgres.
- **Rellenar los datos legales** (`lib/cms.ts`): razón social + NIF/CIF en aviso-legal y privacidad.
