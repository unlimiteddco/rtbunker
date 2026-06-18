import { loadEnv, defineConfig, Modules } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV ?? 'development', process.cwd())

/**
 * Configuración de Medusa 2.0.
 *
 * Notas importantes:
 * - El feature flag `translations` activa el módulo de traducciones para
 *   productos / categorías / colecciones. Está en beta en Medusa 2.x.
 * - R2 se usa vía el provider S3-compatible oficial (`@medusajs/file-s3`).
 *   No existe `@medusajs/file-r2` separado; R2 expone API S3.
 * - Resend se integra como módulo de notificación custom en
 *   `src/modules/resend-notification`.
 * - Meilisearch se integra vía subscriber + SDK en `src/subscribers/meilisearch-sync.ts`.
 *   El plugin `medusa-plugin-meilisearch` original es para v1.x.
 */
export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    // El Postgres interno de Dokploy NO tiene SSL. Sin esto, Medusa en
    // producción intenta SSL y falla con "server does not support SSL
    // connections". Para una BD gestionada que lo requiera: DATABASE_SSL=true.
    databaseDriverOptions: {
      connection: {
        // ssl:false desactiva SSL (pg lo acepta). Medusa lo tipa como
        // objeto|undefined, así que casteamos el `false` a undefined (solo a
        // nivel de tipos; el valor en runtime sigue siendo false).
        ssl:
          process.env.DATABASE_SSL === 'true'
            ? { rejectUnauthorized: false }
            : (false as unknown as undefined),
      },
    },
    redisUrl: process.env.REDIS_URL,
    workerMode: (process.env.MEDUSA_WORKER_MODE ?? 'shared') as 'shared' | 'server' | 'worker',
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET ?? 'supersecret',
      cookieSecret: process.env.COOKIE_SECRET ?? 'supersecret',
      // TTL del JWT Bearer (admin SDK / customer SDK con bearer).
      jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '30d',
    },
    // ⚠ IMPORTANTE: por defecto Medusa expira la cookie de sesión a las 10h
    // (ver @medusajs/framework/dist/http/express-loader.js · línea 47).
    // Como tanto el admin (sdk.admin) como el storefront (sdk.store) usan
    // `auth: { type: 'session' }`, sin esto Nikita y los clientes tienen
    // que re-loguearse cada 10 horas. Subimos el TTL a 30 días en dev.
    // En producción override via env: `SESSION_TTL_MS=86400000` (24h).
    sessionOptions: {
      ttl: Number(process.env.SESSION_TTL_MS ?? 30 * 24 * 60 * 60 * 1000),
    },
  },

  featureFlags: {
    // Activa el módulo de traducciones (multi-idioma para productos/categorías).
    translations: true,
  },

  admin: {
    disable: process.env.DISABLE_ADMIN === 'true',
    backendUrl: process.env.MEDUSA_BACKEND_URL ?? 'http://localhost:9000',
  },

  modules: [
    // ───── File: Cloudflare R2 (S3) en prod, local en dev sin credenciales ──
    {
      resolve: '@medusajs/medusa/file',
      options: {
        providers: process.env.R2_ACCESS_KEY_ID
          ? [
              {
                resolve: '@medusajs/medusa/file-s3',
                id: 's3',
                options: {
                  file_url: process.env.R2_PUBLIC_URL,
                  access_key_id: process.env.R2_ACCESS_KEY_ID,
                  secret_access_key: process.env.R2_SECRET_ACCESS_KEY,
                  region: process.env.R2_REGION ?? 'auto',
                  bucket: process.env.R2_BUCKET,
                  endpoint: process.env.R2_ENDPOINT,
                  // forcePathStyle: requerido por R2.
                  // requestChecksumCalculation/responseChecksumValidation = 'WHEN_REQUIRED':
                  //   Por defecto, AWS SDK ≥3.700 mete headers x-amz-sdk-checksum-algorithm
                  //   en cada PUT y R2 los rechaza con SignatureDoesNotMatch. Forzando
                  //   "WHEN_REQUIRED" volvemos al comportamiento legacy compatible con R2.
                  additional_client_config: {
                    forcePathStyle: true,
                    requestChecksumCalculation: 'WHEN_REQUIRED',
                    responseChecksumValidation: 'WHEN_REQUIRED',
                  },
                },
              },
            ]
          : [
              {
                resolve: '@medusajs/medusa/file-local',
                id: 'local',
                options: {
                  upload_dir: 'static',
                  backend_url: `${process.env.MEDUSA_BACKEND_URL ?? 'http://localhost:9000'}/static`,
                },
              },
            ],
      },
    },

    // ───── Cache & Event Bus en Redis ────────────────────────────────
    {
      resolve: '@medusajs/medusa/cache-redis',
      options: { redisUrl: process.env.REDIS_URL },
    },
    {
      resolve: '@medusajs/medusa/event-bus-redis',
      options: { redisUrl: process.env.REDIS_URL },
    },
    {
      resolve: '@medusajs/medusa/workflow-engine-redis',
      options: {
        redis: { url: process.env.REDIS_URL },
      },
    },

    // ───── Pagos: Stripe (+ PayPal opcional) ─────────────────────────
    {
      resolve: '@medusajs/medusa/payment',
      options: {
        providers: [
          {
            resolve: '@medusajs/medusa/payment-stripe',
            id: 'stripe',
            options: {
              apiKey: process.env.STRIPE_API_KEY,
              webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
              capture: true,
              automatic_payment_methods: true,
            },
          },
          // PayPal (provider custom). Solo se registra si hay credenciales,
          // para que el backend arranque igual sin ellas. provider_id resultante
          // = `pp_paypal_paypal`. El webhook lo enruta Medusa a
          // `/hooks/payment/paypal_paypal`.
          ...(process.env.PAYPAL_CLIENT_ID
            ? [
                {
                  resolve: './src/modules/paypal',
                  id: 'paypal',
                  options: {
                    client_id: process.env.PAYPAL_CLIENT_ID,
                    client_secret: process.env.PAYPAL_CLIENT_SECRET,
                    environment: (process.env.PAYPAL_ENVIRONMENT ?? 'sandbox') as
                      | 'sandbox'
                      | 'live',
                    autoCapture: process.env.PAYPAL_AUTO_CAPTURE === 'true',
                    webhook_id: process.env.PAYPAL_WEBHOOK_ID,
                  },
                },
              ]
            : []),
        ],
      },
    },

    // ───── Pedidos personalizados (módulo propio) ───────────────────
    {
      resolve: './src/modules/custom-orders',
    },

    // ───── Newsletter / captura de email (módulo propio) ────────────
    {
      resolve: './src/modules/newsletter',
    },

    // ───── Reseñas de producto (módulo propio) ──────────────────────
    {
      resolve: './src/modules/reviews',
    },

    // ───── Suscripciones / RT Bunker Club (módulo propio) ───────────
    {
      resolve: './src/modules/memberships',
    },

    // ───── Notificaciones: Resend (provider custom local) ────────────
    {
      resolve: '@medusajs/medusa/notification',
      options: {
        providers: [
          {
            resolve: './src/modules/resend-notification',
            id: 'resend',
            options: {
              channels: ['email'],
              apiKey: process.env.RESEND_API_KEY,
              from: process.env.RESEND_FROM,
              replyTo: process.env.RESEND_REPLY_TO,
              devRedirectTo: process.env.RESEND_DEV_REDIRECT_TO,
            },
          },
        ],
      },
    },
  ],
})
