/**
 * Importa productos Woo a Medusa vía Admin API.
 *
 * Usamos fetch directo con Bearer JWT en lugar del SDK porque @medusajs/js-sdk
 * 2.4.0 no auto-propaga el token tras login.
 *
 * Idempotente: salta si el handle ya existe.
 */
import 'dotenv/config'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import pLimit from 'p-limit'

import type { MediaMapping, WooProduct, WooVariation } from './types.ts'

const OUT_DIR = join(import.meta.dirname, 'output')
const CONCURRENCY = 3
const BASE = process.env.MEDUSA_BACKEND_URL ?? 'http://localhost:9000'

let TOKEN = ''

interface ImportReport {
  imported: { wpId: number; slug: string; medusaId: string }[]
  skipped: { wpId: number; slug: string; reason: string }[]
  failed: { wpId: number; slug: string; error: string }[]
}

async function adminFetch<T = unknown>(
  path: string,
  init: RequestInit & { query?: Record<string, string | number | undefined> } = {},
): Promise<T> {
  const url = new URL(`${BASE}${path}`)
  for (const [k, v] of Object.entries(init.query ?? {})) {
    if (v !== undefined) url.searchParams.set(k, String(v))
  }
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${init.method ?? 'GET'} ${path} ${res.status}: ${body.slice(0, 200)}`)
  }
  if (res.status === 204) return {} as T
  return res.json() as Promise<T>
}

async function login() {
  const res = await fetch(`${BASE}/auth/user/emailpass`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: process.env.MEDUSA_ADMIN_EMAIL,
      password: process.env.MEDUSA_ADMIN_PASSWORD,
    }),
  })
  if (!res.ok) throw new Error(`login failed: ${res.status} ${await res.text()}`)
  const { token } = (await res.json()) as { token: string }
  TOKEN = token
}

async function resolveSalesChannel(): Promise<string> {
  const data = await adminFetch<{ sales_channels: { id: string; name: string }[] }>(
    '/admin/sales-channels',
    { query: { name: 'Tienda Online' } },
  )
  const channel = data.sales_channels[0]
  if (!channel) {
    throw new Error(
      'No existe sales channel "Tienda Online" en Medusa. Corre el seed: cd apps/backend && npm run seed',
    )
  }
  return channel.id
}

async function findOrCreateCategory(
  name: string,
  handle: string,
): Promise<string> {
  const search = await adminFetch<{
    product_categories: { id: string; handle: string }[]
  }>('/admin/product-categories', { query: { handle } })
  if (search.product_categories[0]) return search.product_categories[0].id

  const created = await adminFetch<{ product_category: { id: string } }>(
    '/admin/product-categories',
    {
      method: 'POST',
      body: JSON.stringify({ name, handle, is_active: true }),
    },
  )
  return created.product_category.id
}

async function syncCategories(products: WooProduct[]): Promise<Map<number, string>> {
  const out = new Map<number, string>()
  const seen = new Map<string, { name: string; wpId: number }>()
  for (const p of products) {
    for (const c of p.categories ?? []) {
      if (!seen.has(c.slug)) seen.set(c.slug, { name: c.name, wpId: c.id })
    }
  }
  for (const [handle, info] of seen) {
    const id = await findOrCreateCategory(info.name, handle)
    out.set(info.wpId, id)
  }
  console.info(`  · ${out.size} categorías sincronizadas`)
  return out
}

function priceOf(v: {
  sale_price?: string | number
  regular_price?: string | number
  price?: string | number
}): number {
  const raw = v.sale_price || v.regular_price || v.price
  if (raw === undefined || raw === '' || raw === null) return 0
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw))
  return Number.isFinite(n) ? n : 0
}

function mapUrl(src: string, mapping: Map<string, string>): string {
  return mapping.get(src) ?? src
}

function variantKey(attrs: { name: string; option: string }[]): string {
  return attrs
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((a) => `${a.name}=${a.option}`)
    .join('|')
}

function buildPayload(
  p: WooProduct,
  variations: WooVariation[],
  categoryMap: Map<number, string>,
  mediaMap: Map<string, string>,
  salesChannelId: string,
) {
  const images = (p.images ?? [])
    .map((img) => ({ url: mapUrl(img.src, mediaMap) }))
    .filter((x) => Boolean(x.url))
  const thumbnail = images[0]?.url

  const categories = (p.categories ?? [])
    .map((c) => categoryMap.get(c.id))
    .filter((id): id is string => Boolean(id))
    .map((id) => ({ id }))

  const subtitle = p.short_description
    ? p.short_description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200)
    : undefined

  // Las "options" de la variante deben ser los atributos que REALMENTE
  // varían entre las variations. Woo permite declarar atributos como "para
  // variación" pero sin generar combinaciones; si todas las variations
  // comparten el mismo valor de un atributo, ese atributo NO genera variante
  // y lo movemos a metadata para no romper el matching en el storefront.
  const variationAttrNames = new Set<string>()
  for (const v of variations) for (const a of v.attributes ?? []) variationAttrNames.add(a.name)

  // Para cada attr que aparece en al menos una variation, recogemos:
  //  - los valores presentes en las variations (puede ser 1 o varios)
  //  - los valores declarados en p.attributes (puede haber más opciones que
  //    nunca se usaron como variation, ej. colores ofrecidos sin precio propio)
  const allAttrValues = new Map<string, Set<string>>()
  for (const name of variationAttrNames) {
    const values = new Set<string>()
    for (const v of variations) {
      const a = (v.attributes ?? []).find((x) => x.name === name)
      if (a) values.add(a.option)
    }
    const declared = (p.attributes ?? []).find((a) => a.name === name)
    if (declared?.options) for (const v of declared.options) values.add(v)
    allAttrValues.set(name, values)
  }

  // Filtramos para options reales: o el attr tiene >1 valor en variations,
  // o se reconoce como "Color"/"Acabado especial" (sirven para selección UX
  // aunque cada uno solo aporte una variation en Woo).
  const optionAttrs = [...allAttrValues.entries()]
    .filter(([name, values]) => {
      if (values.size > 1) return true
      return /^color|acabado/i.test(name)
    })
    .map(([name, values]) => ({ name, options: [...values] }))

  // Detección del patrón de catálogo del cliente:
  // Color + Acabado especial son MUTUAMENTE EXCLUYENTES. El cliente Woo modeló
  // dos "ramas" de variations por tamaño:
  //   · (Color=X, Acabado=Ninguno)   → precio "rama color"
  //   · (Color=ninguno, Acabado=Y)   → precio "rama acabado"
  // Las fusionamos en una sola option "Estilo" para que sea natural elegir UNA
  // sola en la PDP (el storefront luego las muestra en 2 grupos visuales).
  const colorAttr = optionAttrs.find((a) => /^color/i.test(a.name))
  const finishAttr = optionAttrs.find((a) => /acabado/i.test(a.name))
  const mergesStyle = Boolean(colorAttr && finishAttr)

  let finalOptionAttrs = optionAttrs
  let styleValues: string[] = []

  if (mergesStyle) {
    const colors = (colorAttr!.options ?? []).filter(
      (v) => v.toLowerCase() !== 'ninguno',
    )
    const finishes = (finishAttr!.options ?? []).filter(
      (v) => v.toLowerCase() !== 'ninguno',
    )
    // Antes incluíamos 'Ninguno' como fallback "sin color y sin acabado",
    // pero el cliente no lo vende como tal — siempre hay color o acabado.
    styleValues = [...colors, ...finishes]
    finalOptionAttrs = [
      { name: 'Estilo', options: styleValues },
      ...optionAttrs.filter((a) => a !== colorAttr && a !== finishAttr),
    ]
  }

  const isVariable =
    p.type === 'variable' && finalOptionAttrs.length > 0 && variations.length > 0

  if (isVariable) {
    const options = finalOptionAttrs.map((a) => ({ title: a.name, values: a.options }))

    // Genera el set de variantes expandiendo las "ramas" Woo en su combinatoria
    // de Estilo correspondiente. Cada (Estilo, Tamaño_otra_opcion) se crea
    // una sola vez, primera ocurrencia gana.
    type V = {
      title: string
      sku: string
      manage_inventory: false
      allow_backorder: true
      prices: { amount: number; currency_code: string }[]
      options: Record<string, string>
      metadata?: { woo_sku?: string; woo_branch?: string }
    }

    const buildKey = (opts: Record<string, string>) =>
      Object.keys(opts)
        .sort()
        .map((k) => `${k}=${opts[k]}`)
        .join('|')

    const seen = new Set<string>()
    const variants: V[] = []
    let counter = 0
    const otherAttrs = finalOptionAttrs.filter((a) => a.name !== 'Estilo')

    function addVariant(opts: Record<string, string>, price: number, wooSku?: string, branch?: string) {
      const key = buildKey(opts)
      if (seen.has(key)) return
      seen.add(key)
      counter += 1
      variants.push({
        title: finalOptionAttrs.map((a) => opts[a.name]).join(' / '),
        sku: `${p.slug}-v${counter}`,
        manage_inventory: false,
        allow_backorder: true,
        prices: [{ amount: price, currency_code: 'eur' }],
        options: opts,
        metadata: wooSku || branch ? { woo_sku: wooSku, woo_branch: branch } : undefined,
      })
    }

    // Si hay Estilo combinado: clasificar las variations Woo en dos pasadas.
    //
    // Convención del catálogo Woo:
    //   · variation con `Color=ninguno`        → rama ACABADO ESPECIAL
    //     (el cliente no elige color, solo acabado → precio aplica a los acabados)
    //   · variation con `Acabado especial=Ninguno` → rama COLOR SÓLIDO
    //     (el cliente no elige acabado, solo color → precio aplica a los colores
    //      + a "Ninguno" como fallback "sin nada")
    //
    // Procesamos primero la rama COLOR (genera más variantes, incluida Ninguno)
    // y luego la rama ACABADO. addVariant ignora si la clave ya existe.

    function classifyBranch(v: WooVariation): 'color' | 'finish' | 'other' {
      const a: Record<string, string> = {}
      for (const x of v.attributes ?? []) a[x.name] = x.option
      const c = colorAttr ? a[colorAttr.name] : undefined
      const f = finishAttr ? a[finishAttr.name] : undefined
      if (f?.toLowerCase() === 'ninguno') return 'color'
      if (c?.toLowerCase() === 'ninguno') return 'finish'
      return 'other'
    }

    const otherOptsOf = (v: WooVariation): Record<string, string> => {
      const wooAttrs: Record<string, string> = {}
      for (const a of v.attributes ?? []) wooAttrs[a.name] = a.option
      const out: Record<string, string> = {}
      for (const a of otherAttrs) out[a.name] = wooAttrs[a.name] ?? a.options[0]
      return out
    }

    for (const v of variations) {
      const wooAttrs: Record<string, string> = {}
      for (const a of v.attributes ?? []) wooAttrs[a.name] = a.option
      const price = priceOf(v)

      if (mergesStyle) {
        const branch = classifyBranch(v)
        const otherOpts = otherOptsOf(v)

        if (branch === 'color') {
          // Precio de los colores sólidos. No generamos variante "Ninguno"
          // — el cliente siempre vende con un color o un acabado.
          const colors = (colorAttr!.options ?? []).filter(
            (c) => c.toLowerCase() !== 'ninguno',
          )
          for (const style of colors) {
            addVariant({ Estilo: style, ...otherOpts }, price, v.sku, 'color')
          }
        } else if (branch === 'finish') {
          // Precio de los acabados especiales.
          const finishes = (finishAttr!.options ?? []).filter(
            (f) => f.toLowerCase() !== 'ninguno',
          )
          for (const style of finishes) {
            addVariant({ Estilo: style, ...otherOpts }, price, v.sku, 'acabado')
          }
        } else {
          // Variation con valores específicos en ambos atributos (raro). La
          // creamos tal cual con su par color/acabado como Estilo de la finish.
          const colorVal = wooAttrs[colorAttr!.name]
          const finishVal = wooAttrs[finishAttr!.name]
          const stylePicked = finishVal && finishVal.toLowerCase() !== 'ninguno'
            ? finishVal
            : (colorVal ?? 'Ninguno')
          addVariant({ Estilo: stylePicked, ...otherOpts }, price, v.sku, 'mixto')
        }
      } else {
        // Camino estándar: usar los attrs reales tal cual.
        const opts: Record<string, string> = {}
        for (const a of finalOptionAttrs) {
          const incoming = wooAttrs[a.name]
          opts[a.name] = incoming ?? a.options[0]
        }
        addVariant(opts, price, v.sku)
      }
    }

    return {
      title: p.name,
      handle: p.slug,
      description: p.description || undefined,
      subtitle,
      status: 'published',
      thumbnail,
      images,
      categories,
      sales_channels: [{ id: salesChannelId }],
      options,
      variants,
      weight: p.weight ? parseFloat(p.weight) || undefined : undefined,
    }
  }

  return {
    title: p.name,
    handle: p.slug,
    description: p.description || undefined,
    subtitle,
    status: 'published',
    thumbnail,
    images,
    categories,
    sales_channels: [{ id: salesChannelId }],
    options: [{ title: 'Default', values: ['Default'] }],
    variants: [
      {
        title: 'Default',
        sku: `${p.slug}-default`,
        manage_inventory: false,
        allow_backorder: true,
        prices: [{ amount: priceOf(p), currency_code: 'eur' }],
        options: { Default: 'Default' },
        metadata: p.sku ? { woo_sku: p.sku } : undefined,
      },
    ],
    weight: p.weight ? parseFloat(p.weight) || undefined : undefined,
  }
}

async function importOne(
  p: WooProduct,
  variations: WooVariation[],
  categoryMap: Map<number, string>,
  mediaMap: Map<string, string>,
  salesChannelId: string,
  report: ImportReport,
) {
  try {
    if (p.status !== 'publish') {
      report.skipped.push({ wpId: p.id, slug: p.slug, reason: `status=${p.status}` })
      return
    }
    if (p.type !== 'simple' && p.type !== 'variable') {
      report.skipped.push({ wpId: p.id, slug: p.slug, reason: `type=${p.type}` })
      return
    }

    const exists = await adminFetch<{ products: { id: string }[] }>('/admin/products', {
      query: { handle: p.slug, limit: 1 },
    })
    if (exists.products[0]) {
      report.skipped.push({ wpId: p.id, slug: p.slug, reason: 'already exists' })
      return
    }

    const payload = buildPayload(p, variations, categoryMap, mediaMap, salesChannelId)
    const created = await adminFetch<{ product: { id: string } }>('/admin/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    report.imported.push({ wpId: p.id, slug: p.slug, medusaId: created.product.id })
  } catch (err) {
    report.failed.push({
      wpId: p.id,
      slug: p.slug,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

async function main() {
  await login()
  console.info('— login OK')

  const salesChannelId = await resolveSalesChannel()
  console.info(`— sales channel: ${salesChannelId}`)

  const products = JSON.parse(
    await readFile(join(OUT_DIR, 'products.json'), 'utf8'),
  ) as WooProduct[]
  const variations = JSON.parse(
    await readFile(join(OUT_DIR, 'variations.json'), 'utf8'),
  ) as Record<number, WooVariation[]>

  let mediaMap = new Map<string, string>()
  try {
    const arr = JSON.parse(
      await readFile(join(OUT_DIR, 'media-mapping.json'), 'utf8'),
    ) as MediaMapping[]
    mediaMap = new Map(arr.map((x) => [x.source, x.destination]))
    console.info(`— media-mapping: ${mediaMap.size} URLs`)
  } catch {
    console.warn('⚠ sin output/media-mapping.json — usando URLs Woo')
  }

  const categoryMap = await syncCategories(products)

  const report: ImportReport = { imported: [], skipped: [], failed: [] }
  const limit = pLimit(CONCURRENCY)
  let done = 0

  await Promise.all(
    products.map((p) =>
      limit(async () => {
        await importOne(
          p,
          variations[p.id] ?? [],
          categoryMap,
          mediaMap,
          salesChannelId,
          report,
        )
        done += 1
        process.stdout.write(`  ${done}/${products.length}\r`)
      }),
    ),
  )

  await writeFile(join(OUT_DIR, 'import-report.json'), JSON.stringify(report, null, 2))
  console.info(
    `\n✓ import: ${report.imported.length} creados · ${report.skipped.length} saltados · ${report.failed.length} fallidos`,
  )
  if (report.failed.length > 0) {
    console.warn('  primeros 5 fallos:')
    for (const f of report.failed.slice(0, 5)) console.warn(`    · ${f.slug}: ${f.error}`)
  }
}

main().catch((err) => {
  console.error('✗ import-products falló:', err)
  process.exit(1)
})
