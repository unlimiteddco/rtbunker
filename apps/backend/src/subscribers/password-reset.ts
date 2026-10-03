import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { sendAdminPasswordResetEmailWorkflow } from '../workflows/emails/send-admin-password-reset-email'

/**
 * "¿Olvidaste tu contraseña?" del panel: Medusa genera el token y emite este
 * evento, pero no envía nada por sí mismo. Aquí mandamos el email con el
 * enlace para elegir una contraseña nueva.
 *
 * Solo usuarios del panel (`actor_type: 'user'`). La tienda todavía no tiene
 * página para que un cliente elija contraseña nueva (ver /login/recuperar),
 * así que para clientes no se envía nada.
 */
export default async function passwordResetHandler({
  event: { data },
  container,
}: SubscriberArgs<{ entity_id: string; actor_type: string; token: string }>) {
  if (data.actor_type !== 'user') {
    container
      .resolve(ContainerRegistrationKeys.LOGGER)
      .info(`[password-reset] solicitud de "${data.actor_type}" ignorada: no hay flujo en la tienda`)
    return
  }

  await sendAdminPasswordResetEmailWorkflow(container).run({
    input: { email: data.entity_id, token: data.token },
  })
}

export const config: SubscriberConfig = {
  event: 'auth.password_reset',
}
