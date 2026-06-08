/**
 * Compara cuentas y muestra una muestra para validación manual:
 *  - productos en Woo vs productos en Medusa
 *  - clientes en Woo vs clientes en Medusa
 *  - 5 productos al azar con su precio en ambos sistemas
 */
import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import Medusa from '@medusajs/js-sdk'

import type { WooCustomer, WooProduct } from './types.ts'

const OUT_DIR = join(import.meta.dirname, 'output')

const sdk = new Medusa({
  baseUrl: process.env.MEDUSA_BACKEND_URL!,
  auth: { type: 'session' },
})

async function main() {
  await sdk.auth.login('user', 'emailpass', {
    email: process.env.MEDUSA_ADMIN_EMAIL!,
    password: process.env.MEDUSA_ADMIN_PASSWORD!,
  })

  const wooProducts = JSON.parse(
    await readFile(join(OUT_DIR, 'products.json'), 'utf8'),
  ) as WooProduct[]
  const wooCustomers = JSON.parse(
    await readFile(join(OUT_DIR, 'customers.json'), 'utf8'),
  ) as WooCustomer[]

  const { count: medusaProductCount } = await sdk.admin.product.list({ limit: 1 })
  const { count: medusaCustomerCount } = await sdk.admin.customer.list({ limit: 1 })

  console.info('— counts')
  console.info(`  productos:  Woo=${wooProducts.length}  Medusa=${medusaProductCount}`)
  console.info(`  clientes:   Woo=${wooCustomers.length}  Medusa=${medusaCustomerCount}`)

  console.info('\n— muestra (5 productos)')
  const sample = [...wooProducts].sort(() => 0.5 - Math.random()).slice(0, 5)
  for (const wp of sample) {
    const { products } = await sdk.admin.product.list({ handle: wp.slug, limit: 1 })
    const m = products[0]
    console.info(`  · ${wp.slug}`)
    console.info(`      Woo:    ${wp.name} — ${wp.regular_price}€`)
    console.info(`      Medusa: ${m?.title ?? '⚠ no encontrado'} — ${m?.variants?.[0]?.calculated_price?.calculated_amount ?? '?'}€`)
  }
}

main().catch((err) => {
  console.error('✗ verify falló:', err)
  process.exit(1)
})
