import { MiddlewareRoute, validateAndTransformBody } from '@medusajs/framework'
import { z } from 'zod'

export const SubscribeNewsletterSchema = z.object({
  email: z.string().email(),
  consent_given: z.boolean(),
  source: z.string().max(50).optional().nullable(),
})
export type SubscribeNewsletterSchema = z.infer<typeof SubscribeNewsletterSchema>

export const newsletterMiddlewares: MiddlewareRoute[] = [
  {
    matcher: '/store/newsletter/subscribe',
    method: 'POST',
    middlewares: [validateAndTransformBody(SubscribeNewsletterSchema)],
  },
]
