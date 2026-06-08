import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk'
import { MedusaError } from '@medusajs/framework/utils'

import { CUSTOM_ORDERS_MODULE } from '../../modules/custom-orders'
import type { ProofEntry } from './add-custom-order-proof'

export type ProofDecision = 'approved' | 'changes_requested'

/**
 * Acepta `magic_token` (cliente sin login viene del email) O `custom_order_id`
 * (cliente logueado desde /cuenta/personalizadas). Al menos uno es obligatorio.
 * Si se pasan ambos, prevalece `custom_order_id`.
 */
export interface RespondToCustomOrderProofInput {
  magic_token?: string | null
  custom_order_id?: string | null
  decision: ProofDecision
  notes?: string | null
}

/**
 * Marca el último proof con la respuesta del cliente y mueve el status
 * del pedido en consecuencia:
 *   - approved          → 'approved' (espera a Nikita para producción)
 *   - changes_requested → 'awaiting_changes'
 */
export const respondToCustomOrderProofStep = createStep(
  'respond-to-custom-order-proof',
  async (input: RespondToCustomOrderProofInput, { container }) => {
    const service: any = container.resolve(CUSTOM_ORDERS_MODULE)

    let existing: any = null
    if (input.custom_order_id) {
      existing = await service.retrieveCustomOrder(input.custom_order_id).catch(() => null)
    } else if (input.magic_token) {
      const matches = await service.listCustomOrders({ magic_token: input.magic_token })
      existing = matches?.[0]
    }
    if (!existing) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        'Pedido no encontrado.',
      )
    }

    const proofs: ProofEntry[] = Array.isArray(existing.proofs)
      ? (existing.proofs as ProofEntry[])
      : []

    if (proofs.length === 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Este pedido no tiene mockups todavía.',
      )
    }

    const lastIdx = proofs.length - 1
    const last = proofs[lastIdx]!

    if (last.customer_response) {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        'Ya has respondido a este mockup.',
      )
    }

    const respondedAt = new Date().toISOString()
    const updatedProof: ProofEntry = {
      ...last,
      customer_response: input.decision,
      customer_response_at: respondedAt,
      customer_response_notes: input.notes ?? null,
    }

    const updatedProofs = [...proofs.slice(0, lastIdx), updatedProof]

    const nextStatus =
      input.decision === 'approved' ? 'approved' : 'awaiting_changes'

    const [updated] = await service.updateCustomOrders([
      {
        id: existing.id,
        proofs: updatedProofs,
        status: nextStatus,
      },
    ])

    return new StepResponse(
      {
        custom_order: updated,
        proof: updatedProof,
        decision: input.decision,
      },
      {
        id: existing.id,
        previous_proofs: proofs,
        previous_status: existing.status,
      },
    )
  },
  async (compensationData, { container }) => {
    if (!compensationData) return
    const service: any = container.resolve(CUSTOM_ORDERS_MODULE)
    await service.updateCustomOrders([
      {
        id: compensationData.id,
        proofs: compensationData.previous_proofs,
        status: compensationData.previous_status,
      },
    ])
  },
)
