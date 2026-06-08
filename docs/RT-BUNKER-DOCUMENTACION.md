# RT Bunker — Documentación completa del proyecto

> Documento de referencia exhaustivo del ecommerce **RT Bunker** (pegatinas/vinilos premium para coches, negocio español de Nikita). Cubre la arquitectura, todas las funcionalidades construidas y, **en profundidad, el sistema de socios "RT Bunker Club"** (suscripciones, créditos, descuentos, envío gratis, impresión prioritaria por tier y panel admin).
>
> _Última edición de este documento: junio 2026._
> _Nota: `PROJECT_CONTEXT.md` (raíz) es el documento "vivo" corto que se actualiza en cada tanda; este `docs/` es la referencia larga y completa._

---

## Índice

1. [Stack y arquitectura](#1-stack-y-arquitectura)
2. [Estructura del monorepo](#2-estructura-del-monorepo)
3. [Convenciones y tokens de diseño](#3-convenciones-y-tokens-de-diseño)
4. [RT Bunker Club — sistema de socios (EN PROFUNDIDAD)](#4-rt-bunker-club--sistema-de-socios)
   - 4.1 [Planes y precios](#41-planes-y-precios)
   - 4.2 [Arquitectura general](#42-arquitectura-general-del-club)
   - 4.3 [Módulo backend `memberships`](#43-módulo-backend-memberships)
   - 4.4 [Alta de suscripción (Stripe Checkout)](#44-alta-de-suscripción-stripe-checkout)
   - 4.5 [Webhook de Stripe (ciclo de vida)](#45-webhook-de-stripe-ciclo-de-vida)
   - 4.6 [Descuento de socio (customer groups + promociones)](#46-descuento-de-socio)
   - 4.7 [Créditos para personalizadas](#47-créditos-para-personalizadas)
   - 4.8 [Envío urgente gratis](#48-envío-urgente-gratis)
   - 4.9 [Checkout de pedido gratis (0 €)](#49-checkout-de-pedido-gratis)
   - 4.10 [Impresión prioritaria por tier](#410-impresión-prioritaria-por-tier)
   - 4.11 [Panel admin de suscripciones](#411-panel-admin-de-suscripciones)
   - 4.12 [Storefront del Club (páginas/componentes)](#412-storefront-del-club)
   - 4.13 [Scripts de operación del Club](#413-scripts-de-operación-del-club)
   - 4.14 [Variables de entorno del Club](#414-variables-de-entorno-del-club)
   - 4.15 [Cómo probar el Club end-to-end](#415-cómo-probar-el-club-end-to-end)
   - 4.16 [Pendiente del Club](#416-pendiente-del-club)
5. [Otras funcionalidades construidas](#5-otras-funcionalidades-construidas)
6. [Módulos backend (resumen)](#6-módulos-backend-resumen)
7. [Mapa de rutas del storefront](#7-mapa-de-rutas-del-storefront)
8. [Operación y comandos útiles](#8-operación-y-comandos-útiles)
9. [Gotchas / cosas a recordar](#9-gotchas--cosas-a-recordar)

---

## 1. Stack y arquitectura

- **Monorepo** con npm workspaces: `apps/backend` (Medusa 2.0) + `apps/storefront` (Next.js 15).
- **Backend**: Medusa 2.0 (framework de comercio). PostgreSQL + Redis (cache, event bus, workflow engine) + Meilisearch (búsqueda). Pagos con **Stripe** (`@medusajs/payment-stripe`). Ficheros en **Cloudflare R2** (S3-compatible, `@medusajs/file-s3`) en prod / local en dev. Notificaciones por email con **Resend** (módulo de notificación custom). Admin dashboard de Medusa extendido con widgets y UI routes.
- **Storefront**: Next.js 15 (App Router), React 19, Tailwind, `next-intl` (rutas `/[locale]/`, **solo ES activo** ahora mismo aunque la infra i18n sigue), Medusa JS SDK (`sdk.store.*`, `sdk.client.fetch`), Stripe Elements para el checkout, **framer-motion** para animaciones de scroll.
- **Infra dev**: Docker para postgres/redis/meilisearch. Backend en `:9000` (`medusa develop`), storefront en `:8000` (`npm run dev`).

### Credenciales de dev
- **Admin Medusa**: `info@bellostas.studio` / `bellostas` → `http://localhost:9000/app`
- **Cuenta cliente de prueba** (socia): `unlimiteddco@gmail.com` (tiene 2 registros duplicados por checkout invitado + registro; los scripts del Club aplican a ambos).
- **Stripe**: modo **test** (`sk_test_…`). Tarjeta de prueba `4242 4242 4242 4242`.
- **Publishable key storefront**: `pk_41bef6f8314c75866eef77c942a7d247e1fefdb52e24b8ba80136b77a23d04f3`

---

## 2. Estructura del monorepo

```
rtbunker/
├── apps/
│   ├── backend/                      # Medusa 2.0
│   │   ├── medusa-config.ts          # módulos, Stripe, R2, Resend, feature flags
│   │   └── src/
│   │       ├── modules/              # custom-orders, newsletter, reviews, memberships, resend-notification
│   │       ├── workflows/            # workflows + steps
│   │       ├── subscribers/          # reaccionan a eventos (order.placed, etc.)
│   │       ├── api/
│   │       │   ├── admin/            # rutas admin (custom-orders, reviews, memberships)
│   │       │   ├── store/            # rutas store (custom-orders, customers/me/*, etc.)
│   │       │   ├── webhooks/         # stripe-subscriptions
│   │       │   └── middlewares.ts    # agregador de middlewares
│   │       ├── admin/                # extensiones del dashboard (routes/, widgets/, lib/, components/)
│   │       ├── lib/                  # stripe.ts (cliente Stripe del Club)
│   │       └── scripts/              # seeds + helpers (medusa exec)
│   └── storefront/                   # Next.js 15
│       └── src/
│           ├── app/[locale]/         # páginas (App Router)
│           ├── components/           # por dominio (cart, checkout, personalizadas, memberships, layout, account, …)
│           ├── lib/                  # cart, auth, products, memberships, membership, pricing, cms, …
│           └── i18n/                 # config + routing next-intl
├── PROJECT_CONTEXT.md                # doc vivo corto
└── docs/RT-BUNKER-DOCUMENTACION.md   # ESTE documento
```

---

## 3. Convenciones y tokens de diseño

- **Colores de marca** (Tailwind, sin prefijo `text-`/`bg-`):
  - `rt-yellow` = `#0abab5` (Tiffany teal, color de acento principal), `rt-yellow-deep` = `#089290`.
  - `rt-black` / `-2` / `-3` = `#0f0f0f` / `#1a1a1a` / `#262626` (carbón).
  - `rt-white`, `rt-white-2`, `rt-white-3` (fondos claros), `rt-ink-300/500/700/900` (grises de texto).
  - `rt-success` (verde, ahorros/descuentos), `rt-danger` = `#c8321f`.
- **Fuentes**: `--font-display` (Anton, condensada en mayúsculas para hero/títulos), `--font-heading` (Montserrat, nav/botones uppercase), `--font-inter` (cuerpo).
- **Helpers**: `container-page` (max-width + padding), `rt-eyebrow`/`text-eyebrow`, `rt-h2`.
- **TypeScript**: `exactOptionalPropertyTypes: true` → las props opcionales necesitan `| undefined` explícito.
- **Cookies del storefront** (first-party, httpOnly via server actions): `_rtb_cart_id` (carrito), `_rtb_consent` (cookies RGPD), `_rtb_popup` (popup email).
- **Errores pre-existentes** del proyecto (no confundir con nuevos): ~46 errores de tsc del storefront (p.ej. `OptionCard` props `tag`/`popular`, `account-nav` `exact`, `region possibly undefined` en products.ts) y 1 del backend (`medusa-config.ts` fuera de rootDir). Son conocidos y no se tocan.

---

## 4. RT Bunker Club — sistema de socios

Sistema de **suscripciones mensuales** que da a los socios: **créditos** para pegatinas personalizadas, **envío urgente gratis**, **impresión el mismo día (prioridad en la cola)**, **soporte exclusivo** y **descuento en todos los pedidos**. Implementado en 3 fases (todas hechas).

### 4.1 Planes y precios

| Plan | Precio | Valor* | Créditos/mes | Descuento | Otros beneficios |
|------|--------|--------|--------------|-----------|------------------|
| **Bronce** | 10 €/mes | 40 € | 0 | **5%** | Envío urgente gratis · impresión mismo día · soporte exclusivo |
| **Plata** | 45 €/mes | 107 € | **50** | **10%** | + créditos para personalizadas (≤10 cm) |
| **Gold** | 65 €/mes | 133 € | **100** | **10%** | + créditos para personalizadas (≤10 cm) |

\* "Valor" = pitch de marketing (lo que costaría suelto).

**Fuentes de verdad de los planes:**
- Backend: `apps/backend/src/modules/memberships/tiers.ts` → `TIERS` (importes en **céntimos**: bronce 1000, plata 4500, gold 6500; + `credits` y `discountPct`).
- Storefront (UI): `apps/storefront/src/lib/memberships.ts` → `MEMBERSHIP_TIERS` (datos de display: nombre, precio, valor, créditos, %, beneficios, `popular`). **Los IDs `bronce`/`plata`/`gold` deben coincidir entre ambos** y con los customer groups/promociones de Medusa.

### 4.2 Arquitectura general del Club

Decisiones tomadas con el cliente:
- **MVP por fases**.
- **1 crédito = 1 pegatina personalizada** de tamaño **≤10 cm por lado** (pequeña 5 cm, mediana 10 cm, o custom con ambos lados ≤10 cm), cualquier acabado. Tope de unidades = saldo. Mínimo 1 unidad (frente al mínimo 15 del pago normal).
- **Facturación recurrente real con Stripe Subscriptions** (no pago manual).

Piezas (idiomáticas en Medusa):
- **Módulo `memberships`** (datos de la suscripción del socio).
- Alta vía **Stripe Checkout en modo `subscription`** (Stripe gestiona renovación, SCA, método de pago) + **Stripe Billing Portal** para gestionar/cancelar.
- **Webhook de Stripe** que sincroniza el ciclo de vida → estado de la membership + pertenencia a customer group.
- **Descuento de socio** = **customer groups** (Bronce/Plata/Gold) + **promociones automáticas** que se aplican solas en el checkout cuando el cliente pertenece al grupo. Sin matemática custom.
- **Envío gratis** = otra promoción automática (100% sobre el envío) para los grupos del Club.
- **Créditos** = saldo en la membership; canje en el configurador (línea a precio 0); descuento del saldo al confirmarse el pedido.
- **Checkout gratis** (total 0 €) = proveedor de pago `pp_system_default` (Stripe no cobra <0,50 €).
- **Prioridad** = flag en el `custom_order` según membresía; el admin ordena prioritarios primero.

### 4.3 Módulo backend `memberships`

`apps/backend/src/modules/memberships/`
- `index.ts` → `export const MEMBERSHIPS_MODULE = 'memberships'`.
- `service.ts` → `MedusaService({ Membership })` (genera `listMemberships`, `createMemberships`, `updateMemberships`, `deleteMemberships`, etc.).
- `tiers.ts` → `TIERS`, `getBackendTier(id)`, `isTierId(v)`.
- `models/membership.ts` → modelo `membership`:

```ts
const Membership = model.define('membership', {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  tier: model.enum(['bronce', 'plata', 'gold']),
  status: model.enum(['incomplete', 'active', 'past_due', 'canceled']).default('incomplete'),
  stripe_customer_id: model.text().nullable(),
  stripe_subscription_id: model.text().nullable(),
  current_period_end: model.dateTime().nullable(),
  cancel_at_period_end: model.boolean().default(false),
  credits_balance: model.number().default(0),     // saldo de créditos
  credits_renews_at: model.dateTime().nullable(),
})
.indexes([
  { on: ['customer_id'], where: 'deleted_at IS NULL' },
  { on: ['stripe_subscription_id'], unique: true, where: 'stripe_subscription_id IS NOT NULL AND deleted_at IS NULL' },
])
```

- Registrado en `medusa-config.ts` (`{ resolve: './src/modules/memberships' }`).
- Cliente Stripe del Club: `apps/backend/src/lib/stripe.ts` → `getStripe()` (instancia `new Stripe(process.env.STRIPE_API_KEY)`, independiente del módulo de pagos de pedidos).

`customer.metadata` se usa como **espejo** para lecturas rápidas desde el storefront: `membership_tier` y `membership_status` (los actualiza el webhook).

### 4.4 Alta de suscripción (Stripe Checkout)

**`POST /store/customers/me/membership/checkout-session`** (autenticada)
`apps/backend/src/api/store/customers/me/membership/checkout-session/route.ts`
- Body: `{ tier_id }`.
- Reutiliza el Stripe customer si ya hay una membership previa; si no, crea uno (`metadata.customer_id`).
- Bloquea si ya hay suscripción `active`/`past_due`.
- Crea un **Checkout Session** `mode: 'subscription'` con **`price_data` inline** (mensual, EUR, `unit_amount` del tier) → **no hace falta crear productos/precios en Stripe a mano**.
- `success_url` → `/es/cuenta/suscripcion?status=success`, `cancel_url` → `/es/planes?status=cancel`.
- `metadata`/`subscription_data.metadata` llevan `{ customer_id, tier }` (para que el webhook sepa de quién es).
- Devuelve `{ url }` → el storefront redirige a Stripe. **Probado: devuelve `https://checkout.stripe.com/...`.**

**`GET /store/customers/me/membership`** → estado actual del socio (tier, status, renovación, créditos). No expone IDs de Stripe.

**`POST /store/customers/me/membership/portal-session`** → crea un **Stripe Billing Portal** session para gestionar/cancelar, devuelve `{ url }`.

Las 3 rutas tienen guard `if (!req.auth_context?.actor_id) return 401`.

### 4.5 Webhook de Stripe (ciclo de vida)

**`POST /webhooks/stripe-subscriptions`** — `apps/backend/src/api/webhooks/stripe-subscriptions/route.ts`
- Verifica la firma con el **raw body** (`bodyParser: { preserveRawBody: true }` configurado en `src/api/middlewares.ts` para esa ruta) usando `STRIPE_SUBSCRIPTIONS_WEBHOOK_SECRET ?? STRIPE_WEBHOOK_SECRET`.
- Eventos manejados:
  - `checkout.session.completed` (mode subscription) → recupera la subscription y hace upsert.
  - `customer.subscription.created` / `.updated` / `.deleted` → upsert (status, periodo, cancel_at_period_end).
  - `invoice.paid` → upsert + **recarga de créditos** a `tier.credits` (renovación mensual).
- `upsertFromSubscription()`:
  - Lee `customer_id` y `tier` de `subscription.metadata`.
  - Mapea el status de Stripe → `{ incomplete, active, past_due, canceled }`.
  - Crea/actualiza la `membership` (por `stripe_subscription_id`).
  - En el primer activo (o `invoice.paid`) pone `credits_balance = tier.credits`.
  - `syncCustomerMetadata()` → espejo en `customer.metadata`.
  - `syncCustomerGroup()` → mete al cliente en el customer group de su tier vigente y lo saca de los demás (vía `addCustomerToGroup` / `removeCustomerFromGroup`).
- Devuelve 200 ante errores de datos para que Stripe no reintente en bucle.

> ⚠️ **En dev** hay que reenviar el webhook: `stripe listen --forward-to localhost:9000/webhooks/stripe-subscriptions` y poner el `whsec_…` en `STRIPE_SUBSCRIPTIONS_WEBHOOK_SECRET`. Sin esto, el pago se hace en Stripe pero la membership no se activa.

### 4.6 Descuento de socio

Implementado con **customer groups + promociones automáticas** (sin código custom de descuento):
- **3 customer groups**: `RT Bunker Club · Bronce/Plata/Gold`, cada uno con `metadata.membership_tier`.
- **3 promociones automáticas**: `RTBCLUB_BRONCE` (5%), `RTBCLUB_PLATA` (10%), `RTBCLUB_GOLD` (10%):
  - `is_automatic: true`, `type: 'standard'`, `application_method: { type: 'percentage', target_type: 'order', allocation: 'across', value: % }`.
  - Regla: `{ attribute: 'customer.groups.id', operator: 'in', values: [groupId] }`.
- El webhook mete/saca al cliente del grupo según el estado de la suscripción → la promoción se aplica **sola** en el checkout cuando el carrito tiene el `customer_id` del socio.
- **Validado**: carrito de socio Plata de 6 € → −0,60 € (10%). En carrito mixto, el descuento se calcula solo sobre lo que se paga (no sobre los créditos).

Creación (idempotente): `apps/backend/src/scripts/setup-memberships.ts`.

### 4.7 Créditos para personalizadas

**Regla de elegibilidad**: tamaño **≤10 cm por lado** (preset pequeña/mediana, o custom con ambos lados ≤10). Helper compartido:
- Storefront: `apps/storefront/src/components/personalizadas/pricing.ts` → `isCreditEligibleSize({ sizeMode, sizeId, width_cm, height_cm })` + `CREDIT_MAX_SIDE_CM = 10`.
- Backend (seguridad, no se fía del cliente): misma lógica en `apps/backend/src/api/store/custom-orders/cart/route.ts` (`isCreditEligible`).

**Configurador** (`apps/storefront/src/components/personalizadas/personalizadas-compact.tsx`):
- Recibe `availableCredits` (desde la página `/personalizadas`, que llama a `getMembership()`).
- Si eres socio con saldo y el tamaño es elegible → toggle **"Pagar con créditos · N disponibles"**.
- En modo créditos: mínimo 1 unidad, **tope = saldo**, el resumen muestra **"X créditos"** y el total grande pasa a "X créditos", el CTA a **"Canjear X créditos"**.
- Si el tamaño no es elegible pero tienes créditos → hint "Aplican a tamaños ≤10 cm".

**Endpoint** `POST /store/custom-orders/cart` (con `credits_used` en el body):
- Si `credits_used > 0`: valida que `credits_used === units` (1 crédito = 1 unidad), que el tamaño es elegible, que el cliente está autenticado y que la membership tiene saldo suficiente. Si todo OK → **`unit_price = 0`** y guarda en metadata del line item `{ paid_with_credits: true, credits_used }`. Si no → rechaza con error claro.
- **Probado**: rechaza correctamente tamaño grande ("no es canjeable con créditos") y saldo insuficiente ("no tienes créditos suficientes").

**Producto esqueleto**: `pegatina-personalizada` (handle). Su **precio base se puso a 0** para que las líneas con créditos sean realmente gratis (Medusa ignora un override `unit_price: 0`, así que cae al precio base = 0). Los pedidos normales (no créditos) siempre mandan su precio real, que sí hace override.

**Descuento del saldo**: subscriber `apps/backend/src/subscribers/order-placed-redeem-credits.ts`:
- En `order.placed`, suma los `credits_used` de los line items con `paid_with_credits` y resta del `credits_balance` de la membership del cliente (acotado a ≥0).
- La deducción se hace **tras el pago** (no al añadir al carrito) para no gastar créditos en carritos abandonados.
- **Confirmado en uso real**: el saldo del socio de prueba bajó al canjear.

**Display en carrito**: `apps/storefront/src/components/personalizadas/custom-line-item.tsx` muestra un badge **"X créditos"** en la línea.

### 4.8 Envío urgente gratis

Promoción automática `RTBCLUB_FREESHIP`:
- `application_method: { type: 'percentage', target_type: 'shipping_methods', allocation: 'across', value: 100 }`.
- Regla: `customer.groups.id in [los 3 grupos del Club]`.
- Creada por `setup-memberships.ts` (idempotente). Aplica a cualquier socio activo automáticamente.

### 4.9 Checkout de pedido gratis

Un pedido **100% con créditos + envío gratis = 0 €**, y **Stripe no cobra <0,50 €**. Solución:
- Componente `apps/storefront/src/components/checkout/free-order-step.tsx` (`FreeOrderStep`): muestra "Tu pedido es gratis 🎉" y un botón "Confirmar pedido" que usa el proveedor **`pp_system_default`** (`sdk.store.payment.initiatePaymentSession(cart, { provider_id: 'pp_system_default' })`) + `sdk.store.cart.complete()` (sin Stripe).
- `apps/storefront/src/components/checkout/checkout-flow.tsx`: cuando `cart.total <= 0` renderiza `FreeOrderStep` en vez del `PaymentStep` con Stripe Elements.
- Carritos **mixtos** (producto de pago + canje) tienen total > 0 → checkout normal por Stripe (cobra solo la parte de pago, con el 10% de socio y envío gratis). **Verificado**: Porsche 3 € + canje ×2 → subtotal 3 €, descuento −0,30 €, **total 2,70 €** por Stripe; la pegatina va a 0 € con 2 créditos.

### 4.10 Impresión prioritaria por tier

Objetivo del brief: los pedidos de socios van **al principio de la cola** (impresión el mismo día).

**Modelo `custom_order`** (`apps/backend/src/modules/custom-orders/models/custom-order.ts`) — campos añadidos:
```ts
priority: model.boolean().default(false),       // true → cola prioritaria
membership_tier: model.text().nullable(),       // bronce | plata | gold | null
paid_with_credits: model.boolean().default(false),
```
(migración aplicada.)

**Asignación**: el workflow `apps/backend/src/workflows/create-custom-orders-from-order.ts` (disparado por el subscriber `order-placed-create-custom-order.ts`):
- Carga `customer_id` del pedido, busca su `membership` activa (`active`/`past_due`).
- Si es socio → `priority = true`, `membership_tier = m.tier`.
- Lee `paid_with_credits` de la metadata del line item.

**Admin** (`apps/backend/src/admin/routes/custom-orders/`):
- **Lista**: columna "Cola" con badge rojo **"⚡ Prioritario · Plata"** + badge morado **"Créditos"**. La ruta `GET /admin/custom-orders` ordena **prioritarios primero**: en la ruta se fuerza `pagination.order = { priority: 'DESC', created_at: 'ASC' }` (FIFO dentro de cada grupo).
- **Detalle**: los mismos badges en la cabecera.

> ⚠️ El `order` multi-campo por **query string con coma** (`-priority,created_at`) **NO** se parsea en Medusa (lo trata como un único nombre de propiedad y da 500). Hay que poner el objeto `order` directamente en la ruta.

### 4.11 Panel admin de suscripciones

`apps/backend/src/admin/routes/memberships/page.tsx` → aparece en `/app` como **"RT Bunker Club"** (icono `Star`).
- **DataTable** con: cliente (email/nombre), plan (badge), estado (badge), créditos, renovación (+ "cancela" si `cancel_at_period_end`).
- Botón **"Ajustar"** por fila → **Drawer** con set manual de **créditos** y **estado** (soporte: regalar créditos, cancelar, etc.).
- Sigue las reglas de la skill de admin: SDK para todo, query de display que carga on-mount, invalidación de `['memberships']` tras la mutación, componentes Medusa UI.

**API admin:**
- `GET /admin/memberships` (`src/api/admin/memberships/route.ts`): lista las memberships y las **enriquece con el email/nombre del cliente** (2ª query a `customer` porque `membership.customer_id` es texto, no hay module-link). Soporta `limit`/`offset`/`status`.
- `POST /admin/memberships/:id` (`src/api/admin/memberships/[id]/route.ts`): set manual de `credits_balance` y/o `status`.

### 4.12 Storefront del Club

- `lib/memberships.ts` — `MEMBERSHIP_TIERS` (display) + helpers (`getTier`, `tierSavingsPct`).
- `lib/membership.ts` — `getMembership()` (server, cookie reenviada como `getCurrentCustomer`) + `isActiveMembership()`.
- `app/[locale]/planes/page.tsx` — **página pública de planes** (hero "RT Bunker Club", 3 tarjetas con Plata destacada como "Más popular", valor tachado/ahorro, créditos, beneficios con checks, sección "Cómo funcionan los créditos", FAQ, CTA a contacto).
- `components/memberships/plan-checkout-button.tsx` — CTA "Hazte socio": llama al endpoint de checkout y redirige a Stripe; si no hay sesión, a `/login`.
- `components/memberships/manage-subscription-button.tsx` — abre el Billing Portal.
- `components/memberships/club-promo-banner.tsx` — banda promocional reutilizable (se muestra en `/personalizadas` a los no-socios).
- `app/[locale]/cuenta/suscripcion/page.tsx` — **"Mi suscripción"**: plan actual, estado, renovación, créditos, beneficios, botón gestionar; o CTA a `/planes` si no eres socio. Banner "procesando" si vuelves de Stripe con `?status=success`.
- Item **"Mi suscripción"** (icono `Crown`) en `components/account/account-nav.tsx`.
- Enlaces a `/planes` en el footer ("Hazte socio") y en el menú móvil (badge "Club").

### 4.13 Scripts de operación del Club

(Se ejecutan con `npx medusa exec ./src/scripts/X.ts [args]` desde `apps/backend`.)

- **`setup-memberships.ts`** — **idempotente. CORRER UNA VEZ por entorno/DB nueva.** Crea los 3 customer groups + las 3 promociones de descuento (`RTBCLUB_BRONCE/PLATA/GOLD`) + la promo de envío gratis (`RTBCLUB_FREESHIP`).
- **`grant-membership.ts <email> <tier|cancel>`** — helper de DEV: activa/cancela una membership a un cliente **sin pasar por Stripe** (para probar). Aplica a todos los duplicados del email. Ej:
  ```bash
  npx medusa exec ./src/scripts/grant-membership.ts unlimiteddco@gmail.com plata
  npx medusa exec ./src/scripts/grant-membership.ts unlimiteddco@gmail.com cancel
  ```
- **`validate-member-discount.ts`** — crea un cliente de prueba en el grupo Plata, le monta un carrito y comprueba que recibe el −10% automático (se autolimpia).

### 4.14 Variables de entorno del Club

En `apps/backend/.env`:
- `STRIPE_API_KEY` — clave secreta de Stripe (ya configurada, test).
- `STRIPE_WEBHOOK_SECRET` — webhook de pagos (ya existe).
- `STRIPE_SUBSCRIPTIONS_WEBHOOK_SECRET` — **(a configurar)** secret del webhook de suscripciones (el `whsec_…` de `stripe listen` en dev, o un endpoint dedicado en prod).
- `STOREFRONT_URL` — para los `success_url`/`cancel_url`/`return_url` (default `http://localhost:8000`).
- `stripe` declarado como dependencia directa del backend (`^15.12.0`).

### 4.15 Cómo probar el Club end-to-end

**Opción rápida (sin Stripe), para ver cuenta + descuento + créditos:**
1. `npx medusa exec ./src/scripts/grant-membership.ts TU_EMAIL plata` (desde `apps/backend`).
2. Logueado, en **`/cuenta/suscripcion`** ves el plan Plata activo (50 créditos).
3. Añade un producto al carrito → checkout → **−10%** automático en el total.
4. En **`/personalizadas`** (tamaño pequeña/mediana) activa **"Pagar con créditos"** → canjea → carrito con la pegatina a 0 € → checkout **gratis** ("Tu pedido es gratis"). El saldo baja.
5. En el admin, ese custom order sale **prioritario** en "Personalizadas".

**Opción real con Stripe:**
1. `stripe listen --forward-to localhost:9000/webhooks/stripe-subscriptions` → copia el `whsec_…` a `STRIPE_SUBSCRIPTIONS_WEBHOOK_SECRET` y reinicia el backend.
2. En `/planes` → "Hazte socio" → Stripe Checkout (tarjeta `4242…`) → vuelve y el webhook activa la membership.

### 4.16 Pendiente del Club

- Confirmar **e2e en navegador** el canje de créditos + checkout gratis + que el pedido sale prioritario en admin (el backend está validado; falta el "click test" final).
- Configurar `STRIPE_SUBSCRIPTIONS_WEBHOOK_SECRET` en dev/prod.
- En prod/DB nueva: correr `setup-memberships.ts` una vez.
- (Opcional) "Soporte de texto exclusivo" como canal real (hoy es copy/beneficio).
- (Opcional) Cashback (estaba junto a suscripciones en el roadmap; sin brief).

---

## 5. Otras funcionalidades construidas

(Resumen de todo lo demás creado en el proyecto, además del Club.)

- **Cookies banner RGPD/LSSI-CE** (first-party, sin terceros): `lib/consent.ts` (cookie `_rtb_consent`, categorías necessary/analytics/marketing, eventos custom), `components/marketing/cookie-banner.tsx` (banner + panel de preferencias), botón "Cookies" en footer. **Páginas legales** en `lib/cms.ts` renderizadas en `/pagina/[slug]`: `aviso-legal`, `privacidad`, `cookies` (contenido legal completo ES + EN/FR; quedan placeholders `[COMPLETAR: razón social]` y `[COMPLETAR: NIF/CIF]`).
- **Header solo-ES**: quitado el `LocaleSwitcher`/icono Globe (la infra i18n sigue por debajo). **Buscador** reescrito (`components/search/search-bar.tsx`): texto visible (tono dark/light), debounce 140 ms, navegación con teclado ↑↓/Esc, botón limpiar, "ver todos".
- **Mega menú "Shop stickers"** (`components/layout/shop-mega-menu.tsx`, client, hover-intent, posicionado `fixed`): tarjetas de categoría **con foto de un producto** + columna de marcas de coches. El header (server) le pasa `getShopMenuData()`.
- **Menú móvil** rediseñado orientado a ecommerce (`components/layout/mobile-nav.tsx`): cabecera de marca, buscador, **categorías con foto**, nav con iconos (Personalizadas, Hazte socio, Servicios, Nosotros, Contacto), pie con "Mi cuenta" + franja de confianza. Hamburguesa blanca/grande.
- **URLs de categoría para SEO**: ruta real **`/categoria/[handle]`** (`app/[locale]/categoria/[handle]/page.tsx`) con `generateStaticParams` + `generateMetadata` (canonical/og), H1, descripción, productos de la categoría **+ subcategorías**, sidebar de filtros y paginación. Helpers en `lib/products.ts`: `getCategoryTree`, `getCategoryByHandle`, `getShopMenuData`. **Jerarquía de categorías** montada en Medusa (las 18 marcas cuelgan de "Pegatinas de marcas de coches"). El `CategoryFilter` (plegable en móvil), el breadcrumb y el eyebrow de la PDP, y el footer enlazan a `/categoria/[handle]`.
- **Filtro de categorías** (`components/shop/category-filter.tsx`): jerárquico (categoría → subcategorías con línea conectora), **plegable** (subcategorías ocultas por defecto, chevron; auto-abre el grupo de la categoría activa). En móvil todo el panel es plegable.
- **PDP** (`app/[locale]/producto/[handle]/`): arregladas las **flechas de la galería** (eran un `Button` con `hover:-translate-y-0.5` que pisaba el centrado → ahora `<button>` plano), **breadcrumbs** ahora `Inicio › Categoría › Producto` (sin "Tienda"), descripciones limpias (HTML de Woo → texto vía `lib/html.ts`).
- **Variantes "Default"**: ocultas con `lib/variant.ts` `formatVariantTitle()` (Medusa pone "Default" a productos de 1 variante) en mini-cart, carrito y order-summary.
- **Drawer del carrito** (`ui/sheet.tsx`): animación smooth pero rápida (easing `cubic-bezier(0.32,0.72,0,1)`, 340/240 ms).
- **Personalizadas**: la variante "compact" (Sticker-Shuttle-style, antes `/personalizadas-2`) es la **página por defecto** `/personalizadas`; `/personalizadas-2` hace redirect 307. Aligerada visualmente. Banner del Club al final.
- **Página de contacto** real `/contacto` (`app/[locale]/contacto/page.tsx`): info (email/dirección/horario/Instagram) + formulario (`components/contact/contact-form.tsx`) con validación inline + honeypot + server action `actions/contact.ts` (Resend, fallback simulado si no hay `RESEND_API_KEY`). Las 5 refs a `/pagina/contacto` ahora van a `/contacto`.
- **Página "Nosotros"** visual `/nosotros` (`app/[locale]/nosotros/page.tsx`): historia real de RT Bunker (fundador Nikita, desde 2022, wrapping+adhesivos+detailing, origen del nombre "RusoTurista"+"Bunker", filosofía, valores), hero con imagen, galería wrapping/detailing, firma + CTAs. Imágenes de rtbunker.com en `public/about/`. Refs `/pagina/about` → `/nosotros`.
- **Home — `ScrollShowcase`** (`components/home/scroll-showcase.tsx`, **framer-motion**): 3 filas alternas con foto + parallax ligado al scroll + CTA (Car Wrapping `/servicios#car-wrapping`, Car Detailing `/servicios`, Sobre nosotros `/nosotros`). Imágenes en `public/home/`. Respeta `prefers-reduced-motion`.
- **Sistema de direcciones** (`/cuenta/direcciones`): CRUD completo (`components/account/address-book.tsx`) — alta/edición (diálogo) + borrado, vía `sdk.store.customer.createAddress/updateAddress/deleteAddress` (el SDK en cliente envía la cookie de sesión). Etiqueta, default de envío, provincia, país.
- **Detalle de pedido** (`components/account/order-detail.tsx`): timeline de estado + **ahorro de socio** (banner verde "Con tu descuento de socio te ahorraste X€" + línea "Descuento de socio"; detectado por `discount_total > 0` porque el entity `order` no expone `promotions`). Líneas de pedido clicables desde `/cuenta`.
- **Emails** (`apps/backend/src/workflows/emails/templates.ts`): rediseñados (confirmación de pedido + bienvenida), table-based, branded.
- **Resiliencia del carrito** (`lib/cart.ts`): `isRecoverableCartError` detecta payment session obsoleta (Stripe live↔test) **y carrito ya completado** → descarta la cookie y reintenta en uno limpio. Al completar un pedido (PaymentStep / FreeOrderStep) se **resetea la cookie del carrito** (causa raíz de "cart is already completed"). Botón "Vaciar carrito".

---

## 6. Módulos backend (resumen)

`apps/backend/src/modules/`
- **`custom-orders`** (`CUSTOM_ORDERS_MODULE = 'customOrders'`): pedidos de pegatinas personalizadas. Modelo `custom_order` (config del configurador, diseño, proofs versionados, status, tracking, **priority/membership_tier/paid_with_credits**, magic_token, order_id). Flujo pago-primero: configurador → `/store/custom-orders/cart` → checkout → `order.placed` → subscriber crea el CustomOrder. Admin en `/app/custom-orders` (lista + detalle con subida de mockups, status, tracking). Página pública de aprobación con magic_token.
- **`memberships`** (`MEMBERSHIPS_MODULE = 'memberships'`): ver §4.
- **`reviews`**: reseñas de producto con moderación admin (`/app/reviews`), email post-compra (job diario), AggregateRating SEO en la PDP.
- **`newsletter`**: captura de email (Resend audience).
- **`resend-notification`**: provider de notificación custom (emails con Resend, dev-redirect).

---

## 7. Mapa de rutas del storefront

Bajo `/[locale]/` (locale = `es` activo):
- `/` — home (Hero, CategoryGrid, **ScrollShowcase**, WhyUs, Destacados).
- `/tienda` — catálogo (sidebar de categorías, sort, paginación).
- `/categoria/[handle]` — **página de categoría SEO**.
- `/producto/[handle]` — PDP (galería, info tabs, reviews, breadcrumbs por categoría).
- `/personalizadas` — configurador (con créditos para socios) + banner Club. `/personalizadas-2` → redirect.
- `/personalizadas/aprobar/[id]?token=` — aprobación pública de mockup.
- `/servicios` — servicios (car wrapping, etc., con anclas `#car-wrapping`).
- `/planes` — **planes del Club**.
- `/nosotros` — about.
- `/contacto` — contacto con formulario.
- `/pagina/[slug]` — CMS legal (aviso-legal, privacidad, cookies, about/devoluciones).
- `/carrito`, `/checkout`, `/checkout/exito/[id]`.
- `/login`, `/registro`.
- `/cuenta` — dashboard. Subrutas: `/cuenta/pedidos` (+ `[id]`), `/cuenta/personalizadas` (+ `[id]`), `/cuenta/direcciones`, **`/cuenta/suscripcion`**.

---

## 8. Operación y comandos útiles

**Arrancar dev:**
```bash
# Docker (postgres/redis/meilisearch) ya levantado
cd apps/backend && npm run dev      # Medusa :9000  (medusa develop)
cd apps/storefront && npm run dev   # Next   :8000
```
**Migraciones backend:**
```bash
cd apps/backend
npx medusa db:generate <Modulo>     # genera migración tras cambiar un modelo
npx medusa db:migrate
```
**Setup del Club (una vez por DB):**
```bash
cd apps/backend
npx medusa exec ./src/scripts/setup-memberships.ts
```
**Activar socio de prueba:**
```bash
npx medusa exec ./src/scripts/grant-membership.ts unlimiteddco@gmail.com plata
```
**Typecheck:**
```bash
cd apps/storefront && npx tsc --noEmit
cd apps/backend && npx tsc --noEmit   # ignora el error de medusa-config (rootDir)
```

---

## 9. Gotchas / cosas a recordar

- **HMR de Turbopack**: tras muchas ediciones rápidas el storefront da 500 con "module factory is not available / deleted in HMR update". Es transitorio: recompila al re-pedir la página. Si persiste de verdad: `rm -rf apps/storefront/.next && npm run dev`.
- **No levantar dos dev servers de Next sobre el mismo `.next`** → corrompe los chunks de Turbopack (`Cannot find module '[turbopack]_runtime.js'`). Un solo server por carpeta.
- **Carritos "envenenados"**: payment sessions de Stripe de otra clave (live↔test) bloquean el carrito ("Could not delete all payment sessions"). `lib/cart.ts` se auto-recupera; el endpoint dev `/api/dev/reset-cart` también.
- **`unit_price: 0` no hace override** en `addToCartWorkflow` (cae al precio base de la variante). Por eso el producto esqueleto de personalizadas tiene precio base 0 para que los créditos sean gratis.
- **Stripe no cobra <0,50 €** → pedidos de total 0 € (créditos) usan `pp_system_default` (ver §4.9).
- **`order` multi-campo por query string** no se parsea en Medusa (usar objeto `order` en la ruta).
- **El entity `order` no expone `promotions`** en query.graph (rompe `order.retrieve`). El ahorro de socio se detecta por `discount_total`.
- **Duplicados de customer**: `unlimiteddco@gmail.com` tiene 2 registros (checkout invitado + registro). Los scripts del Club aplican a todos los que comparten email.
- **DNI obligatorio** (regla de negocio §5.12): clientes y pedidos deben llevar DNI/NIE/CIF para factura española (validado en registro + checkout, `lib/spanish-id.ts`).

---

_Fin del documento. Mantener `PROJECT_CONTEXT.md` (raíz) como doc vivo corto y este `docs/` como referencia larga._
