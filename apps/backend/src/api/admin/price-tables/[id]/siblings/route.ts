import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { MedusaError } from '@medusajs/framework/utils'

import { getPriceTableSignatures } from '../../signatures'

/**
 * GET /admin/price-tables/:id/siblings
 * Productos que tienen EXACTAMENTE la misma tabla de precios que este (mismos
 * tamaños, mismos colores y mismos importes). Sirve para aplicar un cambio de
 * precio a toda la "familia" de una vez.
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const entries = await getPriceTableSignatures(req.scope)
  const self = entries.find((e) => e.id === req.params.id)
  if (!self) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Producto no encontrado')
  }

  const siblings = entries
    .filter((e) => e.id !== self.id && e.signature === self.signature)
    .map(({ id, title, thumbnail }) => ({ id, title, thumbnail }))
    .sort((a, b) => a.title.localeCompare(b.title, 'es'))

  return res.json({ siblings, count: siblings.length })
}
