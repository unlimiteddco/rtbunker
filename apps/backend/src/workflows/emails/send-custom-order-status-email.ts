import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from '@medusajs/framework/workflows-sdk'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import type { INotificationModuleService } from '@medusajs/framework/types'

import {
  customOrderDeliveredTemplate,
  customOrderInProductionTemplate,
  customOrderShippedTemplate,
} from './templates'

export interface SendCustomOrderStatusEmailInput {
  custom_order_id: string
  status: string
}

const NOTIFIED_STATUSES = new Set(['in_production', 'shipped', 'delivered'])

/**
 * Cuando cambia el status del pedido a uno notificable, manda un email
 * al cliente con la plantilla correspondiente. Para otros estados (proof_sent,
 * approved, awaiting_changes, cancelled, pending_review) no hace nada porque
 * o ya se notifican por otro canal o no aportan valor al cliente.
 */
const sendCustomOrderStatusEmailStep = createStep(
  'send-custom-order-status-email',
  async (input: SendCustomOrderStatusEmailInput, { container }) => {
    if (!NOTIFIED_STATUSES.has(input.status)) {
      return new StepResponse(null)
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const notification = container.resolve<INotificationModuleService>(Modules.NOTIFICATION)

    const { data } = await query.graph({
      entity: 'custom_order',
      fields: [
        'id',
        'customer_email',
        'customer_name',
        'tracking_number',
        'tracking_url',
        'shipping_carrier',
      ],
      filters: { id: input.custom_order_id },
    })

    const order = data?.[0]
    if (!order?.customer_email) return new StepResponse(null)

    const orderShortId = order.id.slice(-8).toUpperCase()

    let tpl: { subject: string; html: string }
    switch (input.status) {
      case 'in_production':
        tpl = customOrderInProductionTemplate({
          customer_name: order.customer_name,
          order_short_id: orderShortId,
        })
        break
      case 'shipped':
        tpl = customOrderShippedTemplate({
          customer_name: order.customer_name,
          order_short_id: orderShortId,
          tracking_number: order.tracking_number,
          tracking_url: order.tracking_url,
          shipping_carrier: order.shipping_carrier,
        })
        break
      case 'delivered':
        tpl = customOrderDeliveredTemplate({
          customer_name: order.customer_name,
          order_short_id: orderShortId,
        })
        break
      default:
        return new StepResponse(null)
    }

    const result = await notification.createNotifications({
      to: order.customer_email,
      channel: 'email',
      template: `custom_order.status.${input.status}`,
      data: { subject: tpl.subject, html: tpl.html },
    })

    return new StepResponse(result)
  },
)

export const sendCustomOrderStatusEmailWorkflow = createWorkflow(
  'send-custom-order-status-email',
  function (input: SendCustomOrderStatusEmailInput) {
    const result = sendCustomOrderStatusEmailStep(input)
    return new WorkflowResponse(result)
  },
)
