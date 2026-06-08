'use client'

import type { HttpTypes } from '@medusajs/types'
import { Ban, Check, Plus, ShoppingBag } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { addToCartAction } from '@/app/actions/cart'
import { openCartDrawer } from '@/components/cart/cart-store'
import { QuantitySelector } from '@/components/commerce/quantity-selector'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'

interface VariantSelectorProps {
  product: HttpTypes.StoreProduct
  countryCode: string
}

/* ─── Catálogo de "estilos" ─────────────────────────────────────── */

interface StyleEntry {
  background: string
  type: 'color' | 'finish' | 'none'
  border?: string
}

const STYLE_MAP: Record<string, StyleEntry> = {
  ninguno: { background: '#fff', type: 'none', border: '#e5e5e5' },
  'sin fondo': { background: '#fff', type: 'none', border: '#e5e5e5' },
  'sin letras': { background: '#fff', type: 'none', border: '#e5e5e5' },

  'negro brillo': { background: '#0a0a0a', type: 'color' },
  'negro mate': { background: '#2b2b2b', type: 'color' },
  negro: { background: '#0a0a0a', type: 'color' },
  blanco: { background: '#ffffff', type: 'color', border: '#e5e5e5' },
  amarillo: { background: '#ffd83d', type: 'color' },
  dorado: { background: '#d4af37', type: 'color' },
  rojo: { background: '#e53935', type: 'color' },
  rosa: { background: '#ec407a', type: 'color' },
  lila: { background: '#ce93d8', type: 'color' },
  morado: { background: '#5e35b1', type: 'color' },
  'azul turquesa': { background: '#26c6a4', type: 'color' },
  'azul claro': { background: '#42a5f5', type: 'color' },
  'azul oscuro': { background: '#1a4ad8', type: 'color' },
  azul: { background: '#1976d2', type: 'color' },
  'verde pistacho': { background: '#9ccc65', type: 'color' },
  'verde oscuro': { background: '#2e7d32', type: 'color' },
  verde: { background: '#388e3c', type: 'color' },
  gris: { background: '#9e9e9e', type: 'color' },
  plata: { background: '#bdbdbd', type: 'color' },

  holografico: {
    background:
      'linear-gradient(135deg, #b8c5ff 0%, #d9c4f5 25%, #ffd9d0 50%, #c4f0d9 75%, #b8e4ff 100%)',
    type: 'finish',
  },
  'cobre/bronce': {
    background:
      'linear-gradient(135deg, #c97f4a 0%, #e0a878 30%, #8e4a26 65%, #c97f4a 100%)',
    type: 'finish',
  },
  'amarillo fluor': {
    background: 'linear-gradient(135deg, #d8ff00 0%, #f0ff00 50%, #c9ff3d 100%)',
    type: 'finish',
  },
  'cromo dorado': {
    background: 'linear-gradient(135deg, #d4af37 0%, #f4e186 40%, #b8902d 80%, #f4e186 100%)',
    type: 'finish',
  },
  'cromo plata': {
    background: 'linear-gradient(135deg, #bdbdbd 0%, #f5f5f5 40%, #757575 80%, #f5f5f5 100%)',
    type: 'finish',
  },
}

function styleOf(value: string): StyleEntry {
  return (
    STYLE_MAP[value.toLowerCase()] ?? {
      background: '#f5f5f5',
      type: 'color',
      border: '#d4d4d4',
    }
  )
}

/* "Destacados" mostrados en la primera fila de la PDP. El resto se ocultan
   tras un botón "+ Más colores" para no saturar la ficha. */
const FEATURED_COLORS = ['negro brillo', 'blanco', 'rojo', 'azul oscuro'] as const

const COLOR_OPTION_NAMES = [
  'color',
  'colour',
  'farbe',
  'color fondo',
  'color letras',
  'color estrellas',
]
const isLooksLikeColorOption = (n: string | undefined) =>
  !!n && COLOR_OPTION_NAMES.includes(n.toLowerCase())
const isSizeOption = (n: string | undefined) => !!n && /tama[ñn]o|talla|size/i.test(n)

function sizeAsNumber(value: string): number {
  const m = value.replace(',', '.').match(/(\d+(?:\.\d+)?)/)
  return m ? parseFloat(m[1]) : Number.POSITIVE_INFINITY
}

function pickDefaultSize(values: string[]): string | undefined {
  if (values.length === 0) return undefined
  return [...values].sort((a, b) => sizeAsNumber(a) - sizeAsNumber(b))[0]
}

function pickDefaultStyle(values: string[]): string | undefined {
  const lower = values.map((v) => v.toLowerCase())
  for (const pref of ['negro brillo', 'negro mate', 'negro']) {
    const idx = lower.indexOf(pref)
    if (idx >= 0) return values[idx]
  }
  const firstColor = values.find((v) => styleOf(v).type === 'color')
  return firstColor ?? values[0]
}

export function VariantSelector({ product, countryCode }: VariantSelectorProps) {
  const t = useTranslations('product')
  const options = product.options ?? []
  const variants = product.variants ?? []
  const [pending, startTransition] = useTransition()
  const [quantity, setQuantity] = useState(1)

  const [selected, setSelected] = useState<Record<string, string>>(() => {
    if (variants.length === 1) {
      return Object.fromEntries(
        (variants[0]?.options ?? []).map((o) => [o.option_id ?? '', o.value ?? '']),
      )
    }
    const out: Record<string, string> = {}
    for (const opt of options) {
      const values = (opt.values ?? []).map((v) => v.value)
      const titleLower = opt.title.toLowerCase()
      if (titleLower === 'estilo' || isLooksLikeColorOption(opt.title)) {
        const def = pickDefaultStyle(values)
        if (def) out[opt.id] = def
      } else if (isSizeOption(opt.title)) {
        const def = pickDefaultSize(values)
        if (def) out[opt.id] = def
      } else if (values[0]) {
        out[opt.id] = values[0]
      }
    }
    return out
  })

  const matchedVariant = useMemo(() => {
    if (variants.length === 1) return variants[0]
    return variants.find((v) =>
      (v.options ?? []).every((o) => selected[o.option_id ?? ''] === o.value),
    )
  }, [variants, selected])

  const allPrices = useMemo(
    () =>
      variants
        .map((v) => v.calculated_price?.calculated_amount)
        .filter((n): n is number => typeof n === 'number' && n > 0),
    [variants],
  )
  const fallbackMin = allPrices.length ? Math.min(...allPrices) : 0
  const currencyFromAny = variants[0]?.calculated_price?.currency_code ?? 'eur'

  const inStock = matchedVariant
    ? matchedVariant.manage_inventory === false ||
      matchedVariant.allow_backorder === true ||
      (matchedVariant.inventory_quantity ?? 0) > 0
    : false
  const price = matchedVariant?.calculated_price
  const amount = price?.calculated_amount ?? fallbackMin
  const currency = price?.currency_code ?? currencyFromAny
  const compareAt = price?.original_amount ?? undefined
  const showAsFrom = !matchedVariant
  const localeStr = `${countryCode}-${countryCode.toUpperCase()}`

  function onSubmit() {
    if (!matchedVariant) {
      toast.error(t('select_variant'))
      return
    }
    startTransition(async () => {
      const res = await addToCartAction({
        variantId: matchedVariant.id,
        quantity,
        countryCode,
      })
      if (!res.ok) {
        toast.error(res.message ?? 'Error añadiendo al carrito')
        return
      }
      toast.success(`${product.title} añadido al carrito`)
      openCartDrawer()
    })
  }

  return (
    <div className="space-y-7">
      <div className="space-y-6">
        {options.map((opt) => {
          const currentValue = selected[opt.id]
          const titleLower = opt.title.toLowerCase()
          const isStyle = titleLower === 'estilo'
          const isSize = isSizeOption(opt.title)
          const isColor = isLooksLikeColorOption(opt.title)

          if (isStyle) {
            return (
              <StyleSelector
                key={opt.id}
                option={opt}
                value={currentValue}
                onChange={(v) => setSelected((s) => ({ ...s, [opt.id]: v }))}
              />
            )
          }

          if (isSize) {
            return (
              <SizeSelect
                key={opt.id}
                option={opt}
                value={currentValue}
                onChange={(v) => setSelected((s) => ({ ...s, [opt.id]: v }))}
              />
            )
          }

          return (
            <div key={opt.id} className="space-y-2.5">
              <div className="flex items-baseline justify-between">
                <span className="text-uppercase-tight text-[13px] tracking-[0.18em]">
                  {opt.title}
                </span>
                {currentValue ? (
                  <span className="text-[12px] text-rt-ink-500">{currentValue}</span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {(opt.values ?? []).map((val) => {
                  const isActive = currentValue === val.value
                  if (isColor) {
                    return (
                      <SwatchButton
                        key={val.id}
                        value={val.value}
                        active={isActive}
                        onClick={() => setSelected((s) => ({ ...s, [opt.id]: val.value }))}
                      />
                    )
                  }
                  return (
                    <button
                      type="button"
                      key={val.id}
                      onClick={() => setSelected((s) => ({ ...s, [opt.id]: val.value }))}
                      aria-pressed={isActive}
                      className={cn(
                        'min-w-12 rounded-[10px] border px-3.5 py-2 font-[family-name:var(--font-heading)] text-[13px] font-bold transition-all',
                        isActive
                          ? 'border-rt-black bg-rt-black text-rt-white'
                          : 'border-rt-ink-100 bg-rt-white text-rt-black hover:border-rt-black',
                      )}
                    >
                      {val.value}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* ─── CTA bloque: precio + cantidad + add to cart ───────── */}
      <div
        id="pdp-add-to-cart"
        className="rounded-[16px] border border-rt-ink-100 bg-rt-white-2 p-4 md:p-5"
      >
        <div className="flex items-baseline gap-2">
          {showAsFrom ? (
            <span className="font-[family-name:var(--font-heading)] text-[11px] font-bold uppercase tracking-[0.18em] text-rt-ink-500">
              Desde
            </span>
          ) : null}
          <span className="font-[family-name:var(--font-heading)] text-[26px] font-extrabold leading-none tracking-[-0.01em] tabular-nums text-rt-black md:text-[30px]">
            {formatMoney(amount * quantity, currency, localeStr)}
          </span>
          {compareAt && compareAt > amount ? (
            <span className="font-[family-name:var(--font-heading)] text-[14px] text-rt-ink-500 line-through">
              {formatMoney(compareAt * quantity, currency, localeStr)}
            </span>
          ) : null}
        </div>

        <p className="mt-1.5 text-[12px] text-rt-ink-500">
          {quantity > 1 ? (
            <>
              <span className="tabular-nums">
                {quantity} × {formatMoney(amount, currency, localeStr)}
              </span>
              {' · '}
            </>
          ) : null}
          ✓ Fabricación 24–72h · envío express
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <QuantitySelector
            value={quantity}
            onChange={setQuantity}
            min={1}
            max={20}
            className="self-start sm:self-auto"
          />
          <Button
            type="button"
            size="lg"
            className="w-full sm:flex-1"
            onClick={onSubmit}
            disabled={pending || !matchedVariant || !inStock}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {!matchedVariant
              ? t('select_variant')
              : !inStock
                ? t('out_of_stock')
                : pending
                  ? 'Añadiendo…'
                  : t('add_to_cart')}
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ─── SwatchButton ───────────────────────────────────────────────── */

interface SwatchButtonProps {
  value: string
  active: boolean
  dimmed?: boolean
  size?: 'sm' | 'md'
  onClick: () => void
}

function SwatchButton({ value, active, dimmed = false, size = 'md', onClick }: SwatchButtonProps) {
  const s = styleOf(value)
  const isNone = s.type === 'none'
  const isLight = ['#ffffff', '#fff', '#f5f5f5'].includes(s.background.toLowerCase())
  const dims = size === 'sm' ? 'h-9 w-9 rounded-[10px]' : 'h-11 w-11 rounded-[12px]'

  return (
    <button
      type="button"
      title={value}
      aria-label={value}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden border transition-all',
        dims,
        active
          ? 'border-rt-black ring-2 ring-rt-black/10 ring-offset-1'
          : 'border-rt-ink-100 hover:border-rt-black/60',
        dimmed && !active ? 'opacity-30 hover:opacity-60' : '',
      )}
      style={{
        background: s.background,
        ...(s.border ? { borderColor: s.border } : {}),
      }}
    >
      {isNone ? (
        <Ban className="h-5 w-5 text-rt-danger" strokeWidth={2.5} />
      ) : active ? (
        <Check
          className={cn(
            'absolute inset-0 m-auto h-4 w-4',
            isLight ? 'text-rt-black' : 'text-white drop-shadow',
          )}
          strokeWidth={3}
        />
      ) : null}
    </button>
  )
}

/* ─── StyleSelector ──────────────────────────────────────────────── */

interface StyleSelectorProps {
  option: NonNullable<HttpTypes.StoreProduct['options']>[number]
  value: string | undefined
  onChange: (value: string) => void
}

function StyleSelector({ option, value, onChange }: StyleSelectorProps) {
  const values = option.values ?? []

  // Filtramos cualquier valor "Ninguno" que pudiera quedar de imports
  // antiguos — el cliente no lo ofrece como combinación vendible.
  const { colors, finishes } = useMemo(() => {
    const colors: typeof values = []
    const finishes: typeof values = []
    for (const v of values) {
      const t = styleOf(v.value).type
      if (t === 'none') continue
      if (t === 'finish') finishes.push(v)
      else colors.push(v)
    }
    return { colors, finishes }
  }, [values])

  const activeType = value ? styleOf(value).type : undefined
  const finishSelected = activeType === 'finish'
  const colorSelected = activeType === 'color' || activeType === 'none'

  return (
    <div className="space-y-5">
      <ColorSection
        colors={colors}
        value={value}
        dimmed={finishSelected}
        showLabel={colorSelected}
        onChange={onChange}
      />

      {finishes.length > 0 ? (
        <section className="space-y-2.5">
          <div className="flex items-baseline justify-between">
            <span className="text-uppercase-tight text-[13px] tracking-[0.18em]">
              Acabado especial
            </span>
            {finishSelected && value ? (
              <span className="text-[12px] text-rt-ink-500">{value}</span>
            ) : (
              <span className="text-[12px] text-rt-ink-300">—</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {finishes.map((v) => (
              <SwatchButton
                key={v.id}
                value={v.value}
                active={value === v.value}
                dimmed={colorSelected}
                onClick={() => onChange(v.value)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <p className="text-[12px] text-rt-ink-500">
        Color y acabado especial son alternativos — elige uno u otro.
      </p>
    </div>
  )
}

/* ─── ColorSection: 4 destacados + popover "ver todos" ──────────── */

type OptionValue = NonNullable<
  NonNullable<HttpTypes.StoreProduct['options']>[number]['values']
>[number]

interface ColorSectionProps {
  colors: OptionValue[]
  value: string | undefined
  dimmed: boolean
  showLabel: boolean
  onChange: (value: string) => void
}

function ColorSection({ colors, value, dimmed, showLabel, onChange }: ColorSectionProps) {
  const [open, setOpen] = useState(false)

  // Construye la lista visible: Ninguno + colores destacados (si existen
  // en el producto). Si el valor activo está fuera de esa lista, lo añadimos
  // para que se vea marcado sin tener que abrir el popover.
  const featured = useMemo(() => {
    const byLower = new Map(colors.map((c) => [c.value.toLowerCase(), c]))
    const found: OptionValue[] = []
    for (const name of FEATURED_COLORS) {
      const hit = byLower.get(name)
      if (hit) found.push(hit)
    }
    return found
  }, [colors])

  const remaining = useMemo(() => {
    const featuredIds = new Set(featured.map((c) => c.id))
    return colors.filter((c) => !featuredIds.has(c.id))
  }, [colors, featured])

  const activeColor = value && styleOf(value).type !== 'finish' ? value : undefined
  const activeIsInFeatured = useMemo(
    () => featured.some((c) => c.value === activeColor),
    [featured, activeColor],
  )
  const extraVisible =
    activeColor && !activeIsInFeatured
      ? remaining.find((c) => c.value === activeColor)
      : undefined

  return (
    <section className="space-y-2.5">
      <div className="flex items-baseline justify-between">
        <span className="text-uppercase-tight text-[13px] tracking-[0.18em]">Color</span>
        {showLabel && value ? (
          <span className="text-[12px] text-rt-ink-500">{value}</span>
        ) : (
          <span className="text-[12px] text-rt-ink-300">—</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* "Ninguno" deshabilitado: el cliente no vende esa combinación. */}
        {featured.map((c) => (
          <SwatchButton
            key={c.id}
            value={c.value}
            active={value === c.value}
            dimmed={dimmed}
            onClick={() => onChange(c.value)}
          />
        ))}
        {extraVisible ? (
          <SwatchButton
            value={extraVisible.value}
            active
            dimmed={dimmed}
            onClick={() => onChange(extraVisible.value)}
          />
        ) : null}

        {remaining.length > 0 ? (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={`Ver ${remaining.length} colores más`}
                className={cn(
                  'inline-flex h-11 items-center gap-1.5 rounded-[12px] border border-rt-ink-100 bg-rt-white px-3 font-[family-name:var(--font-heading)] text-[12px] font-bold uppercase tracking-[0.08em] text-rt-black transition-colors hover:border-rt-black',
                  dimmed && 'opacity-60',
                )}
              >
                <Plus className="h-3.5 w-3.5" />+{remaining.length}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[280px]">
              <p className="text-uppercase-tight mb-3 text-[12px] tracking-[0.18em] text-rt-ink-500">
                Todos los colores
              </p>
              <div className="grid grid-cols-6 gap-2">
                {colors.map((c) => (
                  <SwatchButton
                    key={c.id}
                    value={c.value}
                    active={value === c.value}
                    size="sm"
                    onClick={() => {
                      onChange(c.value)
                      setOpen(false)
                    }}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        ) : null}
      </div>
    </section>
  )
}

/* ─── SizeSelect ─────────────────────────────────────────────────── */

interface SizeSelectProps {
  option: NonNullable<HttpTypes.StoreProduct['options']>[number]
  value: string | undefined
  onChange: (value: string) => void
}

function SizeSelect({ option, value, onChange }: SizeSelectProps) {
  const sorted = useMemo(() => {
    return (option.values ?? [])
      .slice()
      .sort((a, b) => sizeAsNumber(a.value) - sizeAsNumber(b.value))
  }, [option.values])

  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between">
        <span className="text-uppercase-tight text-[13px] tracking-[0.18em]">{option.title}</span>
        {value ? <span className="text-[12px] text-rt-ink-500">{value}</span> : null}
      </div>
      <Select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 rounded-[12px] border-rt-ink-100 font-[family-name:var(--font-heading)] text-[15px] font-semibold"
      >
        {!value ? (
          <option value="" disabled>
            Selecciona un tamaño
          </option>
        ) : null}
        {sorted.map((v) => (
          <option key={v.id} value={v.value}>
            {v.value}
          </option>
        ))}
      </Select>
    </div>
  )
}
