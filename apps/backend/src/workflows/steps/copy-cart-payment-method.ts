import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import type { IOrderModuleService } from '@medusajs/framework/types'

export interface CopyCartPaymentMethodInput {
  order_id: string
}

type Metadata = Record<string, unknown>

/**
 * Copia `cart.metadata.payment_method` a `order.metadata.payment_method`.
 *
 * En Medusa 2.4 `completeCartWorkflow` NO lleva la metadata del carrito al
 * pedido (los `completeCartFields` no incluyen `metadata`), así que la
 * copiamos aquí para que el admin y el storefront distingan un pedido por
 * transferencia bancaria.
 */
export const copyCartPaymentMethodStep = createStep(
  'copy-cart-payment-method',
  async (input: CopyCartPaymentMethodInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: orders } = await query.graph({
      entity: 'order',
      fields: ['id', 'metadata', 'cart.metadata'],
      filters: { id: input.order_id },
    })
    const order = orders[0] as
      | { id: string; metadata?: Metadata | null; cart?: { metadata?: Metadata | null } | null }
      | undefined

    const method = order?.cart?.metadata?.payment_method
    if (!order || typeof method !== 'string' || !method) {
      return new StepResponse(null, null)
    }
    const previous = order.metadata ?? null
    if (previous?.payment_method === method) {
      return new StepResponse(null, null)
    }

    const orderService = container.resolve<IOrderModuleService>(Modules.ORDER)
    await orderService.updateOrders(order.id, {
      metadata: { ...(previous ?? {}), payment_method: method },
    })

    return new StepResponse({ payment_method: method }, { id: order.id, previous })
  },
  async (compensation, { container }) => {
    if (!compensation) return
    const orderService = container.resolve<IOrderModuleService>(Modules.ORDER)
    await orderService.updateOrders(compensation.id, {
      metadata: compensation.previous ?? {},
    })
  },
)
