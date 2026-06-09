import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    MEDUSA_BACKEND_URL: z.string().url(),
    REVALIDATE_SECRET: z.string().min(8),
    MEILISEARCH_HOST: z.string().url(),
    MEILISEARCH_SEARCH_KEY: z.string().min(1),
    MEILISEARCH_INDEX: z.string().min(1).default('products'),
  },
  client: {
    NEXT_PUBLIC_MEDUSA_BACKEND_URL: z.string().url(),
    NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_DEFAULT_REGION: z.string().min(2).default('es'),
    NEXT_PUBLIC_BASE_URL: z.string().url(),
    NEXT_PUBLIC_STRIPE_KEY: z.string().min(1),
    // PayPal: opcional. Sin esta var el checkout funciona solo con Stripe.
    NEXT_PUBLIC_PAYPAL_CLIENT_ID: z.string().default(''),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_MEDUSA_BACKEND_URL: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL,
    NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
    NEXT_PUBLIC_DEFAULT_REGION: process.env.NEXT_PUBLIC_DEFAULT_REGION,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_STRIPE_KEY: process.env.NEXT_PUBLIC_STRIPE_KEY,
    NEXT_PUBLIC_PAYPAL_CLIENT_ID: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
  },
  skipValidation: process.env.SKIP_ENV_VALIDATION === 'true',
})
