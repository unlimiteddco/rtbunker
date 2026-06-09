import { createWorkflow, WorkflowResponse, createStep, StepResponse } from '@medusajs/framework/workflows-sdk'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import type { INotificationModuleService } from '@medusajs/framework/types'

import { orderDeliveredTemplate } from './templates'

export interface SendOrderDeliveredEmailInput {
  fulfillment_id: string
}

const sendOrderDeliveredStep = createStep(
  'send-order-delivered',
  async (input: SendOrderDeliveredEmailInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const notification = container.resolve<INotificationModuleService>(Modules.NOTIFICATION)

    // El evento `delivery.created` solo trae el id de la fulfillment, así que
    // resolvemos el pedido a través de su enlace `order` con la fulfillment.
    const { data: fulfillments } = await query.graph({
      entity: 'fulfillment',
      fields: [
        'id',
        'order.id',
        'order.display_id',
        'order.email',
        'order.shipping_address.first_name',
        'order.shipping_address.last_name',
      ],
      filters: { id: input.fulfillment_id },
    })

    const order = fulfillments[0]?.order
    if (!order?.email) return new StepResponse(null)

    const sa = order.shipping_address
    const customerName = [sa?.first_name, sa?.last_name].filter(Boolean).join(' ') || null

    const tpl = orderDeliveredTemplate({
      display_id: order.display_id,
      customer_name: customerName,
      storefront_url: process.env.STOREFRONT_URL ?? null,
    })

    const result = await notification.createNotifications({
      to: order.email,
      channel: 'email',
      template: 'order.delivered',
      data: { subject: tpl.subject, html: tpl.html },
    })

    return new StepResponse(result)
  },
)

export const sendOrderDeliveredEmailWorkflow = createWorkflow(
  'send-order-delivered-email',
  (input: SendOrderDeliveredEmailInput) => {
    const result = sendOrderDeliveredStep(input)
    return new WorkflowResponse(result)
  },
)
