import { MiddlewareRoute, validateAndTransformQuery } from '@medusajs/framework'
import { z } from 'zod'

export const ListStoreFeaturedCategoriesSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
})
export type ListStoreFeaturedCategoriesSchema = z.infer<
  typeof ListStoreFeaturedCategoriesSchema
>

export const storeFeaturedCategoryMiddlewares: MiddlewareRoute[] = [
  {
    matcher: '/store/featured-categories',
    method: 'GET',
    middlewares: [validateAndTransformQuery(ListStoreFeaturedCategoriesSchema, {})],
  },
]
