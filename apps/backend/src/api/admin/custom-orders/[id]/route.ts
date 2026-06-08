import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { MedusaError } from '@medusajs/framework/utils'

/**
 * GET /admin/custom-orders/:id — detalle.
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve('query')
  const { id } = req.params

  const { data } = await query.graph({
    entity: 'custom_order',
    filters: { id },
    ...req.queryConfig,
  })

  if (!data || data.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `CustomOrder ${id} not found`)
  }

  return res.json({ custom_order: data[0] })
}
