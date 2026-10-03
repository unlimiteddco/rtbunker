import { createWorkflow, transform, WorkflowResponse } from '@medusajs/framework/workflows-sdk'

import { sendEmailStep } from './steps/send-email'
import { adminPasswordResetTemplate } from './templates'

export interface SendAdminPasswordResetEmailInput {
  email: string
  token: string
}

/**
 * Dirección pública del panel. En producción el backend vive en
 * api.rtbunker.com; ADMIN_URL permite cambiarlo sin tocar código.
 */
const adminBase = () =>
  (
    process.env.ADMIN_URL ??
    process.env.MEDUSA_BACKEND_URL ??
    (process.env.NODE_ENV === 'production' ? 'https://api.rtbunker.com' : 'http://localhost:9000')
  ).replace(/\/+$/, '')

/**
 * Email con el enlace para elegir contraseña nueva del panel. Lo lanza el
 * subscriber de `auth.password_reset` cuando alguien usa "¿Olvidaste tu
 * contraseña?" en el login del panel.
 */
export const sendAdminPasswordResetEmailWorkflow = createWorkflow(
  'send-admin-password-reset-email',
  function (input: SendAdminPasswordResetEmailInput) {
    const email = transform({ input }, (data) => {
      const url = `${adminBase()}/app/reset-password?token=${encodeURIComponent(
        data.input.token,
      )}&email=${encodeURIComponent(data.input.email)}`
      const tpl = adminPasswordResetTemplate({ email: data.input.email, reset_url: url })
      return {
        to: data.input.email,
        subject: tpl.subject,
        html: tpl.html,
        template: 'admin.password-reset',
      }
    })

    const result = sendEmailStep(email)

    return new WorkflowResponse(result)
  },
)
