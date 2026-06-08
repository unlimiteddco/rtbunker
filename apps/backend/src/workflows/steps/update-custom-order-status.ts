import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk'
import { MedusaError } from '@medusajs/framework/utils'

import { CUSTOM_ORDERS_MODULE } from '../../modules/custom-orders'

export const CUSTOM_ORDER_STATUSES = [
  'pending_review',
  'proof_sent',
  'awaiting_changes',
  'approved',
  'in_production',
  'shipped',
  'delivered',
  'cancelled',
] as const

export type CustomOrderStatus = (typeof CUSTOM_ORDER_STATUSES)[number]

export interface UpdateCustomOrderStatusInput {
  custom_order_id: string
  status: CustomOrderStatus
  admin_notes?: string | null
  tracking_number?: string | null
  tracking_url?: string | null
  shipping_carrier?: string | null
}

export interface UpdateCustomOrderStatusOutput {
  custom_order: any
  previous_status: CustomOrderStatus
  next_status: CustomOrderStatus
}

export const updateCustomOrderStatusStep = createStep(
  'update-custom-order-status',
  async (input: UpdateCustomOrderStatusInput, { container }) => {
    const service: any = container.resolve(CUSTOM_ORDERS_MODULE)

    const existing = await service.retrieveCustomOrder(input.custom_order_id)
    if (!existing) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `CustomOrder ${input.custom_order_id} not found`,
      )
    }

    if (!CUSTOM_ORDER_STATUSES.includes(input.status)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Invalid status: ${input.status}`,
      )
    }

    const patch: Record<string, unknown> = {
      id: input.custom_order_id,
      status: input.status,
    }
    if (typeof input.admin_notes === 'string') {
      patch.admin_notes = input.admin_notes
    }
    if (typeof input.tracking_number === 'string') {
      patch.tracking_number = input.tracking_number || null
    }
    if (typeof input.tracking_url === 'string') {
      const raw = input.tracking_url.trim()
      patch.tracking_url = raw
        ? /^https?:\/\//i.test(raw)
          ? raw
          : `https://${raw}`
        : null
    }
    if (typeof input.shipping_carrier === 'string') {
      patch.shipping_carrier = input.shipping_carrier || null
    }

    const [updated] = await service.updateCustomOrders([patch])

    return new StepResponse<UpdateCustomOrderStatusOutput, any>(
      {
        custom_order: updated,
        previous_status: existing.status,
        next_status: input.status,
      },
      {
        id: input.custom_order_id,
        previous_status: existing.status,
        previous_admin_notes: existing.admin_notes,
        previous_tracking_number: existing.tracking_number,
        previous_tracking_url: existing.tracking_url,
        previous_shipping_carrier: existing.shipping_carrier,
      },
    )
  },
  async (compensationData, { container }) => {
    if (!compensationData) return
    const service: any = container.resolve(CUSTOM_ORDERS_MODULE)
    await service.updateCustomOrders([
      {
        id: compensationData.id,
        status: compensationData.previous_status,
        admin_notes: compensationData.previous_admin_notes,
        tracking_number: compensationData.previous_tracking_number,
        tracking_url: compensationData.previous_tracking_url,
        shipping_carrier: compensationData.previous_shipping_carrier,
      },
    ])
  },
)
