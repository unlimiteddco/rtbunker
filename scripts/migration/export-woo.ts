/**
 * Exporta productos, variaciones, clientes y categorías de WooCommerce a JSON
 * en `output/`. Después de correrlo se puede transformar e importar offline,
 * sin volver a tocar WordPress.
 *
 * Requiere `WP_BASE_URL`, `WP_USERNAME`, `WP_APPLICATION_PASSWORD`.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { paginate, wooGet } from './woo-client.ts'
import type { WooCategory, WooCustomer, WooProduct, WooVariation } from './types.ts'

const OUT_DIR = join(import.meta.dirname, 'output')

async function exportEntity<T>(name: string, endpoint: string) {
  console.info(`▼ exportando ${name}…`)
  const all: T[] = []
  for await (const page of paginate<T>(endpoint)) {
    all.push(...page)
    process.stdout.write(`  ${all.length}\r`)
  }
  await writeFile(join(OUT_DIR, `${name}.json`), JSON.stringify(all, null, 2))
  console.info(`  ${name}: ${all.length} ítems → output/${name}.json`)
  return all
}

async function exportVariations(products: WooProduct[]) {
  console.info('▼ exportando variations…')
  const result: Record<number, WooVariation[]> = {}
  let total = 0
  for (const p of products.filter((p) => p.type === 'variable' && p.variations.length > 0)) {
    const variations = await wooGet<WooVariation[]>(
      `/products/${p.id}/variations?per_page=100`,
    )
    result[p.id] = variations
    total += variations.length
    process.stdout.write(`  ${total}\r`)
  }
  await writeFile(join(OUT_DIR, 'variations.json'), JSON.stringify(result, null, 2))
  console.info(`  variations: ${total} ítems → output/variations.json`)
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  await exportEntity<WooCategory>('categories', '/products/categories')
  const products = await exportEntity<WooProduct>('products', '/products')
  await exportVariations(products)
  await exportEntity<WooCustomer>('customers', '/customers')
  console.info('✓ export completado')
}

main().catch((err) => {
  console.error('✗ export falló:', err)
  process.exit(1)
})
