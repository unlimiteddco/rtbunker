import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { MedusaError } from '@medusajs/framework/utils'

import { deleteFeaturedCategoryWorkflow } from '../../../../workflows/delete-featured-category'
import { updateFeaturedCategoryWorkflow } from '../../../../workflows/update-featured-category'
import type { UpdateFeaturedCategorySchema } from '../middlewares'

/**
 * GET /admin/featured-categories/:id — detalle de una categoría destacada.
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve('query')
  const { id } = req.params

  const { data } = await query.graph({
    entity: 'featured_category',
    filters: { id },
    ...req.queryConfig,
  })

  if (!data || data.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `FeaturedCategory ${id} not found`)
  }

  return res.json({ featured_category: data[0] })
}

/**
 * POST /admin/featured-categories/:id — actualiza una categoría destacada.
 */
export async function POST(
  req: AuthenticatedMedusaRequest<UpdateFeaturedCategorySchema>,
  res: MedusaResponse,
) {
  const { id } = req.params

  const { result } = await updateFeaturedCategoryWorkflow(req.scope).run({
    input: { id, ...req.validatedBody },
  })

  return res.json({ featured_category: result })
}

/**
 * DELETE /admin/featured-categories/:id — borra una categoría destacada.
 */
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  await deleteFeaturedCategoryWorkflow(req.scope).run({
    input: { id },
  })

  return res.json({ id, object: 'featured_category', deleted: true })
}
