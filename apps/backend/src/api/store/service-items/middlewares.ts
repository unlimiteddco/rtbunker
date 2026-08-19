import { MiddlewareRoute, validateAndTransformQuery } from '@medusajs/framework'
import { z } from 'zod'

export const ListStoreServiceItemsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
})
export type ListStoreServiceItemsSchema = z.infer<typeof ListStoreServiceItemsSchema>

export const storeServiceItemMiddlewares: MiddlewareRoute[] = [
  {
    matcher: '/store/service-items',
    method: 'GET',
    middlewares: [validateAndTransformQuery(ListStoreServiceItemsSchema, {})],
  },
]
