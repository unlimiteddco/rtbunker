import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { MedusaError } from '@medusajs/framework/utils'

import { deleteProcessStepWorkflow } from '../../../../workflows/delete-process-step'
import { updateProcessStepWorkflow } from '../../../../workflows/update-process-step'
import type { UpdateProcessStepSchema } from '../middlewares'

/**
 * GET /admin/process-steps/:id — detalle de un paso del proceso.
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve('query')
  const { id } = req.params

  const { data } = await query.graph({
    entity: 'process_step',
    filters: { id },
    ...req.queryConfig,
  })

  if (!data || data.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `ProcessStep ${id} not found`)
  }

  return res.json({ process_step: data[0] })
}

/**
 * POST /admin/process-steps/:id — actualiza un paso vía workflow.
 */
export async function POST(
  req: AuthenticatedMedusaRequest<UpdateProcessStepSchema>,
  res: MedusaResponse,
) {
  const { id } = req.params

  const { result } = await updateProcessStepWorkflow(req.scope).run({
    input: { id, ...req.validatedBody },
  })

  return res.json({ process_step: result })
}

/**
 * DELETE /admin/process-steps/:id — borra un paso vía workflow.
 */
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  await deleteProcessStepWorkflow(req.scope).run({
    input: { id },
  })

  return res.json({ id, object: 'process_step', deleted: true })
}
