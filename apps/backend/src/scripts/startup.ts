import type { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import enableManualPayment from './enable-manual-payment'
import seedContentBlocks from './seed-content-blocks'
import seedSiteContent from './seed-site-content'

/**
 * Tareas de arranque del backend en producción (ver apps/backend/Dockerfile):
 * se ejecutan en CADA despliegue, después de las migraciones y antes de
 * levantar el servidor. Todas son idempotentes y ninguna puede impedir el
 * arranque: si una falla, se registra y se sigue con la siguiente.
 *
 *   1. Pago manual (transferencia) habilitado en todas las regiones.
 *   2. Contenido web inicial: servicios, proceso y categorías de la home.
 *   3. Piezas de contenido: marcas, tipos de personalizada, colores, paneles.
 *
 * Van juntas en un solo script porque cada `medusa exec` arranca la aplicación
 * entera: tres ejecuciones separadas triplicarían el tiempo de despliegue.
 */
export default async function startup(args: ExecArgs) {
  const logger = args.container.resolve(ContainerRegistrationKeys.LOGGER)

  const tasks: [string, (a: ExecArgs) => Promise<void>][] = [
    ['enable-manual-payment', enableManualPayment],
    ['seed-site-content', seedSiteContent],
    ['seed-content-blocks', seedContentBlocks],
  ]

  for (const [name, task] of tasks) {
    try {
      await task(args)
    } catch (error) {
      logger.error(`[startup] ${name} falló; se continúa. ${(error as Error)?.message ?? error}`)
    }
  }
}
