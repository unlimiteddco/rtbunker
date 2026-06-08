import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk'
import { Modules } from '@medusajs/framework/utils'
import type { INotificationModuleService } from '@medusajs/framework/types'

export interface SendEmailStepInput {
  to: string
  subject: string
  html: string
  text?: string
  /** Identificador lógico del template (sirve para logs y deduplicación). */
  template: string
}

/**
 * Step reutilizable que envía un email vía el módulo de notificaciones.
 * El provider concreto se decide por configuración (Resend en nuestro caso).
 */
export const sendEmailStep = createStep(
  'send-email',
  async (input: SendEmailStepInput, { container }) => {
    const notification = container.resolve<INotificationModuleService>(Modules.NOTIFICATION)

    const result = await notification.createNotifications({
      to: input.to,
      channel: 'email',
      template: input.template,
      data: {
        subject: input.subject,
        html: input.html,
        ...(input.text ? { text: input.text } : {}),
      },
    })

    return new StepResponse(result, result?.id)
  },
  // No hay rollback razonable para un email enviado.
  async () => {},
)
