import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { MedusaError } from '@medusajs/framework/utils'

import { respondToCustomOrderProofWorkflow } from '../../../../../../workflows/respond-to-custom-order-proof'
import type { RespondToProofSchema } from '../../../middlewares'

/**
 * POST /store/custom-orders/by-token/:token/response
 * Body: { decision: 'approved'|'changes_requested', notes? }
 */
export async function POST(
  req: MedusaRequest<RespondToProofSchema>,
  res: MedusaResponse,
) {
  const { token } = req.params as { token: string }
  if (!token) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Missing token')
  }

  const { result } = await respondToCustomOrderProofWorkflow(req.scope).run({
    input: {
      magic_token: token,
      decision: req.validatedBody.decision,
      notes: req.validatedBody.notes ?? null,
    },
  })

  return res.status(201).json({
    status: result.custom_order.status,
    decision: result.decision,
    proof: {
      version: result.proof.version,
      customer_response: result.proof.customer_response,
      customer_response_at: result.proof.customer_response_at,
      customer_response_notes: result.proof.customer_response_notes,
    },
  })
}
