import type { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { createProductCategoriesWorkflow } from '@medusajs/medusa/core-flows'

/**
 * Crea la categoría de producto "Pegatinas económicas" (handle
 * `pegatinas-economicas`): pegatinas sin laminar / mate, pensadas para
 * eventos donde prima el precio sobre la durabilidad.
 *
 * - is_active / is_internal: visible en tienda (aparecerá sola en el
 *   mega-menú; NO hay que tocar `lib/products.ts`).
 * - Idempotente: si ya existe el handle, sale sin tocar nada.
 *
 * SCRIPT MANUAL — no se ejecuta automáticamente.
 * Uso: `npx medusa exec ./src/scripts/seed-economic-stickers.ts`
 */
export default async function seedEconomicStickers({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const HANDLE = 'pegatinas-economicas'

  // ¿Existe ya?
  const { data: existing } = await query.graph({
    entity: 'product_category',
    fields: ['id', 'handle'],
    filters: { handle: HANDLE },
  })
  if (existing.length > 0) {
    logger.info(`[seed-economic-stickers] Ya existe (${existing[0].id}). Skip.`)
    return
  }

  const { result } = await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: [
        {
          name: 'Pegatinas económicas',
          handle: HANDLE,
          description:
            'Pegatinas económicas sin laminar (acabado mate), pensadas para eventos donde prima el precio sobre la durabilidad.',
          is_active: true,
          is_internal: false,
        },
      ],
    },
  })

  logger.info(`[seed-economic-stickers] Categoría creada: ${result[0]!.id} (${result[0]!.handle})`)
}
