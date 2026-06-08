import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from '@medusajs/framework/workflows-sdk'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import type { INotificationModuleService } from '@medusajs/framework/types'

import { customOrderResponseTemplate } from './templates'

export interface SendCustomOrderResponseEmailInput {
  custom_order_id: string
}

const sendCustomOrderResponseEmailStep = createStep(
  'send-custom-order-response-email',
  async (input: SendCustomOrderResponseEmailInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const notification = container.resolve<INotificationModuleService>(Modules.NOTIFICATION)

    const { data } = await query.graph({
      entity: 'custom_order',
      fields: ['id', 'customer_email', 'customer_name', 'proofs'],
      filters: { id: input.custom_order_id },
    })

    const order = data?.[0]
    if (!order) return new StepResponse(null)

    const proofs = Array.isArray(order.proofs) ? order.proofs : []
    const latest = proofs[proofs.length - 1] as
      | {
          url?: string
          version?: number
          customer_response?: 'approved' | 'changes_requested' | null
          customer_response_notes?: string | null
        }
      | undefined

    if (!latest?.customer_response || !latest.url) {
      return new StepResponse(null)
    }

    const adminEmail =
      process.env.ADMIN_NOTIFICATION_EMAIL ?? process.env.RESEND_REPLY_TO
    if (!adminEmail) {
      return new StepResponse(null)
    }

    const adminBase = process.env.MEDUSA_BACKEND_URL ?? 'http://localhost:9000'
    const admin_url = `${adminBase}/app/custom-orders/${order.id}`

    const tpl = customOrderResponseTemplate({
      order_short_id: order.id.slice(-8).toUpperCase(),
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      decision: latest.customer_response,
      proof_version: latest.version ?? proofs.length,
      proof_url: latest.url,
      customer_response_notes: latest.customer_response_notes ?? null,
      admin_url,
    })

    const result = await notification.createNotifications({
      to: adminEmail,
      channel: 'email',
      template: 'custom_order.proof_responded',
      data: { subject: tpl.subject, html: tpl.html },
    })

    return new StepResponse(result)
  },
)

export const sendCustomOrderResponseEmailWorkflow = createWorkflow(
  'send-custom-order-response-email',
  function (input: SendCustomOrderResponseEmailInput) {
    const result = sendCustomOrderResponseEmailStep(input)
    return new WorkflowResponse(result)
  },
)
