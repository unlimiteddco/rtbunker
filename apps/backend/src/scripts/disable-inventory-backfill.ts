import { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

/**
 * Backfill: pone `manage_inventory: false` y `allow_backorder: true` en TODAS
 * las variantes existentes.
 *
 * Ejecutar una sola vez: `npx medusa exec ./src/scripts/disable-inventory-backfill.ts`
 */
export default async function disableInventoryBackfill({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const productService = container.resolve(Modules.PRODUCT)

  const variants = await productService.listProductVariants({}, { take: null })
  const toUpdate = variants.filter((v) => v.manage_inventory === true)

  if (toUpdate.length === 0) {
    logger.info('— backfill: no hay variantes que actualizar')
    return
  }

  for (const v of toUpdate) {
    await productService.updateProductVariants(v.id, {
      manage_inventory: false,
      allow_backorder: true,
    })
  }
  logger.info(`— backfill: ${toUpdate.length} variantes ajustadas a manage_inventory=false`)
}
