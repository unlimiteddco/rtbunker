/**
 * Convierte productos exportados de Woo (output/products.json + variations.json)
 * al CSV que entiende el importador de Medusa Admin.
 *
 * Ejecutar después de `upload-media.ts` para que la columna `Image` apunte
 * ya a R2.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import type { MediaMapping, WooProduct, WooVariation } from './types.ts'

const OUT_DIR = join(import.meta.dirname, 'output')

const HEADERS = [
  'Product Id',
  'Product Handle',
  'Product Title',
  'Product Subtitle',
  'Product Description',
  'Product Status',
  'Product Thumbnail',
  'Product Weight',
  'Product Length',
  'Product Width',
  'Product Height',
  'Product Tags',
  'Product Categories',
  'Product Sales Channel 1',
  'Variant Title',
  'Variant SKU',
  'Variant Inventory Quantity',
  'Variant Allow Backorder',
  'Variant Manage Inventory',
  'Price EUR',
  'Option 1 Name',
  'Option 1 Value',
  'Option 2 Name',
  'Option 2 Value',
  'Option 3 Name',
  'Option 3 Value',
  'Image 1 Url',
  'Image 2 Url',
  'Image 3 Url',
] as const

function csvEscape(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return ''
  const s = String(value)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function mapMedia(url: string, mapping: Map<string, string>): string {
  return mapping.get(url) ?? url
}

async function main() {
  const products = JSON.parse(
    await readFile(join(OUT_DIR, 'products.json'), 'utf8'),
  ) as WooProduct[]
  const variations = JSON.parse(
    await readFile(join(OUT_DIR, 'variations.json'), 'utf8'),
  ) as Record<number, WooVariation[]>

  let mapping = new Map<string, string>()
  try {
    const m = JSON.parse(
      await readFile(join(OUT_DIR, 'media-mapping.json'), 'utf8'),
    ) as MediaMapping[]
    mapping = new Map(m.map((x) => [x.source, x.destination]))
  } catch {
    console.warn('⚠ no se encontró media-mapping.json — las URLs apuntarán a WordPress aún')
  }

  const channelId = process.env.TARGET_SALES_CHANNEL_ID
  if (!channelId) throw new Error('TARGET_SALES_CHANNEL_ID requerido')

  const rows: string[][] = [Array.from(HEADERS)]
  for (const p of products) {
    if (p.status !== 'publish') continue

    const baseRow = (variant?: WooVariation) => {
      const sku = variant?.sku ?? p.sku
      const price = variant?.price ?? p.regular_price ?? p.price
      const stock = variant ? variant.stock_quantity : p.stock_quantity
      const opts = variant?.attributes ?? []

      return [
        p.id,
        p.slug,
        p.name,
        p.short_description?.replace(/<[^>]+>/g, '').slice(0, 120),
        p.description,
        'published',
        mapMedia(p.images[0]?.src ?? '', mapping),
        p.weight,
        '',
        '',
        '',
        '',
        p.categories.map((c) => c.name).join(','),
        channelId,
        variant ? opts.map((a) => a.option).join(' / ') : 'Default',
        sku,
        stock ?? 0,
        'false',
        p.manage_stock ? 'true' : 'false',
        price,
        opts[0]?.name ?? '',
        opts[0]?.option ?? '',
        opts[1]?.name ?? '',
        opts[1]?.option ?? '',
        opts[2]?.name ?? '',
        opts[2]?.option ?? '',
        mapMedia(p.images[0]?.src ?? '', mapping),
        mapMedia(p.images[1]?.src ?? '', mapping),
        mapMedia(p.images[2]?.src ?? '', mapping),
      ].map((v) => csvEscape(v))
    }

    if (p.type === 'variable') {
      const vars = variations[p.id] ?? []
      for (const v of vars) rows.push(baseRow(v))
    } else {
      rows.push(baseRow())
    }
  }

  const csv = rows.map((r) => r.join(',')).join('\n')
  await writeFile(join(OUT_DIR, 'products-medusa.csv'), csv)
  console.info(`✓ ${rows.length - 1} filas → output/products-medusa.csv`)
}

main().catch((err) => {
  console.error('✗ transform falló:', err)
  process.exit(1)
})
