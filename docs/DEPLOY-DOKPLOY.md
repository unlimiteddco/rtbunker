# Desplegar RT Bunker en Dokploy (staging)

Guía paso a paso para montar la web en un servidor con **Dokploy** y que Nikita
la pruebe en un dominio de pruebas (con `noindex`, sin que la encuentre Google).

El monorepo ya trae **Dockerfiles** para backend y storefront (build context = raíz
del repo) y el backend **auto-ejecuta las migraciones al arrancar**, así que el
montaje es limpio.

## Arquitectura en Dokploy

Dentro de **un único Proyecto** de Dokploy se crean 5 servicios:

| Servicio | Tipo en Dokploy | Puerto | Dominio público |
|----------|-----------------|--------|-----------------|
| PostgreSQL | Database → PostgreSQL | 5432 | no (interno) |
| Redis | Database → Redis | 6379 | no (interno) |
| Meilisearch | Application (imagen Docker) | 7700 | no (interno) |
| Backend (Medusa + Admin) | Application (Dockerfile) | 9000 | `api.TUDOMINIO` |
| Storefront (Next.js) | Application (Dockerfile) | 3000 | `TUDOMINIO` |

Todos los servicios de un mismo proyecto comparten la red interna de Dokploy y se
referencian entre sí por el **nombre interno del servicio** (lo muestra Dokploy en
cada servicio, en "Internal Host" / la cadena de conexión).

---

## 0. Requisitos previos

1. Un VPS con **Dokploy ya instalado** (panel accesible).
2. Un dominio (o subdominio) para pruebas, p. ej. `pruebas.rtbunker.com`. Crea **2
   registros DNS tipo A** apuntando a la IP del servidor:
   - `pruebas.rtbunker.com`      → IP del servidor   (storefront)
   - `api.pruebas.rtbunker.com`  → IP del servidor   (backend + admin)
3. El repo en GitHub: `unlimiteddco/rtbunker` (rama `main`).

> Sustituye `pruebas.rtbunker.com` por tu dominio real en todos los pasos.

---

## 1. Crear el Proyecto

En Dokploy: **Create Project** → nombre `rtbunker-staging`.

## 2. PostgreSQL

**Create Service → Database → PostgreSQL.**
- Name: `rtbunker-postgres`
- Database: `medusa`
- User: `medusa`
- Password: genera una larga (guárdala)
- Versión: 16
- **Deploy**.

Cuando arranque, copia la **cadena de conexión interna** (host interno + puerto
5432). La usarás como `DATABASE_URL` del backend:
```
postgres://medusa:LA_PASSWORD@<host-interno-postgres>:5432/medusa
```

## 3. Redis

**Create Service → Database → Redis.**
- Name: `rtbunker-redis`
- Password: opcional (si pones, recuérdala)
- **Deploy**.

`REDIS_URL` interno:
```
redis://<host-interno-redis>:6379
```
(si pusiste password: `redis://default:PASSWORD@<host-interno-redis>:6379`)

## 4. Meilisearch (buscador)

**Create Service → Application.**
- Name: `rtbunker-meili`
- Source / Provider: **Docker** → imagen `getmeili/meilisearch:v1.11`
- Environment:
  ```
  MEILI_MASTER_KEY=<genera-una-clave-larga>
  MEILI_ENV=production
  MEILI_NO_ANALYTICS=true
  ```
- **Volumes** (persistencia): monta un volumen en `/meili_data`.
- **NO** le pongas dominio público (uso interno).
- **Deploy**.

Host interno para el backend/storefront: `http://<host-interno-meili>:7700`.

## 5. Backend (Medusa + Admin)

**Create Service → Application.**
- Name: `rtbunker-backend`
- Source: **GitHub** → repo `unlimiteddco/rtbunker`, rama `main`.
- **Build Type: Dockerfile**
  - Docker File Path: `apps/backend/Dockerfile`
  - Build Context Path / Build Path: `/`  ← **importante** (el Dockerfile copia desde la raíz del monorepo)
- **Environment** (pestaña Environment). Plantilla completa en
  `apps/backend/.env.staging.example`. Las imprescindibles:
  ```
  NODE_ENV=production
  MEDUSA_WORKER_MODE=shared

  DATABASE_URL=postgres://medusa:PASSWORD@<host-interno-postgres>:5432/medusa
  REDIS_URL=redis://<host-interno-redis>:6379

  JWT_SECRET=<openssl rand -hex 32>
  COOKIE_SECRET=<openssl rand -hex 32>

  STORE_CORS=https://pruebas.rtbunker.com
  ADMIN_CORS=https://api.pruebas.rtbunker.com
  AUTH_CORS=https://pruebas.rtbunker.com,https://api.pruebas.rtbunker.com

  MEDUSA_BACKEND_URL=https://api.pruebas.rtbunker.com
  STOREFRONT_URL=https://pruebas.rtbunker.com

  # Stripe (modo TEST en staging)
  STRIPE_API_KEY=sk_test_...
  STRIPE_WEBHOOK_SECRET=whsec_...                 # webhook de pagos
  STRIPE_SUBSCRIPTIONS_WEBHOOK_SECRET=whsec_...   # webhook del Club

  # Cloudflare R2 (reutiliza las credenciales de dev → las fotos ya están ahí)
  R2_ACCESS_KEY_ID=...
  R2_SECRET_ACCESS_KEY=...
  R2_BUCKET=...
  R2_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
  R2_PUBLIC_URL=https://<tu-dominio-publico-r2>
  R2_REGION=auto
  AWS_REQUEST_CHECKSUM_CALCULATION=WHEN_REQUIRED
  AWS_RESPONSE_CHECKSUM_VALIDATION=WHEN_REQUIRED

  # Meilisearch
  MEILISEARCH_HOST=http://<host-interno-meili>:7700
  MEILISEARCH_API_KEY=<la MEILI_MASTER_KEY del paso 4>
  MEILISEARCH_INDEX=products

  # Emails (Resend) — en staging redirige todo a un buzón de pruebas
  RESEND_API_KEY=re_...
  RESEND_FROM=RT Bunker <pedidos@TU_DOMINIO_VERIFICADO>
  RESEND_REPLY_TO=info@rtbunker.com
  ADMIN_NOTIFICATION_EMAIL=info@rtbunker.com
  RESEND_DEV_REDIRECT_TO=tu-buzon-de-pruebas@gmail.com

  # PayPal: déjalo vacío (checkout solo Stripe hasta tener credenciales)
  PAYPAL_CLIENT_ID=
  ```
- **Domain**: añade `api.pruebas.rtbunker.com` → **Container Port 9000**, HTTPS (Let's Encrypt ON).
- **NO despliegues todavía** si vas a importar el dump (ver paso 7). Si ya lo
  desplegaste, no pasa nada: lo arreglamos en el paso 7.

> El Dockerfile del backend ejecuta `medusa db:migrate` automáticamente en cada
> arranque, así que las migraciones se aplican solas.

## 6. Storefront (Next.js)

**Create Service → Application.**
- Name: `rtbunker-storefront`
- Source: **GitHub** → mismo repo, rama `main`.
- **Build Type: Dockerfile**
  - Docker File Path: `apps/storefront/Dockerfile`
  - Build Path: `/`
- **Environment**. Plantilla en `apps/storefront/.env.staging.example`. Clave:
  ```
  NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.pruebas.rtbunker.com
  MEDUSA_BACKEND_URL=https://api.pruebas.rtbunker.com
  NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...   # ver nota abajo
  NEXT_PUBLIC_BASE_URL=https://pruebas.rtbunker.com
  NEXT_PUBLIC_DEFAULT_REGION=es

  NEXT_PUBLIC_SITE_NOINDEX=true               # 🔒 bloquea Google en staging

  NEXT_PUBLIC_STRIPE_KEY=pk_test_...
  NEXT_PUBLIC_WHATSAPP_NUMBER=34624690489
  NEXT_PUBLIC_WHATSAPP_TEXT=Hola RT Bunker, tengo una consulta
  NEXT_PUBLIC_PAYPAL_CLIENT_ID=

  MEILISEARCH_HOST=http://<host-interno-meili>:7700
  MEILISEARCH_SEARCH_KEY=<la MEILI_MASTER_KEY>
  MEILISEARCH_INDEX=products

  REVALIDATE_SECRET=<openssl rand -hex 16>
  ```
  > ⚠️ **Las `NEXT_PUBLIC_*` se "queman" en el build de Next.js**, no en runtime.
  > Tienen que estar puestas **antes** del primer build. Si cambias alguna,
  > **redeploya** el storefront para que se reconstruya.
  >
  > **Publishable key**: si importas el dump (paso 7), la base ya incluye la
  > publishable key de dev → reutiliza la misma del `.env` local
  > (`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`). Si NO importas el dump y haces seed
  > nuevo, copia la que imprime el seed.
- **Domain**: `pruebas.rtbunker.com` → **Container Port 3000**, HTTPS ON.
- Despliega **después** del backend.

## 7. Cargar los datos (catálogo + Club) con el dump

Para que el cliente vea el catálogo real (≈951 productos) y los datos del Club,
importa el dump `dumps/rtbunker-20260606.dump` en el Postgres de Dokploy.

**Orden correcto:** importar el dump en el Postgres **vacío ANTES** del primer
arranque del backend (el dump trae el esquema completo; si el backend ya creó las
tablas, el restore chocará).

1. Sube el dump al servidor (desde tu máquina):
   ```bash
   scp dumps/rtbunker-20260606.dump usuario@IP_SERVIDOR:/tmp/
   ```
2. Copia el dump dentro del contenedor de Postgres y restaura. Localiza el
   contenedor (`docker ps | grep postgres`) y:
   ```bash
   docker cp /tmp/rtbunker-20260606.dump <contenedor-postgres>:/tmp/dump
   docker exec -it <contenedor-postgres> \
     pg_restore --no-owner --no-acl --clean --if-exists \
     -U medusa -d medusa /tmp/dump
   ```
   (`--clean --if-exists` deja la restauración idempotente si la repites.)
3. **Ahora despliega el backend** (paso 5). Al arrancar, `medusa db:migrate`
   añade las migraciones nuevas sobre el dump (p. ej. la columna `images` de
   reseñas). 
4. **Reindexa el buscador** (Meilisearch) desde el contenedor del backend
   (terminal del servicio en Dokploy, o `docker exec`):
   ```bash
   npx medusa exec ./src/scripts/reindex-meilisearch.ts
   ```

> **Alternativa sin dump** (datos de ejemplo, sin el catálogo real): en lugar del
> paso 7, entra al contenedor del backend y ejecuta `npm run seed` una vez. Crea
> regiones, usuario admin y una publishable key (cópiala al storefront). Útil solo
> para una demo vacía.

## 8. Verificar

- Storefront: `https://pruebas.rtbunker.com` (debe cargar con catálogo).
- Admin: `https://api.pruebas.rtbunker.com/app` (login con el admin del dump, o el
  que creaste con seed).
- Comprueba: buscador, ficha de producto, añadir al carrito, checkout con tarjeta
  de test de Stripe (`4242 4242 4242 4242`), planes del Club, botón de WhatsApp.

## 9. Webhooks de Stripe (para que el Club y los pagos cierren bien)

En el dashboard de Stripe (modo test) crea 2 endpoints apuntando al backend y
copia sus secrets a las env del backend (`STRIPE_WEBHOOK_SECRET` y
`STRIPE_SUBSCRIPTIONS_WEBHOOK_SECRET`), luego redeploya el backend:
- Pagos: `https://api.pruebas.rtbunker.com/hooks/payment/stripe`
- Suscripciones del Club: `https://api.pruebas.rtbunker.com/webhooks/stripe-subscriptions`

## 10. Auto-deploy (opcional)

En cada Application de Dokploy activa el **webhook de GitHub** (Deployments →
Webhook). Así cada push a `main` redeploya solo.

---

## Notas / gotchas

- **noindex**: con `NEXT_PUBLIC_SITE_NOINDEX=true` el storefront sirve
  `robots.txt` disallow-all y `<meta noindex>`. Google no lo indexa. Quítalo en
  producción real.
- **NEXT_PUBLIC_* en build**: si el storefront sale con la URL/clave equivocada,
  es que cambiaste una `NEXT_PUBLIC_*` y no reconstruiste. Redeploy.
- **Build context = `/`**: ambos Dockerfiles asumen la raíz del monorepo como
  contexto. No pongas `apps/backend` como build path.
- **Imágenes (R2)**: reusa las credenciales R2 de dev y las fotos se ven sin
  resubir nada (el dump referencia las mismas URLs de R2).
- **Emails**: mantén `RESEND_DEV_REDIRECT_TO` con un buzón de pruebas para no
  enviar correos a clientes reales mientras es staging. Para que no caigan en
  spam hay que verificar el dominio del `RESEND_FROM` en Resend (SPF/DKIM/DMARC).
- **PayPal**: vacío en staging. Cuando haya credenciales, rellena `PAYPAL_*`
  (backend) y `NEXT_PUBLIC_PAYPAL_CLIENT_ID` (storefront), redeploya, y habilita
  el provider `pp_paypal_paypal` en las regiones desde el admin.
