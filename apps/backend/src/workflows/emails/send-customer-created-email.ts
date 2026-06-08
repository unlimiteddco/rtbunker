import { createWorkflow, WorkflowResponse, createStep, StepResponse } from '@medusajs/framework/workflows-sdk'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import type { INotificationModuleService } from '@medusajs/framework/types'

import { customerCreatedTemplate } from './templates'

export interface SendCustomerCreatedEmailInput {
  customer_id: string
}

const sendCustomerCreatedStep = createStep(
  'send-customer-created',
  async (input: SendCustomerCreatedEmailInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const notification = container.resolve<INotificationModuleService>(Modules.NOTIFICATION)

    const { data: customers } = await query.graph({
      entity: 'customer',
      fields: ['id', 'email', 'first_name'],
      filters: { id: input.customer_id },
    })

    const customer = customers[0]
    if (!customer?.email) return new StepResponse(null)

    const tpl = customerCreatedTemplate({
      email: customer.email,
      first_name: customer.first_name,
      storefront_url: process.env.STOREFRONT_URL ?? null,
    })

    const result = await notification.createNotifications({
      to: customer.email,
      channel: 'email',
      template: 'customer.created',
      data: { subject: tpl.subject, html: tpl.html },
    })

    return new StepResponse(result)
  },
)

export const sendCustomerCreatedEmailWorkflow = createWorkflow(
  'send-customer-created-email',
  (input: SendCustomerCreatedEmailInput) => {
    const result = sendCustomerCreatedStep(input)
    return new WorkflowResponse(result)
  },
)
