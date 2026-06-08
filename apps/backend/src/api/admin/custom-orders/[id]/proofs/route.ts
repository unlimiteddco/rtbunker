import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'

import { addCustomOrderProofWorkflow } from '../../../../../workflows/add-custom-order-proof'
import type { AddProofSchema } from '../../middlewares'

/**
 * POST /admin/custom-orders/:id/proofs
 * Body: { url, file_name?, admin_notes? }
 *
 * Espera que el archivo ya se haya subido vía /admin/uploads y que el
 * cliente nos pase la URL pública resultante.
 */
export async function POST(
  req: AuthenticatedMedusaRequest<AddProofSchema>,
  res: MedusaResponse,
) {
  const { id } = req.params

  const { result } = await addCustomOrderProofWorkflow(req.scope).run({
    input: { custom_order_id: id!, ...req.validatedBody },
  })

  return res.status(201).json(result)
}
