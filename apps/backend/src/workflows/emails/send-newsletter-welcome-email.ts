import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from '@medusajs/framework/workflows-sdk'
import { Modules } from '@medusajs/framework/utils'
import type { INotificationModuleService } from '@medusajs/framework/types'

import { newsletterWelcomeTemplate } from './templates'

export interface SendNewsletterWelcomeEmailInput {
  email: string
  coupon_code: string
}

const sendNewsletterWelcomeEmailStep = createStep(
  'send-newsletter-welcome-email',
  async (input: SendNewsletterWelcomeEmailInput, { container }) => {
    const notification = container.resolve<INotificationModuleService>(Modules.NOTIFICATION)

    const tpl = newsletterWelcomeTemplate({
      email: input.email,
      coupon_code: input.coupon_code,
      storefront_url: process.env.STOREFRONT_URL ?? null,
    })

    const result = await notification.createNotifications({
      to: input.email,
      channel: 'email',
      template: 'newsletter.welcome',
      data: { subject: tpl.subject, html: tpl.html },
    })

    return new StepResponse(result)
  },
)

export const sendNewsletterWelcomeEmailWorkflow = createWorkflow(
  'send-newsletter-welcome-email',
  function (input: SendNewsletterWelcomeEmailInput) {
    const result = sendNewsletterWelcomeEmailStep(input)
    return new WorkflowResponse(result)
  },
)
