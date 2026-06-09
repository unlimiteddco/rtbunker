import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { submitReviewWorkflow } from '../../../workflows/submit-review'
import type { CreateReviewSchema, ListReviewsSchema } from './middlewares'

/**
 * GET /store/reviews?product_id=...
 * Devuelve las reseñas APROBADAS de un producto + estadísticas (media,
 * total y distribución por estrellas). Público.
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { product_id, limit, offset } = req.validatedQuery as unknown as ListReviewsSchema

  // Todas las aprobadas → para estadística fiable. Paginamos la lista visible.
  const { data: all } = await query.graph({
    entity: 'review',
    fields: ['id', 'rating', 'verified_purchase'],
    filters: { product_id, status: 'approved' },
  })

  const count = all.length
  const sum = all.reduce((acc: number, r: any) => acc + (r.rating ?? 0), 0)
  const average = count > 0 ? Math.round((sum / count) * 10) / 10 : 0
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>
  for (const r of all) {
    const k = r.rating as number
    if (k >= 1 && k <= 5) distribution[k] += 1
  }

  const take = limit ?? 10
  const skip = offset ?? 0
  const { data: reviews } = await query.graph({
    entity: 'review',
    fields: [
      'id',
      'name',
      'rating',
      'title',
      'content',
      'images',
      'verified_purchase',
      'admin_response',
      'created_at',
    ],
    filters: { product_id, status: 'approved' },
    pagination: { take, skip, order: { created_at: 'DESC' } },
  })

  return res.json({
    reviews,
    count,
    average,
    distribution,
    limit: take,
    offset: skip,
  })
}

/**
 * POST /store/reviews
 * Crea una reseña en estado `pending` (moderación). Si el cliente está
 * logueado capturamos su customer_id para enlazarla a su cuenta.
 */
export async function POST(
  req: AuthenticatedMedusaRequest<CreateReviewSchema>,
  res: MedusaResponse,
) {
  const body = req.validatedBody
  const customer_id = req.auth_context?.actor_id ?? null

  const { result } = await submitReviewWorkflow(req.scope).run({
    input: {
      product_id: body.product_id,
      email: body.email,
      name: body.name,
      rating: body.rating,
      title: body.title,
      content: body.content,
      images: body.images ?? null,
      customer_id,
    },
  })

  return res.status(201).json({ review: result.review })
}
