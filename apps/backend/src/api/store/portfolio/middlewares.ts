import { MiddlewareRoute, validateAndTransformQuery } from '@medusajs/framework'
import { z } from 'zod'

const PORTFOLIO_SERVICE_TYPES = [
  'wrapping',
  'car-design',
  'chrome-delete',
  'ahumado',
  'rotulacion',
] as const

export const ListStorePortfolioSchema = z.object({
  service_type: z.enum(PORTFOLIO_SERVICE_TYPES).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
})
export type ListStorePortfolioSchema = z.infer<typeof ListStorePortfolioSchema>

export const storePortfolioMiddlewares: MiddlewareRoute[] = [
  {
    matcher: '/store/portfolio',
    method: 'GET',
    middlewares: [validateAndTransformQuery(ListStorePortfolioSchema, {})],
  },
]
