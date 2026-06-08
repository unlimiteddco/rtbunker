import type { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { createProductsWorkflow } from '@medusajs/medusa/core-flows'

/**
 * Crea el producto "esqueleto" `Pegatina Personalizada` que se usa como
 * variante destino cuando el configurador del storefront añade un pedido
 * custom al carrito.
 *
 * - 1 sola variante, sin inventario (allow_backorder, manage_inventory:false).
 * - precio nominal 0,01 € — el line item siempre override con `unit_price`
 *   del configurador (forma × material × tamaño × tier de unidades).
 * - status published para que aparezca por defecto en el sales channel.
 * - handle único `pegatina-personalizada` para poder buscarlo desde el
 *   endpoint `/store/custom-orders/cart`.
 *
 * Idempotente: si ya existe el handle, sale sin tocar nada.
 *
 * Uso: `npx medusa exec ./src/scripts/seed-personalizadas-product.ts`
 */
export default async function seedPersonalizadasProduct({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const channelService = container.resolve(Modules.SALES_CHANNEL)

  const HANDLE = 'pegatina-personalizada'

  // ¿Existe ya?
  const { data: existing } = await query.graph({
    entity: 'product',
    fields: ['id', 'handle'],
    filters: { handle: HANDLE },
  })
  if (existing.length > 0) {
    logger.info(`[seed-personalizadas] Ya existe (${existing[0].id}). Skip.`)
    return
  }

  const [channel] = await channelService.listSalesChannels({ name: 'Tienda Online' })
  if (!channel) {
    logger.error('[seed-personalizadas] Sales channel "Tienda Online" no encontrado. Corre `npm run seed` primero.')
    return
  }

  const { result } = await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: 'Pegatina Personalizada',
          handle: HANDLE,
          status: 'published',
          description:
            'Pedido personalizado creado desde el configurador. El precio real lo establece el line item según forma, material, tamaño y unidades.',
          sales_channels: [{ id: channel.id }],
          options: [{ title: 'Tipo', values: ['Custom'] }],
          variants: [
            {
              title: 'Custom',
              sku: 'pegatina-custom-base',
              manage_inventory: false,
              allow_backorder: true,
              prices: [{ amount: 0.01, currency_code: 'eur' }],
              options: { Tipo: 'Custom' },
            },
          ],
          metadata: { custom_request_base: true },
        },
      ],
    },
  })

  logger.info(`[seed-personalizadas] Creado producto ${result[0]!.id} con variant ${result[0]!.variants?.[0]?.id}`)
}
