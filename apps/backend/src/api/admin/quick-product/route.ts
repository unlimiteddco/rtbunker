import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'

import { quickCreateProductWorkflow } from '../../../workflows/quick-create-product'
import type { CreateQuickProductSchema } from './middlewares'

/**
 * POST /admin/quick-product
 * Crea (y opcionalmente publica) un producto completo en un solo paso desde la
 * página admin "Publicar producto". Ver `middlewares.ts` para el contrato.
 */
export async function POST(
  req: AuthenticatedMedusaRequest<CreateQuickProductSchema>,
  res: MedusaResponse,
) {
  const { result } = await quickCreateProductWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  return res.status(201).json({
    product: {
      id: result.id,
      title: result.title,
      handle: result.handle,
      status: result.status,
      variants_count: result.variants?.length ?? 0,
    },
  })
}
