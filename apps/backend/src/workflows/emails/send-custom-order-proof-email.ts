import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from '@medusajs/framework/workflows-sdk'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import type { INotificationModuleService } from '@medusajs/framework/types'

import { customOrderProofSentTemplate } from './templates'

export interface SendCustomOrderProofEmailInput {
  custom_order_id: string
}

const sendCustomOrderProofEmailStep = createStep(
  'send-custom-order-proof-email',
  async (input: SendCustomOrderProofEmailInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const notification = container.resolve<INotificationModuleService>(Modules.NOTIFICATION)

    const { data } = await query.graph({
      entity: 'custom_order',
      fields: [
        'id',
        'customer_email',
        'customer_name',
        'proofs',
        'magic_token',
      ],
      filters: { id: input.custom_order_id },
    })

    const order = data?.[0]
    if (!order?.customer_email) {
      return new StepResponse(null)
    }

    const proofs = Array.isArray(order.proofs) ? order.proofs : []
    const latest = proofs[proofs.length - 1] as
      | {
          url?: string
          version?: number
          admin_notes?: string | null
        }
      | undefined

    if (!latest?.url) {
      return new StepResponse(null)
    }

    const storefrontBase = process.env.STOREFRONT_URL ?? process.env.NEXT_PUBLIC_BASE_URL
    const approval_url =
      storefrontBase && order.magic_token
        ? `${storefrontBase}/personalizadas/aprobar/${order.id}?token=${order.magic_token}`
        : null

    const tpl = customOrderProofSentTemplate({
      customer_name: order.customer_name,
      order_short_id: order.id.slice(-8).toUpperCase(),
      proof_url: latest.url,
      proof_version: latest.version ?? proofs.length,
      admin_notes: latest.admin_notes ?? null,
      approval_url,
    })

    const result = await notification.createNotifications({
      to: order.customer_email,
      channel: 'email',
      template: 'custom_order.proof_sent',
      data: { subject: tpl.subject, html: tpl.html },
    })

    return new StepResponse(result)
  },
)

export const sendCustomOrderProofEmailWorkflow = createWorkflow(
  'send-custom-order-proof-email',
  function (input: SendCustomOrderProofEmailInput) {
    const result = sendCustomOrderProofEmailStep(input)
    return new WorkflowResponse(result)
  },
)
