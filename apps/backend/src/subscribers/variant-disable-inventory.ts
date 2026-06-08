import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { Modules } from '@medusajs/framework/utils'

/**
 * Por defecto en este negocio fabricamos bajo demanda, así que ninguna
 * variante debería gestionar stock. Este subscriber se dispara cada vez
 * que se crea una variante (desde el admin o vía API) y la marca como
 * `manage_inventory: false` + `allow_backorder: true` para asegurar que
 * siempre se pueda añadir al carrito.
 *
 * Idempotente: si ya viene con manage_inventory=false el update es no-op.
 * No escuchamos `product-variant.updated` para evitar loop.
 */
export default async function disableInventoryHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string } | { ids: string[] }>) {
  const ids = 'ids' in data ? data.ids : [data.id]
  if (ids.length === 0) return

  const productService = container.resolve(Modules.PRODUCT)
  for (const id of ids) {
    await productService.updateProductVariants(id, {
      manage_inventory: false,
      allow_backorder: true,
    })
  }
}

export const config: SubscriberConfig = {
  event: 'product-variant.created',
}
