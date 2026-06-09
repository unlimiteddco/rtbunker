import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { MedusaError } from '@medusajs/framework/utils'

import { addCustomOrderProofWorkflow } from '../../../../../workflows/add-custom-order-proof'
import type { AddProofSchema } from '../../middlewares'

/**
 * POST /admin/custom-orders/:id/proofs
 * Body (lote):   { proofs: [{ url, file_name? }, …], admin_notes? }
 * Body (single): { url, file_name?, admin_notes? }  ← compat antiguo
 *
 * Espera que los archivos ya se hayan subido vía /admin/uploads y que el
 * cliente nos pase las URLs públicas resultantes. Emite un único evento
 * `custom_order.proof_added` por lote.
 */
export async function POST(
  req: AuthenticatedMedusaRequest<AddProofSchema>,
  res: MedusaResponse,
) {
  const { id } = req.params
  const body = req.validatedBody

  // Normalizamos a un array de proofs aceptando ambos formatos. Bajo
  // exactOptionalPropertyTypes construimos el input EXPLÍCITO para no
  // arrastrar `undefined`/null inesperados del spread del body.
  const proofs = body.proofs
    ? body.proofs.map((p) => ({ url: p.url, file_name: p.file_name ?? null }))
    : body.url
      ? [{ url: body.url, file_name: body.file_name ?? null }]
      : []

  if (proofs.length === 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'Envía al menos un proof (campo `proofs` o `url`).',
    )
  }

  const { result } = await addCustomOrderProofWorkflow(req.scope).run({
    input: {
      custom_order_id: id!,
      proofs,
      admin_notes: body.admin_notes ?? null,
    },
  })

  return res.status(201).json(result)
}
