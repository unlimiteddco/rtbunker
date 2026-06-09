import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk'
import { MedusaError } from '@medusajs/framework/utils'
import { randomBytes } from 'node:crypto'

import { CUSTOM_ORDERS_MODULE } from '../../modules/custom-orders'

export interface ProofInput {
  /** URL pública (R2/local) del mockup ya subido vía /admin/uploads. */
  url: string
  file_name?: string | null | undefined
}

export interface AddCustomOrderProofInput {
  custom_order_id: string
  /** Uno o varios mockups a adjuntar en el mismo lote. */
  proofs: ProofInput[]
  /** Notas del mockup (visibles para el cliente en el email). Comunes al lote. */
  admin_notes?: string | null | undefined
}

export interface ProofEntry {
  id: string
  url: string
  file_name?: string | null | undefined
  version: number
  sent_at: string
  admin_notes?: string | null | undefined
  customer_response?: 'approved' | 'changes_requested' | null | undefined
  customer_response_at?: string | null | undefined
  customer_response_notes?: string | null | undefined
}

export const addCustomOrderProofStep = createStep(
  'add-custom-order-proof',
  async (input: AddCustomOrderProofInput, { container }) => {
    const service: any = container.resolve(CUSTOM_ORDERS_MODULE)

    const existing = await service.retrieveCustomOrder(input.custom_order_id)
    if (!existing) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `CustomOrder ${input.custom_order_id} not found`,
      )
    }

    const currentProofs: ProofEntry[] = Array.isArray(existing.proofs)
      ? (existing.proofs as ProofEntry[])
      : []

    const sentAt = new Date().toISOString()

    // Versionado correlativo a partir del nº de proofs ya existentes:
    // currentProofs.length + 1, + 2, … Todos comparten las mismas notas del
    // mockup (admin_notes) porque pertenecen al mismo lote.
    const newProofs: ProofEntry[] = input.proofs.map((p, i) => ({
      id: `proof_${randomBytes(8).toString('hex')}`,
      url: p.url,
      file_name: p.file_name ?? null,
      version: currentProofs.length + i + 1,
      sent_at: sentAt,
      admin_notes: input.admin_notes ?? null,
      customer_response: null,
      customer_response_at: null,
      customer_response_notes: null,
    }))

    const updatedProofs = [...currentProofs, ...newProofs]

    // Al añadir un proof, status pasa a proof_sent salvo que ya esté en
    // un estado posterior (approved/in_production/etc).
    const POST_PROOF_STATES = new Set([
      'approved',
      'in_production',
      'shipped',
      'delivered',
      'cancelled',
    ])
    const nextStatus = POST_PROOF_STATES.has(existing.status)
      ? existing.status
      : 'proof_sent'

    const [updated] = await service.updateCustomOrders([
      {
        id: input.custom_order_id,
        proofs: updatedProofs,
        status: nextStatus,
      },
    ])

    return new StepResponse(
      { custom_order: updated, proofs: newProofs },
      { id: input.custom_order_id, previous_proofs: currentProofs, previous_status: existing.status },
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
