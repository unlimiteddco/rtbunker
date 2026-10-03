import type { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

/**
 * Cambia la contraseña de un usuario del panel de administración.
 *
 * Medusa no trae un comando para esto (y el "¿Olvidaste tu contraseña?" del
 * login necesita un email de recuperación), así que se hace con este script
 * desde el terminal del backend. La contraseña NO va en el código: se pasa al
 * ejecutarlo.
 *
 * Uso (en producción el archivo compilado es .js):
 *   npx medusa exec ./src/scripts/set-admin-password.js email@dominio.com 'NuevaContraseña'
 * En local:
 *   npx medusa exec ./src/scripts/set-admin-password.ts email@dominio.com 'NuevaContraseña'
 */
export default async function setAdminPassword({ container, args }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const userService = container.resolve(Modules.USER)
  const authService = container.resolve(Modules.AUTH)

  const email = (args?.[0] ?? '').trim().toLowerCase()
  const password = args?.[1] ?? ''

  if (!email || !password) {
    logger.error(
      "Faltan datos. Uso: medusa exec ./src/scripts/set-admin-password.js email 'NuevaContraseña'",
    )
    return
  }
  if (password.length < 10) {
    logger.error('La contraseña debe tener al menos 10 caracteres. No se ha cambiado nada.')
    return
  }

  // Solo usuarios del panel: así no se toca por error la cuenta de un cliente.
  const [user] = await userService.listUsers({ email }, { take: 1 })
  if (!user) {
    logger.error(`No existe ningún usuario del panel con el email ${email}. No se ha cambiado nada.`)
    return
  }

  const { success, error } = await authService.updateProvider('emailpass', {
    entity_id: email,
    password,
  })

  if (!success) {
    logger.error(`No se pudo cambiar la contraseña de ${email}: ${error ?? 'error desconocido'}`)
    return
  }

  logger.info(`Contraseña actualizada para ${email}. Ya se puede entrar al panel con la nueva.`)
}
