'use client'

import { Clock, Loader2, Minus, Plus, ShieldCheck, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { addCustomOrderToCart } from '@/lib/cart'
import { cn } from '@/lib/cn'
import { sdk } from '@/lib/medusa'

import { MaterialSwatch, ShapeGlyph, SizeGlyph } from './glyphs'
import { OptionCard } from './option-card'
import {
  CREDIT_MAX_SIDE_CM,
  CUT_TYPES,
  MATERIALS,
  MAX_DIM_CM,
  MAX_QTY,
  MIN_DIM_CM,
  MIN_QTY,
  SHAPES,
  SIZES,
  computePrice,
  currentDiscount,
  isCreditEligibleSize,
  nextTier,
  priceForArea,
  type CutTypeId,
  type MaterialId,
  type ShapeId,
  type SizeId,
} from './pricing'
import { CM2_PER_SQIN } from './pricing-data'
import { DEFAULT_PRODUCT_TYPE, PRODUCT_TYPES, type ProductTypeId } from './product-types'
import { Upload, type UploadedFile } from './upload'

interface PersonalizadasCompactProps {
  contactEmail?: string
  /** Créditos disponibles del socio (0 si no es socio o no tiene). */
  availableCredits?: number
  /** Tipo de producto con el que arranca el configurador. */
  initialProductType?: ProductTypeId
  /** Renderiza el paso "Tipo de producto" (paso 1). Default true. */
  showTypeStep?: boolean
  /** Renderiza la franja hero interna ("Diseña tu pegatina"). Default true. */
  showHero?: boolean
}

const eur = (n: number) => n.toFixed(2).replace('.', ',') + ' €'
const QUICK_QTY = [15, 50, 100, 500, 1000] as const

/** Atajos de cantidad cuando se paga con créditos (acotados al saldo). */
function creditQuickOptions(max: number): number[] {
  return [1, 5, 10, 25, 50, max].filter((n, i, a) => n >= 1 && n <= max && a.indexOf(n) === i)
}

/**
 * Variante "Sticker Mule" del configurador. Todo cabe en una pantalla:
 *   ┌───────────┬───────────┬───────────┬───────────┐
 *   │ 01 Forma  │ 02 Mat.   │ 03 Tamaño │ 04 Unid.  │
 *   ├───────────┴─────┬─────┴───────────┴───────────┤
 *   │ Sube tu diseño   │ Resumen + total + CTA       │
 *   └─────────────────┴─────────────────────────────┘
 *
 * Optimizado para que el cliente vea forma, material, tamaño, cantidad y
 * precio sin hacer scroll. En móvil colapsa a 1 columna.
 */
export function PersonalizadasCompact({
  contactEmail: _contactEmail = 'info@rtbunker.com',
  availableCredits = 0,
  initialProductType,
  showTypeStep = true,
  showHero = true,
}: PersonalizadasCompactProps) {
  void _contactEmail
  const router = useRouter()
  const [productType, setProductType] = useState<ProductTypeId>(
    initialProductType ?? DEFAULT_PRODUCT_TYPE,
  )
  // Offset de numeración de pasos: si ocultamos "Tipo de producto",
  // los pasos restantes empiezan en 1 (Forma=1 … Sube=5) en vez de 2…6.
  const o = showTypeStep ? 0 : -1
  const [shape, setShape] = useState<ShapeId>('square')
  const [cutType, setCutType] = useState<CutTypeId>('kiss_cut')
  const [material, setMaterial] = useState<MaterialId>('mate')
  const [sizeMode, setSizeMode] = useState<'preset' | 'custom'>('preset')
  const [size, setSize] = useState<SizeId>('m')
  const [customW, setCustomW] = useState('')
  const [customH, setCustomH] = useState('')
  const [units, setUnits] = useState(MIN_QTY)
  const [file, setFile] = useState<UploadedFile | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [payWithCredits, setPayWithCredits] = useState(false)

  const pt = PRODUCT_TYPES.find((p) => p.id === productType)!
  const sh = SHAPES.find((s) => s.id === shape)!
  const ct = CUT_TYPES.find((c) => c.id === cutType)!
  const ma = MATERIALS.find((m) => m.id === material)!
  const sz = SIZES.find((s) => s.id === size)!

  const customDims = useMemo(() => {
    const w = parseFloat(customW)
    const h = parseFloat(customH)
    if (!Number.isFinite(w) || !Number.isFinite(h)) return null
    if (w < MIN_DIM_CM || h < MIN_DIM_CM || w > MAX_DIM_CM || h > MAX_DIM_CM) return null
    return { w, h, cm2: w * h }
  }, [customW, customH])

  // Superficie efectiva en cm² (preset = lado², custom = ancho×alto).
  const cm2 = useMemo(() => {
    if (sizeMode === 'custom') return customDims ? customDims.cm2 : 0
    return sz.cm2
  }, [sizeMode, customDims, sz])

  const sizeLabel =
    sizeMode === 'custom'
      ? customDims
        ? `${customDims.w} × ${customDims.h} cm`
        : 'Sin definir'
      : `${sz.name} · ${sz.dim}`

  // ── Créditos del Club ───────────────────────────────────────
  const creditEligible = isCreditEligibleSize({
    sizeMode,
    sizeId: size,
    width_cm: customDims?.w ?? null,
    height_cm: customDims?.h ?? null,
  })
  const canUseCredits = availableCredits > 0 && creditEligible
  const creditsMode = payWithCredits && canUseCredits

  const minUnits = creditsMode ? 1 : MIN_QTY
  const maxUnits = creditsMode ? Math.min(MAX_QTY, availableCredits) : MAX_QTY

  const clampedUnits = Math.max(minUnits, Math.min(maxUnits, units))
  const creditsUsed = creditsMode ? clampedUnits : 0

  const breakdown = useMemo(
    () => computePrice({ shape: sh, material: ma, cm2, units: clampedUnits }),
    [sh, ma, cm2, clampedUnits],
  )
  const next = nextTier(clampedUnits)
  const discountNow = currentDiscount(clampedUnits, cm2 / CM2_PER_SQIN)
  const ready = cm2 > 0 && Boolean(file)

  function setUnitsSafe(n: number) {
    if (!Number.isFinite(n)) return
    setUnits(Math.max(minUnits, Math.min(maxUnits, Math.floor(n))))
  }

  function toggleCredits() {
    setPayWithCredits((on) => {
      const next = !on
      // Al activar créditos, baja a 1 si el mínimo normal (15) era mayor.
      if (next && units > Math.min(MAX_QTY, availableCredits)) {
        setUnits(Math.min(MAX_QTY, availableCredits))
      } else if (!next && units < MIN_QTY) {
        setUnits(MIN_QTY)
      }
      return next
    })
  }

  async function onSubmit() {
    if (!file) {
      toast.error('Sube tu diseño antes de continuar')
      return
    }
    if (cm2 <= 0) {
      toast.error('Define el tamaño antes de continuar')
      return
    }

    setSubmitting(true)
    try {
      // El SDK fija content-type:application/json por defecto y rompe
      // multipart — hay que neutralizarlo explícitamente.
      const formData = new FormData()
      formData.append('file', file.raw)
      const uploaded = await sdk.client.fetch<{ url: string; name: string }>(
        '/store/custom-orders/upload',
        {
          method: 'POST',
          body: formData,
          headers: { 'content-type': null as unknown as string },
        },
      )

      await addCustomOrderToCart({
        config: {
          product_type: productType,
          shape,
          cut_type: cutType,
          material,
          size_id: sizeMode === 'preset' ? size : null,
          width_cm: sizeMode === 'custom' ? customDims?.w ?? null : null,
          height_cm: sizeMode === 'custom' ? customDims?.h ?? null : null,
        },
        units: clampedUnits,
        unit_price: creditsMode ? 0 : Number(breakdown.unitPrice.toFixed(2)),
        total_price: creditsMode ? 0 : Number(breakdown.total.toFixed(2)),
        credits_used: creditsUsed,
        design_file_url: uploaded.url,
        design_file_name: uploaded.name,
      })

      toast.success(creditsMode ? '¡Canjeado y añadido al carrito!' : '¡Añadido al carrito!')
      router.push('/carrito')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Algo ha fallado'
      toast.error(`No se ha podido añadir al carrito: ${message}`)
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-rt-white-2">
      {/* ─── Hero strip (1 línea) ──────────────────────────── */}
      {showHero ? (
        <section className="container-page pb-4 pt-6 md:pt-10">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-[family-name:var(--font-heading)] text-[11px] font-bold uppercase tracking-[0.22em] text-rt-yellow md:text-[12px]">
                Pegatinas a medida
              </p>
              <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(28px,4.5vw,48px)] uppercase leading-[1.02] tracking-[-0.02em] text-rt-black">
                Diseña tu <span className="text-rt-yellow">pegatina</span>
              </h1>
            </div>
            <p className="max-w-[420px] text-[12px] leading-[1.45] text-rt-ink-500 md:text-[13px]">
              Mín. 15 uds · envío 24–48h · vinilo premium fabricado en España.
            </p>
          </div>
        </section>
      ) : null}

      {/* ─── Tipo de producto (paso 1, ancho completo) ─────── */}
      {showTypeStep ? (
        <section className="container-page pb-4">
          <CompactStep n={1} title="Tipo de producto">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {PRODUCT_TYPES.map((p) => (
                <ProductTypeCard
                  key={p.id}
                  selected={productType === p.id}
                  disabled={!p.enabled}
                  comingSoon={p.comingSoon}
                  onClick={() => {
                    if (p.enabled) setProductType(p.id)
                  }}
                >
                  {p.name}
                </ProductTypeCard>
              ))}
            </div>
          </CompactStep>
        </section>
      ) : null}

      {/* ─── 4 cols (Forma · Acabado · Tamaño · Unidades) ───── */}
      <section className={cn('container-page pb-4', showHero || showTypeStep ? '' : 'pt-6 md:pt-8')}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {/* Step — Forma + tipo de corte */}
          <CompactStep n={2 + o} title="Forma">
            <div className="grid grid-cols-2 gap-2">
              {SHAPES.map((s) => (
                <OptionCard
                  key={s.id}
                  selected={shape === s.id}
                  onClick={() => setShape(s.id)}
                  tag={s.tag}
                  className="!min-h-[88px] !p-2.5"
                >
                  <ShapeGlyph kind={s.id} size={32} />
                  <p className="mt-auto font-[family-name:var(--font-heading)] text-[12px] font-bold leading-tight">
                    {s.name}
                  </p>
                </OptionCard>
              ))}
            </div>
            {/* Tipo de corte */}
            <div className="flex flex-col gap-1.5">
              <span className="font-[family-name:var(--font-heading)] text-[10px] font-bold uppercase tracking-[0.14em] text-rt-ink-500">
                Tipo de corte
              </span>
              <div className="grid grid-cols-2 gap-2">
                {CUT_TYPES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCutType(c.id)}
                    aria-pressed={cutType === c.id}
                    className={cn(
                      'rounded-[12px] border-[1.5px] px-2.5 py-2 text-left transition-colors',
                      cutType === c.id
                        ? 'border-rt-black bg-rt-black text-rt-white'
                        : 'border-rt-ink-100 bg-rt-white text-rt-black hover:border-rt-black',
                    )}
                  >
                    <span className="font-[family-name:var(--font-heading)] text-[12px] font-bold leading-tight">
                      {c.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </CompactStep>

          {/* Step — Acabado */}
          <CompactStep n={3 + o} title="Acabado">
            <div className="grid grid-cols-2 gap-2">
              {MATERIALS.map((m) => (
                <OptionCard
                  key={m.id}
                  selected={material === m.id}
                  onClick={() => setMaterial(m.id)}
                  tag={m.tag}
                  className="!min-h-[88px] !p-2.5"
                >
                  <MaterialSwatch id={m.id} size={32} />
                  <p className="mt-auto font-[family-name:var(--font-heading)] text-[12px] font-bold leading-tight">
                    {m.name}
                  </p>
                </OptionCard>
              ))}
            </div>
          </CompactStep>

          {/* Step — Tamaño */}
          <CompactStep n={4 + o} title="Tamaño">
            {/* 4 tamaños estándar siempre visibles. */}
            <div className="grid grid-cols-2 gap-2">
              {SIZES.map((s) => (
                <OptionCard
                  key={s.id}
                  selected={sizeMode === 'preset' && size === s.id}
                  onClick={() => {
                    setSizeMode('preset')
                    setSize(s.id)
                  }}
                  popular={s.popular}
                  className="!min-h-[88px] !p-2.5"
                >
                  <div
                    className={cn(
                      'flex h-7 items-center justify-center',
                      sizeMode === 'preset' && size === s.id ? 'text-rt-yellow' : 'text-rt-black',
                    )}
                  >
                    <SizeGlyph id={s.id} />
                  </div>
                  <div className="mt-auto">
                    <p className="font-[family-name:var(--font-heading)] text-[12px] font-bold leading-tight">
                      {s.name}
                    </p>
                    <p
                      className={cn(
                        'text-[10px] font-medium',
                        sizeMode === 'preset' && size === s.id
                          ? 'text-rt-ink-300'
                          : 'text-rt-ink-500',
                      )}
                    >
                      {s.dim}
                    </p>
                  </div>
                </OptionCard>
              ))}
            </div>

            {/* Casilla "Otro tamaño" — al click abre los inputs W × H debajo. */}
            <button
              type="button"
              onClick={() => setSizeMode((m) => (m === 'custom' ? 'preset' : 'custom'))}
              aria-pressed={sizeMode === 'custom'}
              className={cn(
                'group flex items-center justify-between rounded-[14px] border-[1.5px] px-3 py-2.5 text-left transition-colors',
                sizeMode === 'custom'
                  ? 'border-rt-black bg-rt-black text-rt-white'
                  : 'border-rt-ink-100 bg-rt-white text-rt-black hover:border-rt-black',
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors',
                    sizeMode === 'custom'
                      ? 'bg-rt-yellow text-rt-black'
                      : 'border border-rt-ink-100 bg-rt-white-2 text-rt-ink-500 group-hover:border-rt-black',
                  )}
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                <span className="flex flex-col">
                  <span className="font-[family-name:var(--font-heading)] text-[12px] font-bold leading-tight">
                    Otro tamaño
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-medium',
                      sizeMode === 'custom' ? 'text-rt-ink-300' : 'text-rt-ink-500',
                    )}
                  >
                    {customDims
                      ? `${customDims.w} × ${customDims.h} cm`
                      : 'Indica ancho y alto en cm'}
                  </span>
                </span>
              </span>
              {customDims ? (
                <span className="font-[family-name:var(--font-heading)] text-[12px] font-bold tabular-nums">
                  {eur(priceForArea(customDims.cm2))}
                </span>
              ) : null}
            </button>

            {sizeMode === 'custom' ? (
              <div className="grid grid-cols-2 gap-2">
                <DimInput label="Ancho" value={customW} onChange={setCustomW} />
                <DimInput label="Alto" value={customH} onChange={setCustomH} />
                <p className="col-span-2 flex items-center justify-between rounded-[10px] bg-rt-white-2 px-2.5 py-1.5 text-[11px] text-rt-ink-500">
                  {customDims ? (
                    <>
                      Superficie:{' '}
                      <b className="text-rt-black tabular-nums">
                        {customDims.cm2.toFixed(0)} cm²
                      </b>
                    </>
                  ) : (
                    <>Rango {MIN_DIM_CM}–{MAX_DIM_CM} cm por lado</>
                  )}
                </p>
              </div>
            ) : null}
          </CompactStep>

          {/* Step — Unidades */}
          <CompactStep n={5 + o} title="Unidades">
            {/* Toggle pagar con créditos (solo socios con saldo) */}
            {availableCredits > 0 ? (
              creditEligible ? (
                <button
                  type="button"
                  onClick={toggleCredits}
                  role="switch"
                  aria-checked={creditsMode}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-[12px] border-[1.5px] px-3 py-2 text-left transition-colors',
                    creditsMode
                      ? 'border-rt-yellow bg-rt-yellow/10'
                      : 'border-rt-ink-100 bg-rt-white hover:border-rt-yellow/60',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-rt-yellow-deep" />
                    <span className="flex flex-col">
                      <span className="font-[family-name:var(--font-heading)] text-[12px] font-bold leading-tight text-rt-black">
                        Pagar con créditos
                      </span>
                      <span className="text-[10px] font-medium text-rt-ink-500">
                        {availableCredits} disponibles · 1 crédito = 1 pegatina
                      </span>
                    </span>
                  </span>
                  <span
                    className={cn(
                      'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
                      creditsMode ? 'bg-rt-yellow' : 'bg-rt-ink-100',
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-3.5 w-3.5 transform rounded-full bg-rt-white transition-transform',
                        creditsMode ? 'translate-x-[18px]' : 'translate-x-1',
                      )}
                    />
                  </span>
                </button>
              ) : (
                <p className="rounded-[10px] bg-rt-white-2 px-2.5 py-1.5 text-[10px] leading-[1.4] text-rt-ink-500">
                  <Sparkles className="mr-1 inline h-3 w-3 text-rt-yellow-deep" />
                  Tienes {availableCredits} créditos. Aplican a tamaños ≤ {CREDIT_MAX_SIDE_CM} cm
                  (pequeña, mediana o a medida).
                </p>
              )
            ) : null}

            <div className="flex flex-wrap gap-1">
              {(creditsMode ? creditQuickOptions(maxUnits) : [...QUICK_QTY]).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setUnitsSafe(n)}
                  aria-pressed={clampedUnits === n}
                  className={cn(
                    'rounded-full px-2.5 py-1 font-[family-name:var(--font-heading)] text-[11px] font-bold tabular-nums transition-colors',
                    clampedUnits === n
                      ? 'bg-rt-black text-rt-white'
                      : 'border border-rt-ink-100 bg-rt-white text-rt-ink-700 hover:bg-rt-white-3',
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setUnitsSafe(clampedUnits - (creditsMode ? 1 : 5))}
                aria-label="Restar"
                disabled={clampedUnits <= minUnits}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-rt-ink-100 bg-rt-white text-rt-black transition-colors hover:border-rt-black disabled:opacity-40"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={minUnits}
                max={maxUnits}
                value={units}
                onChange={(e) => {
                  const n = parseInt(e.target.value || '0', 10)
                  setUnits(Number.isFinite(n) ? n : minUnits)
                }}
                onBlur={() => setUnitsSafe(units)}
                className="h-10 flex-1 rounded-[10px] border border-rt-ink-100 bg-rt-white px-2 text-center font-[family-name:var(--font-heading)] text-[16px] font-bold tabular-nums text-rt-black outline-none focus:border-rt-black"
              />
              <button
                type="button"
                onClick={() => setUnitsSafe(clampedUnits + (creditsMode ? 1 : 5))}
                aria-label="Sumar"
                disabled={clampedUnits >= maxUnits}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-rt-ink-100 bg-rt-white text-rt-black transition-colors hover:border-rt-black disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-rt-ink-500">
              {creditsMode ? (
                <span className="font-semibold text-rt-yellow-deep">
                  Canjearás {creditsUsed} crédito{creditsUsed === 1 ? '' : 's'} · te quedarán{' '}
                  {availableCredits - creditsUsed}
                </span>
              ) : discountNow > 0 ? (
                <span className="font-semibold text-rt-success">−{discountNow}% por volumen aplicado</span>
              ) : next ? (
                <>
                  Sube a{' '}
                  <button
                    type="button"
                    onClick={() => setUnitsSafe(next.at)}
                    className="font-bold text-rt-black underline-offset-2 hover:underline"
                  >
                    {next.at} uds
                  </button>{' '}
                  y ahorra un {next.saves}%
                </>
              ) : null}
            </p>
          </CompactStep>
        </div>
      </section>

      {/* ─── 2 cols abajo ──────────────────────────────────── */}
      <section className="container-page pb-12">
        <div className="grid items-start gap-3 md:grid-cols-[1.5fr_1fr]">
          {/* Subir archivo */}
          <CompactStep n={6 + o} title="Sube tu diseño">
            <Upload file={file} onFile={setFile} onClear={() => setFile(null)} />
          </CompactStep>

          {/* Resumen */}
          <aside className="flex flex-col gap-3 rounded-[16px] border border-rt-ink-100 bg-rt-white p-4 shadow-[var(--shadow-xs)]">
            <header className="flex items-center justify-between">
              <p className="font-[family-name:var(--font-heading)] text-[11px] font-bold uppercase tracking-[0.2em] text-rt-ink-500">
                Resumen
              </p>
              {creditsMode ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rt-yellow px-2 py-0.5 font-[family-name:var(--font-heading)] text-[9px] font-bold uppercase tracking-[0.14em] text-rt-black">
                  <Sparkles className="h-2.5 w-2.5" /> Créditos
                </span>
              ) : discountNow > 0 ? (
                <span className="rounded-full bg-rt-yellow px-2 py-0.5 font-[family-name:var(--font-heading)] text-[9px] font-bold uppercase tracking-[0.14em] text-rt-black">
                  −{discountNow}%
                </span>
              ) : null}
            </header>
            <ul className="flex flex-col gap-1.5 border-y border-rt-ink-100 py-2.5 text-[12px]">
              <SummaryRow label="Producto" value={pt.name} />
              <SummaryRow label="Forma" value={sh.name} />
              <SummaryRow label="Corte" value={ct.name} />
              <SummaryRow label="Acabado" value={ma.name} />
              <SummaryRow label="Tamaño" value={sizeLabel} />
              <SummaryRow label="Unidades" value={String(clampedUnits)} />
              {creditsMode ? (
                <SummaryRow label="Coste" value="1 crédito / ud." muted />
              ) : (
                <SummaryRow label="Precio ud." value={eur(breakdown.unitPrice)} muted />
              )}
            </ul>
            <div className="flex items-baseline justify-between">
              <span className="font-[family-name:var(--font-heading)] text-[11px] font-bold uppercase tracking-[0.18em] text-rt-ink-500">
                Total
              </span>
              {creditsMode ? (
                <span className="inline-flex items-baseline gap-1.5 font-[family-name:var(--font-display)] leading-none tracking-[-0.02em] text-rt-yellow">
                  <span className="text-[clamp(28px,3.5vw,40px)] tabular-nums">{creditsUsed}</span>
                  <span className="text-[14px] font-[family-name:var(--font-heading)] font-bold uppercase">
                    crédito{creditsUsed === 1 ? '' : 's'}
                  </span>
                </span>
              ) : (
                <span className="font-[family-name:var(--font-display)] text-[clamp(28px,3.5vw,40px)] leading-none tracking-[-0.02em] tabular-nums text-rt-yellow">
                  {eur(breakdown.total)}
                </span>
              )}
            </div>
            {creditsMode ? (
              <p className="-mt-2 text-right text-[11px] text-rt-yellow-deep">Envío gratis incluido</p>
            ) : breakdown.savings > 0.01 ? (
              <p className="-mt-2 text-right text-[11px] text-rt-success">
                Ahorras {eur(breakdown.savings)}
              </p>
            ) : null}
            <Button
              type="button"
              variant="primary"
              size="default"
              className="w-full justify-center"
              onClick={onSubmit}
              disabled={!ready || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {creditsMode ? 'Canjeando…' : 'Añadiendo…'}
                </>
              ) : !file ? (
                'Sube un diseño'
              ) : !ready ? (
                'Define el tamaño'
              ) : creditsMode ? (
                `Canjear ${creditsUsed} crédito${creditsUsed === 1 ? '' : 's'} →`
              ) : (
                'Añadir al carrito →'
              )}
            </Button>
            <div className="flex flex-col gap-1 text-[10px] text-rt-ink-500">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-rt-yellow" />
                Envío en 24–48 h
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3 text-rt-yellow" />
                Prueba digital antes de imprimir
              </span>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}

/* ─── Step wrapper compacto ─────────────────────────────── */

function CompactStep({
  n,
  title,
  children,
}: {
  n: number
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-2.5 rounded-[16px] border border-rt-ink-100 bg-rt-white p-3.5">
      <header className="flex items-center gap-2">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rt-white-2 font-[family-name:var(--font-heading)] text-[11px] font-bold tabular-nums text-rt-ink-500">
          {n}
        </span>
        <h3 className="font-[family-name:var(--font-heading)] text-[13px] font-bold uppercase tracking-[0.06em] text-rt-black">
          {title}
        </h3>
      </header>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  )
}

/* ─── Tarjeta de tipo de producto (con estado "Próximamente") ── */

function ProductTypeCard({
  selected,
  disabled = false,
  comingSoon = false,
  onClick,
  children,
}: {
  selected: boolean
  disabled?: boolean | undefined
  comingSoon?: boolean | undefined
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        'relative flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-[14px] border-[1.5px] px-3 py-2.5 text-center transition-colors',
        disabled
          ? 'cursor-not-allowed border-rt-ink-100 bg-rt-white-2 text-rt-ink-300'
          : selected
            ? 'border-rt-black bg-rt-black text-rt-white'
            : 'border-rt-ink-100 bg-rt-white text-rt-black hover:border-rt-black',
      )}
    >
      <span
        className={cn(
          'font-[family-name:var(--font-heading)] text-[12px] font-bold leading-tight',
          disabled && 'line-through decoration-[1.5px]',
        )}
      >
        {children}
      </span>
      {comingSoon ? (
        <span className="font-[family-name:var(--font-heading)] text-[9px] font-bold uppercase tracking-[0.12em] text-rt-ink-300">
          Próximamente
        </span>
      ) : null}
    </button>
  )
}

function DimInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-[family-name:var(--font-heading)] text-[10px] font-bold uppercase tracking-[0.14em] text-rt-ink-500">
        {label}
      </span>
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          min={MIN_DIM_CM}
          max={MAX_DIM_CM}
          step={0.5}
          value={value}
          placeholder="0"
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full rounded-[10px] border border-rt-ink-100 bg-rt-white px-2.5 pr-7 font-[family-name:var(--font-heading)] text-[14px] font-bold tabular-nums text-rt-black outline-none focus:border-rt-black"
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-rt-ink-500">
          cm
        </span>
      </div>
    </label>
  )
}

function SummaryRow({
  label,
  value,
  muted = false,
}: {
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <li className="flex items-baseline justify-between gap-2">
      <span className="text-rt-ink-500">{label}</span>
      <span
        className={cn(
          'text-right font-[family-name:var(--font-heading)] font-bold tabular-nums',
          muted ? 'font-medium text-rt-ink-500' : 'text-rt-black',
        )}
      >
        {value}
      </span>
    </li>
  )
}
