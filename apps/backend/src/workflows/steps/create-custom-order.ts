import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk'
import { randomBytes } from 'node:crypto'

import { CUSTOM_ORDERS_MODULE } from '../../modules/custom-orders'

export interface CreateCustomOrderInput {
  customer_email: string
  customer_name?: string | null
  customer_phone?: string | null

  shape: string
  material: string
  size_id?: string | null
  width_cm?: number | null
  height_cm?: number | null
  units: number
  unit_price: number
  total_price: number

  design_file_url?: string | null
  design_file_name?: string | null
  customer_notes?: string | null

  cart_id?: string | null
  order_id?: string | null
}

export const createCustomOrderStep = createStep(
  'create-custom-order',
  async (input: CreateCustomOrderInput, { container }) => {
    const service: any = container.resolve(CUSTOM_ORDERS_MODULE)

    const magic_token = randomBytes(24).toString('base64url')

    const order = await service.createCustomOrders({
      ...input,
      status: 'pending_review',
      proofs: [],
      magic_token,
    })

    return new StepResponse(order, order.id)
  },
  async (id, { container }) => {
    if (!id) return
    const service: any = container.resolve(CUSTOM_ORDERS_MODULE)
    await service.deleteCustomOrders(id)
  },
)
