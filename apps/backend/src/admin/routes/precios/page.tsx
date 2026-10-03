import { defineRouteConfig } from '@medusajs/admin-sdk'
import { ArrowPath, CurrencyDollar, MagnifyingGlass, Spinner, XMarkMini } from '@medusajs/icons'
import {
  Badge,
  Button,
  Checkbox,
  Container,
  Heading,
  Input,
  Label,
  RadioGroup,
  Table,
  Text,
  toast,
  usePrompt,
} from '@medusajs/ui'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { sdk } from '../../lib/client'

// ─────────────────────────────────────────────────────────────────
// Tipos (contrato de /admin/price-tables)
// ─────────────────────────────────────────────────────────────────

/** Fila/columna comodín que manda el backend cuando no existe esa opción. */
const ALL = '__all__'

/** Productos por petición al guardar: tandas pequeñas para enseñar progreso. */
const CHUNK = 3

interface ProductLite {
  id: string
  title: string
  handle?: string | null
  thumbnail?: string | null
}

interface PriceCell {
  amount: number | null
  mixed: boolean
  variants: number
}

interface PriceTable {
  row_option: { id: string; title: string } | null
  col_option: { id: string; title: string } | null
  rows: string[]
  groups: { key: string; values: string[] }[]
  cells: Record<string, Record<string, PriceCell>>
  variant_count: number
}

interface PriceTableResponse {
  product: ProductLite
  table: PriceTable
}

interface SiblingsResponse {
  siblings: ProductLite[]
  count: number
}

interface CellChange {
  row: string | null
  cols: string[] | null
  amount: number
}

// ─────────────────────────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────────────────────────

const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })

const cellKey = (row: string, group: string) => `${row}\u0001${group}`

/** "5,99" / "5.99" → 5.99. null si no es un precio válido mayor que 0. */
function parsePrice(raw: string): number | null {
  const v = raw.trim().replace(/\s|€/g, '').replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return null
  const n = Number(v)
  return n > 0 ? n : null
}

/** 4.8 → "4,80" (siempre dos decimales, como se escribe un precio). */
const toInput = (n: number) => (Math.round(n * 100) / 100).toFixed(2).replace('.', ',')

const errorMessage = (err: unknown) =>
  err instanceof Error && err.message ? err.message : 'Inténtalo de nuevo.'

// ─────────────────────────────────────────────────────────────────
// Buscador de producto
// ─────────────────────────────────────────────────────────────────

function ProductPicker({ onPick }: { onPick: (id: string) => void }) {
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250)
    return () => clearTimeout(t)
  }, [q])

  // Carga en mount (sin texto enseña los primeros productos).
  const { data, isLoading } = useQuery({
    queryKey: ['price-table-product-search', debounced],
    queryFn: () =>
      sdk.admin.product.list({
        ...(debounced ? { q: debounced } : {}),
        limit: 8,
        order: 'title',
        fields: 'id,title,handle,thumbnail',
      }),
  })
  const products = (data?.products ?? []) as ProductLite[]

  return (
    <div className="flex flex-col gap-3">
      <div className="relative max-w-md">
        <MagnifyingGlass className="text-ui-fg-muted pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2" />
        <Input
          className="pl-9"
          placeholder="Busca el producto (ej. Miata, BMW, parasol…)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
      </div>

      {isLoading ? (
        <div className="flex h-24 items-center justify-center">
          <Spinner className="text-ui-fg-muted animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          No hay productos con ese nombre.
        </Text>
      ) : (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {products.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPick(p.id)}
              className="bg-ui-bg-base hover:bg-ui-bg-base-hover border-ui-border-base flex items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors"
            >
              <Thumb src={p.thumbnail} />
              <Text size="small" leading="compact" weight="plus" className="truncate">
                {p.title}
              </Text>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Thumb({ src }: { src?: string | null }) {
  return src ? (
    <img src={src} alt="" className="h-9 w-9 shrink-0 rounded object-cover" />
  ) : (
    <div className="bg-ui-bg-component h-9 w-9 shrink-0 rounded" />
  )
}

// ─────────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────────

const PriceTablePage = () => {
  const [params, setParams] = useSearchParams()
  const productId = params.get('product')
  const pick = (id: string | null) => setParams(id ? { product: id } : {}, { replace: true })

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="px-6 py-4">
        <Heading>Precios por tamaño</Heading>
        <Text size="small" leading="compact" className="text-ui-fg-subtle mt-1">
          Cambia el precio de un tamaño una sola vez y se aplica a todos sus colores, en este
          producto o en todos los que comparten la misma tabla de precios.
        </Text>
      </Container>

      {productId ? (
        <Editor key={productId} productId={productId} onChangeProduct={() => pick(null)} />
      ) : (
        <Container className="flex flex-col gap-4 px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            1. Elige un producto
          </Text>
          <ProductPicker onPick={pick} />
        </Container>
      )}
    </div>
  )
}

function Editor({
  productId,
  onChangeProduct,
}: {
  productId: string
  onChangeProduct: () => void
}) {
  const queryClient = useQueryClient()
  const prompt = usePrompt()

  // Tabla del producto: carga en mount.
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery<PriceTableResponse>({
    queryKey: ['price-table', productId],
    queryFn: () => sdk.client.fetch(`/admin/price-tables/${productId}`),
  })

  // Productos con la misma tabla: carga en mount (tarda unos segundos la
  // primera vez porque recorre el catálogo entero).
  const { data: siblingsData, isLoading: siblingsLoading } = useQuery<SiblingsResponse>({
    queryKey: ['price-table-siblings', productId],
    queryFn: () => sdk.client.fetch(`/admin/price-tables/${productId}/siblings`),
  })
  const siblings = siblingsData?.siblings ?? []

  // Celdas editadas: clave fila+grupo → texto del input.
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [percent, setPercent] = useState('')
  const [scope, setScope] = useState<'one' | 'family'>('one')
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)

  const table = data?.table
  const product = data?.product

  const changes = useMemo(() => {
    if (!table) return { list: [] as CellChange[], invalid: 0, variants: 0 }
    const list: CellChange[] = []
    let invalid = 0
    let variants = 0
    for (const row of table.rows) {
      for (const group of table.groups) {
        const raw = draft[cellKey(row, group.key)]
        if (raw === undefined || raw.trim() === '') continue
        const cell = table.cells[row]?.[group.key]
        const amount = parsePrice(raw)
        if (amount === null) {
          invalid += 1
          continue
        }
        if (cell && !cell.mixed && cell.amount === amount) continue
        list.push({
          row: row === ALL ? null : row,
          cols: table.col_option ? group.values : null,
          amount,
        })
        variants += cell?.variants ?? 0
      }
    }
    return { list, invalid, variants }
  }, [draft, table])

  const targets = useMemo(() => {
    const ids = [productId]
    if (scope === 'family') {
      for (const s of siblings) if (!excluded.has(s.id)) ids.push(s.id)
    }
    return ids
  }, [productId, scope, siblings, excluded])

  const saving = progress !== null

  if (isLoading) {
    return (
      <Container className="flex h-48 items-center justify-center">
        <Spinner className="text-ui-fg-muted animate-spin" />
      </Container>
    )
  }

  if (isError || !table || !product) {
    return (
      <Container className="flex flex-col items-start gap-3 px-6 py-4">
        <Text size="small" leading="compact" className="text-ui-fg-error">
          No se pudo cargar la tabla de precios. {errorMessage(error)}
        </Text>
        <Button size="small" variant="secondary" onClick={onChangeProduct}>
          Elegir otro producto
        </Button>
      </Container>
    )
  }

  const rowTitle = table.row_option?.title ?? 'Producto'
  const colTitle = table.col_option?.title ?? null

  const applyPercent = () => {
    const pct = Number(percent.trim().replace(',', '.'))
    if (!Number.isFinite(pct) || pct === 0 || pct <= -100) {
      toast.error('Escribe un porcentaje, por ejemplo 10 para subir un 10 % o -5 para bajar.')
      return
    }
    const next: Record<string, string> = {}
    for (const row of table.rows) {
      for (const group of table.groups) {
        const cell = table.cells[row]?.[group.key]
        if (!cell || cell.amount === null) continue
        next[cellKey(row, group.key)] = toInput(cell.amount * (1 + pct / 100))
      }
    }
    setDraft(next)
  }

  const save = async () => {
    if (changes.invalid > 0) {
      toast.error('Hay precios mal escritos (en rojo). Usa el formato 5,99.')
      return
    }
    if (changes.list.length === 0) return

    if (targets.length > 1) {
      const ok = await prompt({
        title: `¿Cambiar precios en ${targets.length} productos?`,
        description: `${
          changes.list.length === 1
            ? 'Se actualizará 1 precio'
            : `Se actualizarán ${changes.list.length} precios`
        } de la tabla en «${product.title}» y en ${
          targets.length === 2 ? 'otro producto' : `otros ${targets.length - 1} productos`
        }. El cambio se verá en la tienda en uno o dos minutos.`,
        confirmText: 'Sí, cambiar precios',
        cancelText: 'Cancelar',
        variant: 'confirmation',
      })
      if (!ok) return
    }

    let done = 0
    let updated = 0
    setProgress({ done, total: targets.length })
    try {
      for (let i = 0; i < targets.length; i += CHUNK) {
        const ids = targets.slice(i, i + CHUNK)
        const res = await sdk.client.fetch<{ updated_variants: number }>('/admin/price-tables', {
          method: 'POST',
          body: { product_ids: ids, cells: changes.list },
        })
        updated += res.updated_variants
        done += ids.length
        setProgress({ done, total: targets.length })
      }
      toast.success(
        `Precios actualizados: ${updated} variantes en ${targets.length} ${
          targets.length === 1 ? 'producto' : 'productos'
        }.`,
      )
      setDraft({})
      setPercent('')
    } catch (err) {
      toast.error(
        `Se ha parado tras ${done} de ${targets.length} productos. ${errorMessage(err)} Los ya guardados conservan el precio nuevo; vuelve a pulsar Guardar para terminar.`,
      )
    } finally {
      setProgress(null)
      queryClient.invalidateQueries({ queryKey: ['price-table'] })
      queryClient.invalidateQueries({ queryKey: ['price-table-siblings'] })
      // Para que la ficha del producto del panel muestre los precios nuevos.
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product_variants'] })
    }
  }

  const dirty = Object.values(draft).some((v) => v.trim() !== '')

  return (
    <>
      {/* ─── Producto elegido ─────────────────────────────────────── */}
      <Container className="flex items-center justify-between gap-4 px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <Thumb src={product.thumbnail} />
          <div className="min-w-0">
            <Text size="small" leading="compact" weight="plus" className="truncate">
              {product.title}
            </Text>
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              {table.variant_count} {table.variant_count === 1 ? 'variante' : 'variantes'}
              {table.row_option ? ` · ${table.rows.length} valores de «${rowTitle}»` : ''}
            </Text>
          </div>
        </div>
        <Button size="small" variant="secondary" onClick={onChangeProduct} disabled={saving}>
          <XMarkMini />
          Cambiar de producto
        </Button>
      </Container>

      {/* ─── Tabla de precios ─────────────────────────────────────── */}
      <Container className="divide-y p-0">
        <div className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Text size="small" leading="compact" weight="plus">
              2. Escribe los precios nuevos
            </Text>
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              Las casillas enseñan el precio actual. Solo se guarda lo que cambies. En euros, con
              coma: 5,99.
            </Text>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="pt-percent" size="xsmall" className="text-ui-fg-subtle">
                Subir o bajar toda la tabla (%)
              </Label>
              <Input
                id="pt-percent"
                size="small"
                className="w-40"
                placeholder="Ej: 10 o -5"
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                disabled={saving}
              />
            </div>
            <Button size="small" variant="secondary" onClick={applyPercent} disabled={saving}>
              Calcular
            </Button>
            <Button
              size="small"
              variant="transparent"
              onClick={() => {
                setDraft({})
                setPercent('')
              }}
              disabled={saving || !dirty}
            >
              <ArrowPath />
              Deshacer
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>{rowTitle}</Table.HeaderCell>
                {table.groups.map((g) => (
                  <Table.HeaderCell key={g.key}>
                    <GroupLabel values={g.values} colTitle={colTitle} single={table.groups.length === 1} />
                  </Table.HeaderCell>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {table.rows.map((row) => (
                <Table.Row key={row}>
                  <Table.Cell>
                    <Text size="small" leading="compact" weight="plus">
                      {row === ALL ? 'Precio único' : row}
                    </Text>
                  </Table.Cell>
                  {table.groups.map((g) => {
                    const cell = table.cells[row]?.[g.key]
                    const key = cellKey(row, g.key)
                    if (!cell || cell.variants === 0) {
                      return (
                        <Table.Cell key={g.key}>
                          <Text size="small" leading="compact" className="text-ui-fg-muted">
                            —
                          </Text>
                        </Table.Cell>
                      )
                    }
                    // La casilla enseña el precio actual; al escribir pasa a `draft`.
                    const current =
                      cell.mixed || cell.amount === null ? '' : toInput(cell.amount)
                    const raw = draft[key] ?? current
                    const parsed = raw.trim() === '' ? undefined : parsePrice(raw)
                    const invalid = parsed === null
                    const changed =
                      typeof parsed === 'number' && (cell.mixed || parsed !== cell.amount)
                    return (
                      <Table.Cell key={g.key}>
                        <div className="flex items-center gap-2 py-1.5">
                          <Input
                            size="small"
                            className="w-28"
                            inputMode="decimal"
                            aria-label={`Precio ${row === ALL ? '' : row} · ${g.values.length} ${colTitle ?? 'producto'}`}
                            aria-invalid={invalid}
                            placeholder={
                              cell.mixed
                                ? 'varios'
                                : cell.amount === null
                                  ? 'sin precio'
                                  : toInput(cell.amount)
                            }
                            value={raw}
                            onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                            disabled={saving}
                          />
                          {invalid ? (
                            <Badge size="2xsmall" color="red">
                              No válido
                            </Badge>
                          ) : changed ? (
                            <Badge size="2xsmall" color="green">
                              {cell.mixed || cell.amount === null
                                ? 'nuevo'
                                : `antes ${eur.format(cell.amount)}`}
                            </Badge>
                          ) : cell.mixed ? (
                            <Badge size="2xsmall" color="orange">
                              precios distintos
                            </Badge>
                          ) : null}
                        </div>
                      </Table.Cell>
                    )
                  })}
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      </Container>

      {/* ─── A qué productos ──────────────────────────────────────── */}
      <Container className="flex flex-col gap-4 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          3. ¿Dónde se aplica?
        </Text>

        {siblingsLoading ? (
          <div className="flex items-center gap-2">
            <Spinner className="text-ui-fg-muted animate-spin" />
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              Buscando otros productos con la misma tabla de precios…
            </Text>
          </div>
        ) : siblings.length === 0 ? (
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Ningún otro producto tiene exactamente esta tabla de precios: el cambio se aplica solo
            a «{product.title}».
          </Text>
        ) : (
          <>
            <RadioGroup
              value={scope}
              onValueChange={(v) => setScope(v as 'one' | 'family')}
              className="flex flex-col gap-3"
            >
              <div className="flex items-start gap-3">
                <RadioGroup.Item value="one" id="pt-scope-one" disabled={saving} />
                <Label htmlFor="pt-scope-one" size="small" weight="plus">
                  Solo en «{product.title}»
                </Label>
              </div>
              <div className="flex items-start gap-3">
                <RadioGroup.Item value="family" id="pt-scope-family" disabled={saving} />
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor="pt-scope-family" size="small" weight="plus">
                    En este y en los otros {siblings.length} productos con la misma tabla de
                    precios
                  </Label>
                  <Text size="small" leading="compact" className="text-ui-fg-subtle">
                    Tienen los mismos tamaños, colores y precios que este. Puedes desmarcar los
                    que no quieras tocar.
                  </Text>
                </div>
              </div>
            </RadioGroup>

            {scope === 'family' ? (
              <div className="border-ui-border-base grid max-h-64 grid-cols-1 gap-x-6 gap-y-2 overflow-y-auto rounded-md border p-3 md:grid-cols-2 xl:grid-cols-3">
                {siblings.map((s) => {
                  const id = `pt-sib-${s.id}`
                  return (
                    <div key={s.id} className="flex items-center gap-2">
                      <Checkbox
                        id={id}
                        checked={!excluded.has(s.id)}
                        disabled={saving}
                        onCheckedChange={(checked) =>
                          setExcluded((prev) => {
                            const next = new Set(prev)
                            if (checked) next.delete(s.id)
                            else next.add(s.id)
                            return next
                          })
                        }
                      />
                      <Label htmlFor={id} size="small" className="truncate">
                        {s.title}
                      </Label>
                    </div>
                  )
                })}
              </div>
            ) : null}
          </>
        )}
      </Container>

      {/* ─── Resumen + guardar ────────────────────────────────────── */}
      <Container className="bg-ui-bg-subtle flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <Text size="small" leading="compact" weight="plus">
            {changes.list.length === 0
              ? 'Todavía no has cambiado ningún precio'
              : `${changes.list.length} ${
                  changes.list.length === 1 ? 'precio cambiado' : 'precios cambiados'
                } · ${targets.length} ${targets.length === 1 ? 'producto' : 'productos'}`}
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {progress
              ? `Guardando… ${progress.done} de ${progress.total} productos. No cierres esta página.`
              : changes.invalid > 0
                ? `${changes.invalid} ${changes.invalid === 1 ? 'precio mal escrito' : 'precios mal escritos'}: corrígelo antes de guardar.`
                : changes.list.length > 0
                  ? `Afecta a unas ${changes.variants * targets.length} variantes. Se verá en la tienda en uno o dos minutos.`
                  : 'Cambia en la tabla las casillas que quieras.'}
          </Text>
        </div>
        <Button
          size="small"
          onClick={save}
          disabled={saving || changes.list.length === 0 || changes.invalid > 0}
          isLoading={saving}
        >
          Guardar precios
        </Button>
      </Container>
    </>
  )
}

/** Cabecera de columna: "Precio" o el grupo de colores que comparte precio. */
function GroupLabel({
  values,
  colTitle,
  single,
}: {
  values: string[]
  colTitle: string | null
  single: boolean
}) {
  if (!colTitle) return <>Precio (€)</>
  if (single) {
    return (
      <span title={values.join(', ')}>
        Precio (€) · todos los {values.length} valores de «{colTitle}»
      </span>
    )
  }
  const shown = values.slice(0, 3).join(', ')
  const rest = values.length - 3
  return (
    <span title={values.join(', ')} className="flex flex-col py-2 normal-case">
      <span>
        {values.length} de «{colTitle}»
      </span>
      <span className="text-ui-fg-muted font-normal">
        {shown}
        {rest > 0 ? ` y ${rest} más` : ''}
      </span>
    </span>
  )
}

export const config = defineRouteConfig({
  label: 'Precios por tamaño',
  icon: CurrencyDollar,
})

export default PriceTablePage
