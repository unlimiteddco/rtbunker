import type { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { createCartWorkflow } from '@medusajs/medusa/core-flows'

/**
 * Valida que un cliente en el customer group de un tier recibe la promoción
 * automática de socio en su carrito. Uso:
 *   npx medusa exec ./src/scripts/validate-member-discount.ts
 */
export default async function validate({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const customerService = container.resolve(Modules.CUSTOMER)

  // Región EUR
  const { data: regions } = await query.graph({
    entity: 'region',
    fields: ['id', 'currency_code'],
  })
  const region = regions.find((r: any) => r.currency_code === 'eur') ?? regions[0]
  if (!region) return logger.error('[validate] no hay región')

  // Un sales channel
  const { data: channels } = await query.graph({
    entity: 'sales_channel',
    fields: ['id', 'name'],
  })
  const channel = channels[0]
  if (!channel) return logger.error('[validate] no hay sales channel')

  // Una variante de un producto publicado
  const { data: products } = await query.graph({
    entity: 'product',
    fields: ['id', 'title', 'status', 'variants.id', 'variants.title'],
    filters: { status: 'published' } as any,
    pagination: { skip: 0, take: 10 },
  })
  const prodWithVariant = (products as any[]).find((p) => p.variants?.[0]?.id)
  const variant = prodWithVariant?.variants?.[0]
  if (!variant) return logger.error('[validate] no hay variante')

  // Grupo Plata
  const groups = await customerService.listCustomerGroups({}, { take: 1000 })
  const plata = (groups as any[]).find((g) => (g.metadata as any)?.membership_tier === 'plata')
  if (!plata) return logger.error('[validate] no existe el grupo Plata (corre setup-memberships)')

  // Cliente de prueba en el grupo Plata
  const email = `club-validate-${Date.now()}@rtbunker.test`
  const [customer] = await customerService.createCustomers([
    { email, first_name: 'Validate', last_name: 'Club' },
  ])
  await customerService.addCustomerToGroup({
    customer_id: customer.id,
    customer_group_id: plata.id,
  })
  logger.info(`[validate] cliente ${email} añadido al grupo Plata`)

  // Carrito con ese cliente
  const { result: cart } = await createCartWorkflow(container).run({
    input: {
      region_id: region.id,
      sales_channel_id: channel.id,
      customer_id: customer.id,
      currency_code: 'eur',
      items: [{ variant_id: variant.id, quantity: 2 }],
    } as any,
  })

  const { data: carts } = await query.graph({
    entity: 'cart',
    fields: [
      'id',
      'item_subtotal',
      'discount_total',
      'total',
      'promotions.code',
      'promotions.is_automatic',
    ],
    filters: { id: cart.id },
  })
  const c = carts[0] as any
  logger.info('═══════════════════════════════════════════')
  logger.info(`[validate] subtotal:       ${c.item_subtotal}`)
  logger.info(`[validate] discount_total: ${c.discount_total}`)
  logger.info(`[validate] total:          ${c.total}`)
  logger.info(`[validate] promociones:    ${JSON.stringify(c.promotions)}`)
  if (c.discount_total > 0) {
    logger.info('[validate] ✅ DESCUENTO DE SOCIO APLICADO')
  } else {
    logger.warn('[validate] ⚠ sin descuento — revisar reglas/automatic')
  }
  logger.info('═══════════════════════════════════════════')

  // Limpieza del cliente de prueba
  await customerService.deleteCustomers([customer.id])
}
