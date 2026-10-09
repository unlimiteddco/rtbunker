import type { CreateProductWorkflowInputDTO } from '@medusajs/framework/types'
import { MedusaError, Modules } from '@medusajs/framework/utils'
import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk'

/**
 * Entrada de la página "Publicar producto" (ver
 * `src/api/admin/quick-product/middlewares.ts`).
 */
export interface QuickProductInput {
  title: string
  description?: string | null
  category_ids?: string[]
  images?: string[]
  thumbnail?: string | null
  /** EUR tal cual (6.99 = 6,99 €). Medusa 2 NO guarda céntimos. */
  price: number
  /** Hasta 2 opciones simples. `prices` solo cuenta en la primera. */
  options?: { title: string; values: string[]; prices?: Record<string, number> }[]
  status?: 'published' | 'draft'
  custom_text?: {
    enabled: boolean
    label?: string | null
    placeholder?: string | null
    max?: number | null
    required?: boolean | null
  } | null
  /** Opciones que elige el cliente sin cambiar el precio (p. ej. la fuente). */
  custom_choices?: { label: string; options: string[]; required?: boolean }[] | null
}

// El producto más grande del catálogo tiene 285 variantes.
export const QUICK_PRODUCT_MAX_VARIANTS = 300
const CURRENCY = 'eur'
// Canal de venta del catálogo (el de la publishable key del storefront).
const FALLBACK_SALES_CHANNEL_NAME = 'Tienda Online'

/** "Pegatina Ñandú 12cm" → "pegatina-nandu-12cm" */
export function slugify(text: string): string {
  const slug = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '')
  return slug || 'producto'
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Texto plano → HTML: párrafos separados por línea en blanco, saltos → <br>. */
export function plainTextToHtml(text: string | null | undefined): string | undefined {
  const clean = (text ?? '').replace(/\r\n/g, '\n').trim()
  if (!clean) return undefined
  return clean
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

/** Producto cartesiano de las listas de valores. */
function combinations(lists: string[][]): string[][] {
  return lists.reduce<string[][]>(
    (acc, values) => acc.flatMap((combo) => values.map((v) => [...combo, v])),
    [[]],
  )
}

/**
 * Valida las reglas de negocio y construye el input de `createProductsWorkflow`
 * replicando cómo están montados los productos actuales del catálogo:
 *
 * - Canal de venta: el por defecto de la tienda ("Tienda Online", el mismo que
 *   la publishable key del storefront). Sin canal no se ve ni se puede comprar.
 * - Precios: 1 precio EUR por variante sin reglas → vale para las 3 regiones
 *   (España / UE / Internacional, todas en EUR).
 * - Variantes: manage_inventory false + allow_backorder true (fabricación bajo
 *   demanda), SKU `<handle>-v<n>` (o `<handle>-default` si no hay opciones).
 * - Sin opciones → opción "Default" / valor "Default" (como
 *   `pegatina-matricula-roja`).
 * - Perfil de envío: en Medusa 2.4 NO existe el link producto↔shipping
 *   profile (llegó en 2.5), así que no hay nada que asignar.
 */
export const prepareQuickProductStep = createStep(
  'prepare-quick-product',
  async (input: QuickProductInput, { container }) => {
    const productModule = container.resolve(Modules.PRODUCT)
    const storeModule = container.resolve(Modules.STORE)
    const salesChannelModule = container.resolve(Modules.SALES_CHANNEL)

    const title = input.title.trim()
    if (!title) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, 'El nombre es obligatorio.')
    }
    if (!(input.price > 0)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, 'El precio debe ser mayor que 0.')
    }

    // ── Opciones: limpiar, sin repetidos, límite de combinaciones ──────────
    const options = (input.options ?? [])
      .map((o) => ({
        title: o.title.trim(),
        values: o.values.map((v) => v.trim()).filter(Boolean),
        prices: o.prices ?? {},
      }))
      .filter((o) => o.title && o.values.length > 0)

    if (options.length > 2) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Máximo 2 opciones.')
    }
    const titlesLower = options.map((o) => o.title.toLowerCase())
    if (new Set(titlesLower).size !== titlesLower.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Las opciones deben tener nombres distintos.',
      )
    }
    for (const o of options) {
      const lower = o.values.map((v) => v.toLowerCase())
      if (new Set(lower).size !== lower.length) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Hay valores repetidos en «${o.title}».`,
        )
      }
    }
    if (options.slice(1).some((o) => Object.keys(o.prices).length > 0)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Solo la primera opción puede tener precio por valor.',
      )
    }
    const combos = combinations(options.map((o) => o.values))
    if (combos.length > QUICK_PRODUCT_MAX_VARIANTS) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Demasiadas combinaciones (${combos.length}). Máximo ${QUICK_PRODUCT_MAX_VARIANTS}.`,
      )
    }

    // Precio por valor de la primera opción (claves normalizadas con trim).
    const firstPrices = new Map<string, number>()
    for (const [k, v] of Object.entries(options[0]?.prices ?? {})) {
      if (!(v > 0)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `El precio de «${k}» debe ser mayor que 0.`,
        )
      }
      firstPrices.set(k.trim(), v)
    }

    // ── Categorías: deben existir ──────────────────────────────────────────
    const categoryIds = [...new Set(input.category_ids ?? [])]
    if (categoryIds.length > 0) {
      const found = await productModule.listProductCategories(
        { id: categoryIds },
        { select: ['id'] },
      )
      if (found.length !== categoryIds.length) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          'Alguna de las categorías elegidas ya no existe.',
        )
      }
    }

    // ── Canal de venta por defecto ─────────────────────────────────────────
    const [store] = await storeModule.listStores(
      {},
      { select: ['id', 'default_sales_channel_id'] },
    )
    let salesChannelId = store?.default_sales_channel_id ?? null
    if (!salesChannelId) {
      const [byName] = await salesChannelModule.listSalesChannels({
        name: FALLBACK_SALES_CHANNEL_NAME,
      })
      salesChannelId = byName?.id ?? null
    }
    if (!salesChannelId) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        'No hay canal de venta por defecto configurado en la tienda.',
      )
    }

    // ── Variantes (SKU depende del handle) ─────────────────────────────────
    const buildVariants = (handle: string) => {
      if (options.length === 0) {
        return [
          {
            title: 'Default',
            sku: `${handle}-default`,
            manage_inventory: false,
            allow_backorder: true,
            options: { Default: 'Default' },
            prices: [{ amount: input.price, currency_code: CURRENCY }],
          },
        ]
      }
      return combos.map((combo, i) => ({
        title: combo.join(' / '),
        sku: `${handle}-v${i + 1}`,
        manage_inventory: false,
        allow_backorder: true,
        options: Object.fromEntries(options.map((o, j) => [o.title, combo[j]])),
        prices: [
          {
            amount: firstPrices.get(combo[0]) ?? input.price,
            currency_code: CURRENCY,
          },
        ],
      }))
    }

    // ── Handle único (slug del título) sin choques de handle ni de SKU ─────
    const base = slugify(title)
    let handle: string | null = null
    for (let n = 1; n <= 50 && !handle; n++) {
      const candidate = n === 1 ? base : `${base}-${n}`
      const [byHandle] = await productModule.listProducts(
        { handle: candidate },
        { select: ['id'] },
      )
      if (byHandle) continue
      const skus = buildVariants(candidate).map((v) => v.sku)
      const bySku = await productModule.listProductVariants(
        { sku: skus },
        { select: ['id'], take: 1 },
      )
      if (bySku.length > 0) continue
      handle = candidate
    }
    if (!handle) {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        'No se pudo generar una URL única para este nombre. Prueba con otro nombre.',
      )
    }

    // ── Imágenes: la primera es la portada ─────────────────────────────────
    const images = [...new Set(input.images ?? [])]
    const thumbnail = input.thumbnail || images[0] || undefined

    // ── Metadata del campo de texto personalizado (contrato del storefront:
    //    apps/storefront/src/lib/custom-text.ts) ────────────────────────────
    let metadata: Record<string, unknown> | undefined
    const ct = input.custom_text
    if (ct?.enabled) {
      metadata = {
        custom_text_enabled: true,
        custom_text_label: ct.label?.trim() || 'Tu texto personalizado',
        custom_text_placeholder: ct.placeholder?.trim() || '',
        custom_text_max: ct.max ?? 30,
      }
      if (typeof ct.required === 'boolean') {
        metadata.custom_text_required = ct.required
      }
    }

    // ── Opciones a elegir (misma metadata que lee el storefront) ──────────
    const choices = (input.custom_choices ?? []).map((c) => {
      const options = [...new Set(c.options.map((o) => o.trim()).filter(Boolean))]
      return { label: c.label.trim(), options, required: c.required !== false }
    })
    const labels = choices.map((c) => c.label.toLowerCase())
    if (new Set(labels).size !== labels.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Hay dos opciones a elegir con el mismo nombre.',
      )
    }
    if (choices.some((c) => c.options.length < 2)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Cada opción a elegir necesita al menos dos valores distintos.',
      )
    }
    if (choices.length > 0) {
      metadata = { ...(metadata ?? {}), custom_choices: choices }
    }

    const product: CreateProductWorkflowInputDTO = {
      title,
      handle,
      description: plainTextToHtml(input.description),
      status: input.status ?? 'published',
      discountable: true,
      is_giftcard: false,
      thumbnail,
      images: images.map((url) => ({ url })),
      category_ids: categoryIds,
      sales_channels: [{ id: salesChannelId }],
      options:
        options.length > 0
          ? options.map((o) => ({ title: o.title, values: o.values }))
          : [{ title: 'Default', values: ['Default'] }],
      variants: buildVariants(handle),
      metadata,
    }

    return new StepResponse(product)
  },
)
