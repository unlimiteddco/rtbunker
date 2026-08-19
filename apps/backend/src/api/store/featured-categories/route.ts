import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import type { ListStoreFeaturedCategoriesSchema } from './middlewares'

/**
 * GET /store/featured-categories
 * Lista pública de las categorías destacadas del bloque "Shop stickers" de la
 * home. Solo `published=true`, ordenadas por rank (asc).
 *
 * Uso en apps/storefront/src/components/home/category-grid.tsx:
 *   1. Pedir esta lista. Si viene vacía → comportamiento actual
 *      (`listCategories().slice(0, 4)`).
 *   2. Para cada entrada, resolver la categoría real por `category_handle`.
 *   3. Título = `label` ?? nombre real de la categoría.
 *   4. Foto   = `image` ?? foto del primer producto de la categoría.
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { limit, offset } =
    req.validatedQuery as unknown as ListStoreFeaturedCategoriesSchema

  const take = limit ?? 100
  const skip = offset ?? 0

  const { data, metadata } = await query.graph({
    entity: 'featured_category',
    fields: ['id', 'category_handle', 'label', 'image', 'rank'],
    filters: { published: true },
    pagination: { take, skip, order: { rank: 'ASC', created_at: 'ASC' } },
  })

  return res.json({
    featured_categories: data,
    count: metadata?.count ?? data.length,
    limit: take,
    offset: skip,
  })
}
