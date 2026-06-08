import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'

import { moderateReviewWorkflow } from '../../../../../workflows/moderate-review'
import type { ModerateReviewSchema } from '../../middlewares'

/**
 * POST /admin/reviews/:id/status
 * Aprueba / rechaza una reseña y opcionalmente adjunta respuesta pública.
 */
export async function POST(
  req: AuthenticatedMedusaRequest<ModerateReviewSchema>,
  res: MedusaResponse,
) {
  const { id } = req.params

  const { result } = await moderateReviewWorkflow(req.scope).run({
    input: {
      review_id: id!,
      status: req.validatedBody.status,
      admin_response: req.validatedBody.admin_response,
    },
  })

  return res.json({ review: result.review })
}
