import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { MedusaError } from '@medusajs/framework/utils'

import { deletePortfolioWorkWorkflow } from '../../../../workflows/delete-portfolio-work'
import { updatePortfolioWorkWorkflow } from '../../../../workflows/update-portfolio-work'
import type { UpdatePortfolioWorkSchema } from '../middlewares'

/**
 * GET /admin/portfolio/:id — detalle de un trabajo.
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve('query')
  const { id } = req.params

  const { data } = await query.graph({
    entity: 'portfolio_work',
    filters: { id },
    ...req.queryConfig,
  })

  if (!data || data.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `PortfolioWork ${id} not found`)
  }

  return res.json({ portfolio_work: data[0] })
}

/**
 * POST /admin/portfolio/:id — actualiza un trabajo vía workflow.
 */
export async function POST(
  req: AuthenticatedMedusaRequest<UpdatePortfolioWorkSchema>,
  res: MedusaResponse,
) {
  const { id } = req.params

  const { result } = await updatePortfolioWorkWorkflow(req.scope).run({
    input: { id, ...req.validatedBody },
  })

  return res.json({ portfolio_work: result })
}

/**
 * DELETE /admin/portfolio/:id — borra un trabajo vía workflow.
 */
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  await deletePortfolioWorkWorkflow(req.scope).run({
    input: { id },
  })

  return res.json({ id, object: 'portfolio_work', deleted: true })
}
