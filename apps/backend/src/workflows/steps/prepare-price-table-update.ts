import { createStep, StepResponse } from '@medusajs/framework/workflows-sdk'
import { ContainerRegistrationKeys, MedusaError } from '@medusajs/framework/utils'

import {
  basePrice,
  PRICE_TABLE_CURRENCY,
  PRICE_TABLE_PRODUCT_FIELDS,
  variantCoordinates,
  type PriceTablePrice,
  type PriceTableProduct,
} from '../../lib/price-table'

export interface PriceTableCellChange {
  /** Valor de la fila (tamaño). null = todas las filas. */
  row: string | null
  /** Valores de columna (colores) a los que afecta. null = todos. */
  cols: string[] | null
  /** Precio nuevo en EUR, tal cual (5.99 = 5,99 €). */
  amount: number
}

export interface UpdatePriceTableInput {
  product_ids: string[]
  cells: PriceTableCellChange[]
}

type VariantPriceUpdate = {
  id: string
  prices: {
    id?: string
    amount: number
    currency_code: string
    min_quantity?: number | null
    max_quantity?: number | null
    rules?: Record<string, string>
  }[]
}

/** Reenvía un precio que NO cambia, conservando sus tramos y reglas. */
const keepPrice = (p: PriceTablePrice) => ({
  id: p.id,
  amount: Number(p.amount),
  currency_code: p.currency_code,
  ...(p.min_quantity != null ? { min_quantity: Number(p.min_quantity) } : {}),
  ...(p.max_quantity != null ? { max_quantity: Number(p.max_quantity) } : {}),
  ...(p.price_rules?.length
    ? { rules: Object.fromEntries(p.price_rules.map((r) => [r.attribute, r.value])) }
    : {}),
})

/**
 * Traduce "el tamaño 20cm de los colores estándar pasa a 6,50 €" a la lista de
 * variantes (con TODOS sus precios) que hay que enviar a
 * `updateProductVariantsWorkflow`. Solo lee: el guardado y su rollback los
 * hace el workflow nativo.
 *
 * Se envían todos los precios de cada variante —no solo el que cambia— porque
 * el workflow nativo sustituye el conjunto entero: los omitidos se borrarían.
 */
export const preparePriceTableUpdateStep = createStep(
  'prepare-price-table-update',
  async (input: UpdatePriceTableInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data } = await query.graph({
      entity: 'product',
      fields: PRICE_TABLE_PRODUCT_FIELDS,
      filters: { id: input.product_ids },
    })
    const products = data as unknown as PriceTableProduct[]

    const missing = input.product_ids.filter((id) => !products.some((p) => p.id === id))
    if (missing.length > 0) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `No se encontró el producto ${missing.join(', ')}`,
      )
    }

    const product_variants: VariantPriceUpdate[] = []
    const per_product: { id: string; title: string; updated: number }[] = []

    for (const product of products) {
      let updated = 0
      for (const { variant, row, col } of variantCoordinates(product)) {
        const change = input.cells.find(
          (c) =>
            (c.row === null || c.row === row) &&
            (c.cols === null || c.cols.includes(col)),
        )
        if (!change) continue

        const current = basePrice(variant.prices)
        if (current && Number(current.amount) === change.amount) continue

        const others = (variant.prices ?? []).filter((p) => p.id !== current?.id).map(keepPrice)
        product_variants.push({
          id: variant.id,
          prices: [
            {
              ...(current ? { id: current.id } : {}),
              amount: change.amount,
              currency_code: PRICE_TABLE_CURRENCY,
            },
            ...others,
          ],
        })
        updated += 1
      }
      per_product.push({ id: product.id, title: product.title, updated })
    }

    return new StepResponse({ product_variants, per_product })
  },
)
