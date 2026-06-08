import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from '@medusajs/framework/workflows-sdk'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { randomBytes } from 'node:crypto'

import { CUSTOM_ORDERS_MODULE } from '../modules/custom-orders'
import { MEMBERSHIPS_MODULE } from '../modules/memberships'

export interface CreateCustomOrdersFromOrderInput {
  order_id: string
}

interface OrderLineItemMetadata {
  custom_request?: boolean
  config?: {
    shape: string
    material: string
    size_id?: string | null
    width_cm?: number | null
    height_cm?: number | null
  }
  design_file_url?: string | null
  design_file_name?: string | null
  customer_notes?: string | null
  total_price?: number
  paid_with_credits?: boolean
  credits_used?: number
}

/**
 * Carga el order, detecta line items con `metadata.custom_request === true`
 * y crea un CustomOrder por cada uno, vinculado al order_id.
 * Idempotente: si ya hay CustomOrders con este order_id, no duplica.
 */
const createCustomOrdersFromOrderStep = createStep(
  'create-custom-orders-from-order',
  async (input: CreateCustomOrdersFromOrderInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const service: any = container.resolve(CUSTOM_ORDERS_MODULE)

    // Idempotencia: si ya hay CustomOrders para este order_id, salimos.
    const already = await service.listCustomOrders({ order_id: input.order_id })
    if (already && already.length > 0) {
      return new StepResponse({ ids: already.map((o: any) => o.id), skipped: true })
    }

    const { data: orders } = await query.graph({
      entity: 'order',
      fields: [
        'id',
        'email',
        'customer_id',
        'shipping_address.first_name',
        'shipping_address.last_name',
        'shipping_address.phone',
        'items.id',
        'items.quantity',
        'items.unit_price',
        'items.metadata',
      ],
      filters: { id: input.order_id },
    })

    const order = orders[0]
    if (!order || !order.email) {
      return new StepResponse({ ids: [] as string[], skipped: false })
    }

    // Membresía del cliente → prioridad de producción + tier.
    let isMember = false
    let membershipTier: string | null = null
    if (order.customer_id) {
      const memberships = container.resolve(MEMBERSHIPS_MODULE) as any
      const [m] = await memberships.listMemberships(
        { customer_id: order.customer_id },
        { take: 1, order: { created_at: 'DESC' } },
      )
      if (m && (m.status === 'active' || m.status === 'past_due')) {
        isMember = true
        membershipTier = m.tier
      }
    }

    const customItems = (order.items ?? []).filter(
      (it: { metadata?: OrderLineItemMetadata | null }) =>
        (it.metadata as OrderLineItemMetadata | undefined)?.custom_request === true,
    )

    if (customItems.length === 0) {
      return new StepResponse({ ids: [] as string[], skipped: false })
    }

    const customerName =
      [order.shipping_address?.first_name, order.shipping_address?.last_name]
        .filter(Boolean)
        .join(' ')
        .trim() || null

    const records = customItems.map((it: any) => {
      const md = (it.metadata as OrderLineItemMetadata | null) ?? {}
      const cfg = md.config ?? { shape: 'rect', material: 'mate' }
      const units = Number(it.quantity ?? 1)
      const unit_price = Number(it.unit_price ?? 0)
      return {
        customer_email: order.email,
        customer_name: customerName,
        customer_phone: order.shipping_address?.phone ?? null,
        shape: cfg.shape ?? 'rect',
        material: cfg.material ?? 'mate',
        size_id: cfg.size_id ?? null,
        width_cm: cfg.width_cm ?? null,
        height_cm: cfg.height_cm ?? null,
        units,
        unit_price,
        total_price: md.total_price ?? unit_price * units,
        design_file_url: md.design_file_url ?? null,
        design_file_name: md.design_file_name ?? null,
        customer_notes: md.customer_notes ?? null,
        order_id: order.id,
        status: 'pending_review',
        proofs: [],
        magic_token: randomBytes(24).toString('base64url'),
        priority: isMember,
        membership_tier: membershipTier,
        paid_with_credits: Boolean(md.paid_with_credits),
      }
    })

    const created = await service.createCustomOrders(records)
    const list = Array.isArray(created) ? created : [created]

    return new StepResponse({ ids: list.map((c: any) => c.id), skipped: false })
  },
  async (compensationData: any, { container }) => {
    // Si algo falla después, borra los CustomOrders que creamos.
    if (!compensationData?.ids || compensationData.skipped) return
    const service: any = container.resolve(CUSTOM_ORDERS_MODULE)
    for (const id of compensationData.ids) {
      await service.deleteCustomOrders(id)
    }
  },
)

export const createCustomOrdersFromOrderWorkflow = createWorkflow(
  'create-custom-orders-from-order',
  function (input: CreateCustomOrdersFromOrderInput) {
    const result = createCustomOrdersFromOrderStep(input)
    return new WorkflowResponse(result)
  },
)
