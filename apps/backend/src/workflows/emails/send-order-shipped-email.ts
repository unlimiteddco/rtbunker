import { createWorkflow, WorkflowResponse, createStep, StepResponse } from '@medusajs/framework/workflows-sdk'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import type { INotificationModuleService } from '@medusajs/framework/types'

import { orderShippedTemplate } from './templates'

export interface SendOrderShippedEmailInput {
  order_id: string
  fulfillment_id: string
}

const sendOrderShippedStep = createStep(
  'send-order-shipped',
  async (input: SendOrderShippedEmailInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const notification = container.resolve<INotificationModuleService>(Modules.NOTIFICATION)

    const { data: orders } = await query.graph({
      entity: 'order',
      fields: [
        'id',
        'display_id',
        'email',
        'fulfillments.id',
        'fulfillments.labels.tracking_number',
        'fulfillments.shipping_option.name',
      ],
      filters: { id: input.order_id },
    })

    const order = orders[0]
    if (!order?.email) return new StepResponse(null)

    const fulfillment = (order.fulfillments ?? []).find(
      (f: { id: string }) => f.id === input.fulfillment_id,
    )

    const tpl = orderShippedTemplate({
      display_id: order.display_id,
      tracking_numbers:
        fulfillment?.labels?.map((l: { tracking_number: string }) => l.tracking_number).filter(Boolean) ?? [],
      carrier: fulfillment?.shipping_option?.name,
    })

    const result = await notification.createNotifications({
      to: order.email,
      channel: 'email',
      template: 'order.shipped',
      data: { subject: tpl.subject, html: tpl.html },
    })

    return new StepResponse(result)
  },
)

export const sendOrderShippedEmailWorkflow = createWorkflow(
  'send-order-shipped-email',
  (input: SendOrderShippedEmailInput) => {
    const result = sendOrderShippedStep(input)
    return new WorkflowResponse(result)
  },
)
