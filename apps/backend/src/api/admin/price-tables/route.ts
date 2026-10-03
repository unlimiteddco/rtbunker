import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'

import { updatePriceTableWorkflow } from '../../../workflows/update-price-table'
import type { UpdatePriceTableSchema } from './middlewares'
import { invalidatePriceTableSignatures } from './signatures'

/**
 * POST /admin/price-tables
 * Aplica cambios de precio "por tamaño" a uno o varios productos (página admin
 * "Precios por tamaño"). Ver `middlewares.ts` para el contrato.
 */
export async function POST(
  req: AuthenticatedMedusaRequest<UpdatePriceTableSchema>,
  res: MedusaResponse,
) {
  const { result } = await updatePriceTableWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  invalidatePriceTableSignatures()

  return res.json(result)
}
