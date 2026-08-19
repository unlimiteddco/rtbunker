import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { MedusaError } from '@medusajs/framework/utils'

import { deleteServiceItemWorkflow } from '../../../../workflows/delete-service-item'
import { updateServiceItemWorkflow } from '../../../../workflows/update-service-item'
import type { UpdateServiceItemSchema } from '../middlewares'

/**
 * GET /admin/service-items/:id — detalle de una tarjeta de servicio.
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve('query')
  const { id } = req.params

  const { data } = await query.graph({
    entity: 'service_item',
    filters: { id },
    ...req.queryConfig,
  })

  if (!data || data.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `ServiceItem ${id} not found`)
  }

  return res.json({ service_item: data[0] })
}

/**
 * POST /admin/service-items/:id — actualiza una tarjeta vía workflow.
 */
export async function POST(
  req: AuthenticatedMedusaRequest<UpdateServiceItemSchema>,
  res: MedusaResponse,
) {
  const { id } = req.params

  const { result } = await updateServiceItemWorkflow(req.scope).run({
    input: { id, ...req.validatedBody },
  })

  return res.json({ service_item: result })
}

/**
 * DELETE /admin/service-items/:id — borra una tarjeta vía workflow.
 */
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  await deleteServiceItemWorkflow(req.scope).run({
    input: { id },
  })

  return res.json({ id, object: 'service_item', deleted: true })
}
