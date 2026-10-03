/**
 * "Tabla de precios" de un producto: la forma en la que el taller piensa sus
 * precios (un precio por TAMAÑO, con un recargo para los colores especiales),
 * en vez de las 285 variantes sueltas que guarda Medusa.
 *
 *  - Filas: los valores de la opción de tamaño (o de la única opción).
 *  - Columnas: los valores de la otra opción (colores), AGRUPADOS cuando
 *    cuestan lo mismo en todos los tamaños (p. ej. "15 colores estándar" y
 *    "4 especiales").
 *
 * Lo usan las rutas `/admin/price-tables` y la página admin "Precios por
 * tamaño". Son funciones puras: reciben el producto ya cargado.
 */

export const PRICE_TABLE_CURRENCY = 'eur'

/** Fila/columna comodín cuando el producto no tiene esa opción. */
export const ALL = '__all__'

export type PriceTablePrice = {
  id: string
  amount: number | string
  currency_code: string
  min_quantity?: number | string | null
  max_quantity?: number | string | null
  price_rules?: { attribute: string; value: string }[] | null
}

export type PriceTableProduct = {
  id: string
  title: string
  handle?: string | null
  thumbnail?: string | null
  options?: { id: string; title: string; values?: { value: string }[] | null }[] | null
  variants?:
    | {
        id: string
        options?: { option_id?: string | null; value: string }[] | null
        prices?: PriceTablePrice[] | null
      }[]
    | null
}

export type PriceTableCell = {
  /** Precio común a todas las variantes de la celda (el menor si no coinciden). */
  amount: number | null
  /** true si dentro de la celda hay variantes con precios distintos. */
  mixed: boolean
  variants: number
}

export type PriceTable = {
  row_option: { id: string; title: string } | null
  col_option: { id: string; title: string } | null
  rows: string[]
  groups: { key: string; values: string[] }[]
  cells: Record<string, Record<string, PriceTableCell>>
  variant_count: number
  signature: string
}

const isSizeTitle = (title: string) => /tama|medida|size|largo|ancho/i.test(title)

/** Precio base en EUR: sin reglas (región, grupo…) ni tramos por cantidad. */
export function basePrice(prices: PriceTablePrice[] | null | undefined): PriceTablePrice | null {
  const eur = (prices ?? []).filter((p) => p.currency_code === PRICE_TABLE_CURRENCY)
  return (
    eur.find(
      (p) => !(p.price_rules?.length ?? 0) && p.min_quantity == null && p.max_quantity == null,
    ) ?? null
  )
}

/** "20cm" → 20, "7,5 cm" → 7.5. null si no empieza por un número. */
const leadingNumber = (v: string) => {
  const m = v.trim().match(/^(\d+(?:[.,]\d+)?)/)
  return m ? Number(m[1].replace(',', '.')) : null
}

/** Tamaños de menor a mayor si todos son numéricos; si no, el orden original. */
function sortRows(values: string[]): string[] {
  const nums = values.map(leadingNumber)
  if (nums.some((n) => n === null)) return values
  return [...values].sort((a, b) => leadingNumber(a)! - leadingNumber(b)!)
}

/**
 * Decide qué opción hace de fila y cuál de columna.
 *  - 0 opciones (o la "Default" de Medusa con un solo valor): precio único.
 *  - 1 opción: es la fila.
 *  - 2 opciones: la de tamaño es la fila; si ninguna lo parece, la segunda.
 */
export function pickAxes(product: PriceTableProduct) {
  const options = (product.options ?? []).filter(
    (o) => !(o.title.toLowerCase() === 'default' && (o.values?.length ?? 0) <= 1),
  )
  if (options.length === 0) return { row: null, col: null }
  if (options.length === 1) return { row: options[0], col: null }
  const size = options.find((o) => isSizeTitle(o.title))
  const row = size ?? options[1]
  const col = options.find((o) => o.id !== row.id) ?? null
  return { row, col }
}

/** Valor de fila y de columna de cada variante según los ejes del producto. */
export function variantCoordinates(product: PriceTableProduct) {
  const { row, col } = pickAxes(product)
  return (product.variants ?? []).map((v) => {
    const valueOf = (optionId: string | undefined) =>
      optionId ? (v.options ?? []).find((o) => o.option_id === optionId)?.value ?? null : null
    return {
      variant: v,
      row: row ? valueOf(row.id) ?? ALL : ALL,
      col: col ? valueOf(col.id) ?? ALL : ALL,
    }
  })
}

export function buildPriceTable(product: PriceTableProduct): PriceTable {
  const { row, col } = pickAxes(product)
  const coords = variantCoordinates(product)

  // Precios por (fila, valor de columna).
  const byRowCol = new Map<string, Map<string, number[]>>()
  for (const c of coords) {
    const price = basePrice(c.variant.prices)
    const amount = price ? Number(price.amount) : NaN
    const rowMap = byRowCol.get(c.row) ?? new Map<string, number[]>()
    const list = rowMap.get(c.col) ?? []
    list.push(amount)
    rowMap.set(c.col, list)
    byRowCol.set(c.row, rowMap)
  }

  const rowValues = row ? (row.values ?? []).map((v) => v.value) : [ALL]
  const rows = sortRows(rowValues.filter((r) => byRowCol.has(r)))
  for (const r of byRowCol.keys()) if (!rows.includes(r)) rows.push(r)

  const colValues: string[] = []
  for (const v of col ? (col.values ?? []).map((x) => x.value) : [ALL]) {
    if (coords.some((c) => c.col === v) && !colValues.includes(v)) colValues.push(v)
  }
  for (const c of coords) if (!colValues.includes(c.col)) colValues.push(c.col)

  const cellOf = (r: string, cols: string[]): PriceTableCell => {
    const amounts = cols.flatMap((c) => byRowCol.get(r)?.get(c) ?? [])
    const valid = amounts.filter((a) => Number.isFinite(a))
    if (amounts.length === 0) return { amount: null, mixed: false, variants: 0 }
    if (valid.length === 0) return { amount: null, mixed: false, variants: amounts.length }
    const min = Math.min(...valid)
    const mixed = valid.length !== amounts.length || valid.some((a) => a !== min)
    return { amount: min, mixed, variants: amounts.length }
  }

  // Agrupa los valores de columna cuyo precio es idéntico en todas las filas.
  // Una combinación que no existe (p. ej. parasol con fondo y letras del mismo
  // color) no rompe el grupo: cuenta como comodín.
  const vectorGroups: { vector: (string | null)[]; values: string[] }[] = []
  for (const c of colValues) {
    const vector = rows.map((r) => {
      const cell = cellOf(r, [c])
      return cell.variants === 0 ? null : `${cell.amount}${cell.mixed ? '~' : ''}`
    })
    const match = vectorGroups.find((g) =>
      g.vector.every((v, i) => v === null || vector[i] === null || v === vector[i]),
    )
    if (match) {
      match.vector = match.vector.map((v, i) => v ?? vector[i])
      match.values.push(c)
    } else {
      vectorGroups.push({ vector, values: [c] })
    }
  }
  const groups = vectorGroups.map((g, i) => ({ key: `g${i}`, values: g.values }))

  const cells: PriceTable['cells'] = {}
  for (const r of rows) {
    cells[r] = {}
    for (const g of groups) cells[r][g.key] = cellOf(r, g.values)
  }

  // Firma: mismos valores y mismos precios ⇒ misma tabla (da igual el nombre
  // de la opción: "Tamaño pegatina (largo)" y "Tamaño BANNER" son equivalentes).
  const signature = coords
    .map((c) => {
      const price = basePrice(c.variant.prices)
      return `${c.row}\u0001${c.col}\u0001${price ? Number(price.amount) : 'x'}`
    })
    .sort()
    .join('\u0002')

  return {
    row_option: row ? { id: row.id, title: row.title } : null,
    col_option: col ? { id: col.id, title: col.title } : null,
    rows,
    groups,
    cells,
    variant_count: coords.length,
    signature,
  }
}

/** Campos de producto necesarios para construir la tabla (query.graph). */
export const PRICE_TABLE_PRODUCT_FIELDS = [
  'id',
  'title',
  'handle',
  'thumbnail',
  'options.id',
  'options.title',
  'options.values.value',
  'variants.id',
  'variants.options.option_id',
  'variants.options.value',
  'variants.prices.id',
  'variants.prices.amount',
  'variants.prices.currency_code',
  'variants.prices.min_quantity',
  'variants.prices.max_quantity',
  'variants.prices.price_rules.attribute',
  'variants.prices.price_rules.value',
]
