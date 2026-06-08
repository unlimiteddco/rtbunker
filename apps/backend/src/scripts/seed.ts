import { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import {
  createApiKeysWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from '@medusajs/medusa/core-flows'

/**
 * Seed inicial:
 *  - regiones España (EUR), UE (EUR), Internacional (EUR)
 *  - sales channel "Tienda Online" (publishable key vinculada)
 *  - stock location por defecto
 *  - shipping profile por defecto
 *
 * Ejecutar: `npm run seed`
 */
export default async function seed({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const storeService = container.resolve(Modules.STORE)
  const channelService = container.resolve(Modules.SALES_CHANNEL)

  logger.info('— seed: iniciando')

  // ───── Sales Channel ────────────────────────────────────────────────
  let [storeChannel] = await channelService.listSalesChannels({ name: 'Tienda Online' })
  if (!storeChannel) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: { salesChannelsData: [{ name: 'Tienda Online' }] },
    })
    storeChannel = result[0]
    logger.info(`  · sales channel creado: ${storeChannel.id}`)
  } else {
    logger.info(`  · sales channel existente: ${storeChannel.id}`)
  }

  // ───── Store: default sales channel + currencies ────────────────────
  const [store] = await storeService.listStores()
  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        supported_currencies: [{ currency_code: 'eur', is_default: true }],
        default_sales_channel_id: storeChannel.id,
      },
    },
  })

  // ───── Regiones ─────────────────────────────────────────────────────
  const regionService = container.resolve(Modules.REGION)
  const existingRegions = await regionService.listRegions()
  const existingNames = new Set(existingRegions.map((r) => r.name))

  const regionsToCreate = [
    { name: 'España', currency_code: 'eur', countries: ['es'] },
    {
      name: 'UE',
      currency_code: 'eur',
      countries: [
        'fr', 'de', 'it', 'pt', 'nl', 'be', 'lu', 'ie', 'at', 'fi',
        'gr', 'pl', 'cz', 'sk', 'hu', 'ro', 'bg', 'hr', 'si', 'ee',
        'lv', 'lt', 'mt', 'cy', 'dk', 'se',
      ],
    },
    { name: 'Internacional', currency_code: 'eur', countries: ['gb', 'us', 'ch', 'no'] },
  ].filter((r) => !existingNames.has(r.name))

  if (regionsToCreate.length) {
    await createRegionsWorkflow(container).run({ input: { regions: regionsToCreate } })
    logger.info(`  · ${regionsToCreate.length} región(es) creada(s)`)
  } else {
    logger.info('  · regiones ya existen')
  }

  // ───── Stock location ───────────────────────────────────────────────
  const stockService = container.resolve(Modules.STOCK_LOCATION)
  let [warehouse] = await stockService.listStockLocations({ name: 'Almacén principal' })
  if (!warehouse) {
    const { result } = await createStockLocationsWorkflow(container).run({
      input: {
        locations: [
          {
            name: 'Almacén principal',
            address: {
              city: 'Madrid',
              country_code: 'es',
              address_1: '',
            },
          },
        ],
      },
    })
    warehouse = result[0]
    logger.info(`  · stock location creado: ${warehouse.id}`)

    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: { id: warehouse.id, add: [storeChannel.id] },
    })
  }

  // ───── Shipping profile por defecto ─────────────────────────────────
  const fulfillmentService = container.resolve(Modules.FULFILLMENT)
  const [shippingProfile] = await fulfillmentService.listShippingProfiles({
    name: 'Default Shipping Profile',
  })
  if (!shippingProfile) {
    await createShippingProfilesWorkflow(container).run({
      input: {
        data: [{ name: 'Default Shipping Profile', type: 'default' }],
      },
    })
    logger.info('  · shipping profile por defecto creado')
  }

  // ───── Tax regions ──────────────────────────────────────────────────
  await createTaxRegionsWorkflow(container).run({
    input: [
      { country_code: 'es', default_tax_rate: { name: 'IVA', code: 'iva', rate: 21 } },
    ],
  }).catch(() => {
    logger.info('  · tax regions ya existían')
  })

  // ───── Publishable API Key para el storefront ───────────────────────
  const apiKeyService = container.resolve(Modules.API_KEY)
  const [existingKey] = await apiKeyService.listApiKeys({ title: 'Storefront' })
  if (!existingKey) {
    const { result } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [{ title: 'Storefront', type: 'publishable', created_by: 'seed' }],
      },
    })
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: { id: result[0].id, add: [storeChannel.id] },
    })
    logger.info(`  · publishable key creada — copia este valor a NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY:`)
    logger.info(`      ${result[0].token}`)
  } else {
    logger.info(`  · publishable key existente: ${existingKey.token}`)
  }

  logger.info('— seed: completado')
}
