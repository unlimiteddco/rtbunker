import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'

import {
  deleteContentBlockWorkflow,
  updateContentBlockWorkflow,
} from '../../../../workflows/content-block'
import type { UpdateContentBlockSchema } from '../middlewares'

/** POST /admin/content-blocks/:id — edita una pieza de contenido. */
export async function POST(
  req: AuthenticatedMedusaRequest<UpdateContentBlockSchema>,
  res: MedusaResponse,
) {
  const { result } = await updateContentBlockWorkflow(req.scope).run({
    input: { id: req.params.id, ...req.validatedBody },
  })

  return res.json({ content_block: result })
}

/** DELETE /admin/content-blocks/:id — borra una pieza (no en colecciones fijas). */
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  await deleteContentBlockWorkflow(req.scope).run({ input: { id } })

  return res.json({ id, object: 'content_block', deleted: true })
}
