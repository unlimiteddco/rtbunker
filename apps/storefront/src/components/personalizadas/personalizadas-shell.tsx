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

interface PersonalizadasShellProps {
  contactEmail?: string
}

const eur = (n: number) => n.toFixed(2).replace('.', ',') + ' €'
const QUICK_QTY = [15, 50, 100, 250, 500, 1000] as const

export function PersonalizadasShell({
  contactEmail: _contactEmail = 'info@rtbunker.com',
}: PersonalizadasShellProps) {
  void _contactEmail
  const router = useRouter()
  const [productType, setProductType] = useState<ProductTypeId>(DEFAULT_PRODUCT_TYPE)
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

  const pt = PRODUCT_TYPES.find((p) => p.id === productType)!
  const sh = SHAPES.find((s) => s.id === shape)!
  const ct = CUT_TYPES.find((c) => c.id === cutType)!
  const ma = MATERIALS.find((m) => m.id === material)!
  const sz = SIZES.find((s) => s.id === size)!

  /* ─── precio según modo de tamaño ──────────────────────── */
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

  const clampedUnits = Math.max(MIN_QTY, Math.min(MAX_QTY, units))
  const breakdown = useMemo(
    () =>
      computePrice({
        shape: sh,
        material: ma,
        cm2,
        units: clampedUnits,
      }),
    [sh, ma, cm2, clampedUnits],
  )

  const next = nextTier(clampedUnits)
  const discountNow = currentDiscount(clampedUnits, cm2 / CM2_PER_SQIN)
  const ready = cm2 > 0 && Boolean(file)

  /* ─── helpers de qty ───────────────────────────────────── */
  function setUnitsSafe(n: number) {
    if (!Number.isFinite(n)) return
    setUnits(Math.max(MIN_QTY, Math.min(MAX_QTY, Math.floor(n))))
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
      // 1. Subir el archivo al backend (R2).
      //    El SDK fija content-type:application/json por defecto y rompe
      //    multipart — hay que neutralizarlo explícitamente (truco oficial,
      //    ver @medusajs/js-sdk/admin/upload.js).
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

      // 2. Añadir al carrito con config + price override + metadata.
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
        unit_price: Number(breakdown.unitPrice.toFixed(2)),
        total_price: Number(breakdown.total.toFixed(2)),
        design_file_url: uploaded.url,
        design_file_name: uploaded.name,
      })

      toast.success('¡Añadido al carrito! Pasa por checkout para pagar.')
      router.push('/carrito')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Algo ha fallado'
      toast.error(`No se ha podido añadir al carrito: ${message}`)
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-rt-white-2">
      {/* ─── Hero ──────────────────────────────────────────── */}
      <section className="container-page pb-6 pt-10 md:pb-10 md:pt-16">
        <p className="font-[family-name:var(--font-heading)] text-[12px] font-bold uppercase tracking-[0.22em] text-rt-yellow md:text-[13px]">
          <Sparkles className="-mt-1 mr-2 inline h-3 w-3" />
          Personalizadas · Diseño a medida
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(40px,7vw,80px)] uppercase leading-[0.96] tracking-[-0.02em] text-rt-black">
          Diseña tu <span className="text-rt-yellow">pegatina</span>
        </h1>
        <p className="mt-3 max-w-[620px] text-[15px] leading-[1.55] text-rt-ink-700 md:text-[16px]">
          Sube tu archivo, configura forma, material, tamaño y cantidad. Te calculamos el precio al
          instante. Mínimo 15 unidades · envío en 24–48 h.
        </p>
      </section>

      {/* ─── Configurador 2×2 + Resumen sticky ─────────────── */}
      <section className="container-page pb-10">
        <div className="grid items-start gap-5 lg:grid-cols-[1.7fr_1fr]">
          {/* Steps */}
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Step n={1} title="Tipo de producto">
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
                  {PRODUCT_TYPES.map((p) => (
                    <ProductTypeCard
                      key={p.id}
                      selected={productType === p.id}
                      disabled={!p.enabled}
                      comingSoon={p.comingSoon}
                      onClick={() => {
                        if (p.enabled) setProductType(p.id)
                      }}
                      desc={p.desc}
                    >
                      {p.name}
                    </ProductTypeCard>
                  ))}
                </div>
              </Step>
            </div>

            <Step n={2} title="Forma">
              <div className="grid grid-cols-2 gap-2.5">
                {SHAPES.map((s) => (
                  <OptionCard
                    key={s.id}
                    selected={shape === s.id}
                    onClick={() => setShape(s.id)}
                    tag={s.tag}
                  >
                    <ShapeGlyph kind={s.id} />
                    <div className="mt-auto">
                      <p className="font-[family-name:var(--font-heading)] text-[13px] font-bold">
                        {s.name}
                      </p>
                      <p
                        className={`mt-0.5 text-[11px] font-medium ${
                          shape === s.id ? 'text-rt-ink-300' : 'text-rt-ink-500'
                        }`}
                      >
                        {s.desc}
                      </p>
                    </div>
                  </OptionCard>
                ))}
              </div>

              {/* Tipo de corte */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-rt-ink-500 font-[family-name:var(--font-heading)]">
                  Tipo de corte
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  {CUT_TYPES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCutType(c.id)}
                      aria-pressed={cutType === c.id}
                      className={cn(
                        'rounded-[14px] border-[1.5px] px-3.5 py-2.5 text-left transition-colors',
                        cutType === c.id
                          ? 'border-rt-black bg-rt-black text-rt-white'
                          : 'border-rt-ink-100 bg-rt-white text-rt-black hover:border-rt-black',
                      )}
                    >
                      <p className="font-[family-name:var(--font-heading)] text-[13px] font-bold">
                        {c.name}
                      </p>
                      <p
                        className={`mt-0.5 text-[11px] font-medium leading-[1.4] ${
                          cutType === c.id ? 'text-rt-ink-300' : 'text-rt-ink-500'
                        }`}
                      >
                        {c.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </Step>

            <Step n={3} title="Acabado">
              <div className="grid grid-cols-2 gap-2.5">
                {MATERIALS.map((m) => (
                  <OptionCard
                    key={m.id}
                    selected={material === m.id}
                    onClick={() => setMaterial(m.id)}
                    tag={m.tag}
                  >
                    <MaterialSwatch id={m.id} />
                    <div className="mt-auto">
                      <p className="font-[family-name:var(--font-heading)] text-[13px] font-bold">
                        {m.name}
                      </p>
                      <p
                        className={`mt-0.5 text-[11px] font-medium leading-[1.4] ${
                          material === m.id ? 'text-rt-ink-300' : 'text-rt-ink-500'
                        }`}
                      >
                        {m.desc}
                      </p>
                    </div>
                  </OptionCard>
                ))}
              </div>
            </Step>

            <Step n={4} title="Tamaño">
              {/* Toggle preset / custom */}
              <div className="inline-flex rounded-full border border-rt-ink-100 bg-rt-white-2 p-1 text-[12px] font-bold uppercase tracking-[0.12em] font-[family-name:var(--font-heading)]">
                <button
                  type="button"
                  onClick={() => setSizeMode('preset')}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 transition-colors',
                    sizeMode === 'preset' ? 'bg-rt-black text-rt-white' : 'text-rt-ink-500',
                  )}
                >
                  Estándar
                </button>
                <button
                  type="button"
                  onClick={() => setSizeMode('custom')}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 transition-colors',
                    sizeMode === 'custom' ? 'bg-rt-black text-rt-white' : 'text-rt-ink-500',
                  )}
                >
                  Otro tamaño
                </button>
              </div>

              {sizeMode === 'preset' ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {SIZES.map((s) => (
                    <OptionCard
                      key={s.id}
                      selected={size === s.id}
                      onClick={() => setSize(s.id)}
                      popular={s.popular}
                    >
                      <div
                        className={cn(
                          'flex min-h-[64px] items-center justify-center rounded-[10px] p-2',
                          size === s.id ? 'bg-rt-black-3 text-rt-yellow' : 'bg-rt-white-2 text-rt-black',
                        )}
                      >
                        <SizeGlyph id={s.id} />
                      </div>
                      <div className="mt-auto">
                        <p className="font-[family-name:var(--font-heading)] text-[13px] font-bold">
                          {s.name}
                        </p>
                        <p
                          className={`mt-0.5 text-[11px] font-medium ${
                            size === s.id ? 'text-rt-ink-300' : 'text-rt-ink-500'
                          }`}
                        >
                          {s.dim} · {eur(s.base)}
                        </p>
                      </div>
                    </OptionCard>
                  ))}
                </div>
              ) : (
                <CustomSize
                  w={customW}
                  h={customH}
                  onW={setCustomW}
                  onH={setCustomH}
                  dims={customDims}
                />
              )}
            </Step>

            <Step n={5} title="Unidades">
              <div className="flex flex-wrap gap-1.5">
                {QUICK_QTY.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setUnitsSafe(n)}
                    aria-pressed={clampedUnits === n}
                    className={cn(
                      'rounded-full px-3 py-1.5 font-[family-name:var(--font-heading)] text-[12px] font-bold tabular-nums transition-colors',
                      clampedUnits === n
                        ? 'bg-rt-black text-rt-white'
                        : 'bg-rt-white text-rt-ink-700 hover:bg-rt-white-3 border border-rt-ink-100',
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Stepper grande */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUnitsSafe(clampedUnits - 5)}
                  aria-label="Restar 5"
                  disabled={clampedUnits <= MIN_QTY}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-[12px] border border-rt-ink-100 bg-rt-white text-rt-black transition-colors hover:border-rt-black disabled:opacity-40"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  min={MIN_QTY}
                  max={MAX_QTY}
                  step={1}
                  value={units}
                  onChange={(e) => {
                    const n = parseInt(e.target.value || '0', 10)
                    setUnits(Number.isFinite(n) ? n : MIN_QTY)
                  }}
                  onBlur={() => setUnitsSafe(units)}
                  className="h-12 flex-1 rounded-[12px] border border-rt-ink-100 bg-rt-white px-4 text-center font-[family-name:var(--font-heading)] text-[20px] font-bold tabular-nums text-rt-black outline-none focus:border-rt-black"
                />
                <button
                  type="button"
                  onClick={() => setUnitsSafe(clampedUnits + 5)}
                  aria-label="Sumar 5"
                  disabled={clampedUnits >= MAX_QTY}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-[12px] border border-rt-ink-100 bg-rt-white text-rt-black transition-colors hover:border-rt-black disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <p className="text-[11px] text-rt-ink-500">
                Mínimo {MIN_QTY} · máximo {MAX_QTY.toLocaleString('es-ES')} unidades
              </p>

              {/* Tier hint */}
              <div className="rounded-[12px] bg-rt-white p-3 text-[12px]">
                {discountNow > 0 ? (
                  <p className="font-medium text-rt-success">
                    ✓ Ahorras {discountNow}% por volumen
                  </p>
                ) : (
                  <p className="text-rt-ink-500">Sin descuento todavía</p>
                )}
                {next ? (
                  <p className="mt-1 text-rt-ink-500">
                    Llega a{' '}
                    <button
                      type="button"
                      onClick={() => setUnitsSafe(next.at)}
                      className="font-bold text-rt-black underline-offset-2 hover:underline"
                    >
                      {next.at}
                    </button>{' '}
                    unidades y ahorra {next.saves}%.
                  </p>
                ) : (
                  <p className="mt-1 text-rt-ink-500">Estás en el mejor tier disponible 🎉</p>
                )}
              </div>
            </Step>
          </div>

          {/* Resumen sticky */}
          <Summary
            productType={pt.name}
            shape={sh.name}
            cutType={ct.name}
            material={ma.name}
            sizeLabel={sizeLabel}
            units={clampedUnits}
            unitPrice={breakdown.unitPrice}
            total={breakdown.total}
            savings={breakdown.savings}
            discount={discountNow}
            ready={ready}
            hasFile={Boolean(file)}
            submitting={submitting}
            onSubmit={onSubmit}
          />
        </div>
      </section>

      {/* ─── Upload ────────────────────────────────────────── */}
      <section className="container-page pb-10">
        <Step n={6} title="Sube tu diseño">
          <Upload file={file} onFile={setFile} onClear={() => setFile(null)} />
        </Step>
      </section>

      {/* ─── FAQ strip ─────────────────────────────────────── */}
      <section className="container-page pb-20 pt-2">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              t: 'Calidad fabricada en España',
              b: 'Vinilo premium certificado por RT Bunker. Resistente a UV, lavado a presión y temperaturas extremas.',
            },
            {
              t: 'Pedidos muy grandes',
              b: '¿Necesitas más de 5.000 unidades? Escríbenos a info@rtbunker.com y te preparamos presupuesto a medida.',
            },
            {
              t: 'Diseño difuso',
              b: 'Si tu archivo no llega en calidad suficiente, te lo redibujamos gratis antes de imprimir.',
            },
          ].map((b) => (
            <article
              key={b.t}
              className="rounded-[18px] border border-rt-ink-100 bg-rt-white p-5"
            >
              <h4 className="font-[family-name:var(--font-heading)] text-[16px] font-bold text-rt-black">
                {b.t}
              </h4>
              <p className="mt-2 text-[14px] leading-[1.55] text-rt-ink-500">{b.b}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

/* ─── Step wrapper ─────────────────────────────────────────── */

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-[20px] border border-rt-ink-100 bg-rt-white p-5 shadow-[var(--shadow-xs)] md:p-6">
      <header className="flex items-baseline gap-3">
        <span className="font-[family-name:var(--font-display)] text-[28px] leading-none tracking-[-0.02em] text-rt-yellow md:text-[32px]">
          0{n}
        </span>
        <h3 className="font-[family-name:var(--font-heading)] text-[17px] font-bold tracking-[-0.005em] text-rt-black md:text-[18px]">
          {title}
        </h3>
      </header>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}

/* ─── Tarjeta de tipo de producto (con estado "Próximamente") ── */

function ProductTypeCard({
  selected,
  disabled = false,
  comingSoon = false,
  onClick,
  desc,
  children,
}: {
  selected: boolean
  disabled?: boolean | undefined
  comingSoon?: boolean | undefined
  onClick: () => void
  desc?: string | undefined
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        'relative flex min-h-[84px] flex-col items-start justify-center gap-1 rounded-[16px] border-[1.5px] px-3.5 py-3 text-left transition-colors',
        disabled
          ? 'cursor-not-allowed border-rt-ink-100 bg-rt-white-2 text-rt-ink-300'
          : selected
            ? 'border-rt-black bg-rt-black text-rt-white'
            : 'border-rt-ink-100 bg-rt-white text-rt-black hover:border-rt-black',
      )}
    >
      <span
        className={cn(
          'font-[family-name:var(--font-heading)] text-[13px] font-bold leading-tight',
          disabled && 'line-through decoration-[1.5px]',
        )}
      >
        {children}
      </span>
      {comingSoon ? (
        <span className="font-[family-name:var(--font-heading)] text-[9px] font-bold uppercase tracking-[0.14em] text-rt-ink-300">
          Próximamente
        </span>
      ) : desc ? (
        <span
          className={cn(
            'text-[11px] font-medium leading-[1.35]',
            selected ? 'text-rt-ink-300' : 'text-rt-ink-500',
          )}
        >
          {desc}
        </span>
      ) : null}
    </button>
  )
}

/* ─── Custom size W × H ────────────────────────────────────── */

interface CustomSizeProps {
  w: string
  h: string
  onW: (v: string) => void
  onH: (v: string) => void
  dims: { w: number; h: number; cm2: number } | null
}

function CustomSize({ w, h, onW, onH, dims }: CustomSizeProps) {
  const previewBase = dims ? priceForArea(dims.cm2) : 0
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2.5">
        <DimInput label="Ancho" value={w} onChange={onW} />
        <DimInput label="Alto" value={h} onChange={onH} />
      </div>
      <div className="flex items-center justify-between rounded-[12px] bg-rt-white-2 px-3.5 py-2.5">
        <span className="text-[12px] text-rt-ink-500">
          {dims ? (
            <>
              Superficie: <b className="text-rt-black tabular-nums">{dims.cm2.toFixed(0)} cm²</b>
            </>
          ) : (
            'Introduce ancho y alto en cm'
          )}
        </span>
        <span className="font-[family-name:var(--font-heading)] text-[13px] font-bold tabular-nums text-rt-black">
          {dims ? eur(previewBase) : '—'}
        </span>
      </div>
      <p className="text-[11px] text-rt-ink-500">
        Rango: {MIN_DIM_CM}–{MAX_DIM_CM} cm por lado.
      </p>
    </div>
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
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-rt-ink-500 font-[family-name:var(--font-heading)]">
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
          className="h-12 w-full rounded-[12px] border border-rt-ink-100 bg-rt-white px-3.5 pr-10 font-[family-name:var(--font-heading)] text-[16px] font-bold tabular-nums text-rt-black outline-none focus:border-rt-black"
        />
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] font-medium text-rt-ink-500">
          cm
        </span>
      </div>
    </label>
  )
}

/* ─── Resumen sticky ──────────────────────────────────────── */

interface SummaryProps {
  productType: string
  shape: string
  cutType: string
  material: string
  sizeLabel: string
  units: number
  unitPrice: number
  total: number
  savings: number
  discount: number
  ready: boolean
  hasFile: boolean
  submitting: boolean
  onSubmit: () => void
}

function Summary({
  productType,
  shape,
  cutType,
  material,
  sizeLabel,
  units,
  unitPrice,
  total,
  savings,
  discount,
  ready,
  hasFile,
  submitting,
  onSubmit,
}: SummaryProps) {
  return (
    <aside className="flex flex-col gap-5 rounded-[20px] border border-rt-ink-100 bg-rt-white p-6 shadow-[var(--shadow-xs)] lg:sticky lg:top-24">
      <header className="flex items-center justify-between">
        <p className="font-[family-name:var(--font-heading)] text-[12px] font-bold uppercase tracking-[0.22em] text-rt-ink-500">
          Resumen
        </p>
        {discount > 0 ? (
          <span className="rounded-full bg-rt-yellow px-2.5 py-0.5 font-[family-name:var(--font-heading)] text-[10px] font-bold uppercase tracking-[0.16em] text-rt-black">
            −{discount}%
          </span>
        ) : null}
      </header>

      <ul className="flex flex-col gap-2.5 border-y border-rt-ink-100 py-4 text-[14px]">
        <SummaryRow label="Producto" value={productType} />
        <SummaryRow label="Forma" value={shape} />
        <SummaryRow label="Corte" value={cutType} />
        <SummaryRow label="Acabado" value={material} />
        <SummaryRow label="Tamaño" value={sizeLabel} />
        <SummaryRow label="Unidades" value={String(units)} />
        <SummaryRow
          label="Precio unidad"
          value={eur(unitPrice)}
          muted
        />
      </ul>

      <div className="flex items-baseline justify-between">
        <span className="font-[family-name:var(--font-heading)] text-[12px] font-bold uppercase tracking-[0.18em] text-rt-ink-500">
          Total
        </span>
        <span className="font-[family-name:var(--font-display)] text-[clamp(36px,5vw,52px)] leading-none tracking-[-0.02em] tabular-nums text-rt-yellow">
          {eur(total)}
        </span>
      </div>

      {savings > 0.01 ? (
        <p className="-mt-3 text-right text-[12px] text-rt-success">
          Ahorras {eur(savings)}
        </p>
      ) : null}

      <Button
        type="button"
        variant="primary"
        size="lg"
        className="w-full justify-center"
        onClick={onSubmit}
        disabled={!ready || submitting}
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Añadiendo al carrito…
          </>
        ) : !hasFile ? (
          'Sube un diseño para continuar'
        ) : !ready ? (
          'Define el tamaño'
        ) : (
          'Añadir al carrito →'
        )}
      </Button>

      <div className="flex flex-col gap-2 text-[12px] text-rt-ink-500">
        <span className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-rt-yellow" />
          Envío en 24–48 h a toda España
        </span>
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-rt-yellow" />
          Prueba digital antes de imprimir
        </span>
      </div>
    </aside>
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
    <li className="flex items-baseline justify-between gap-3">
      <span className="text-rt-ink-500">{label}</span>
      <span
        className={cn(
          'text-right font-[family-name:var(--font-heading)] font-bold tabular-nums',
          muted ? 'text-rt-ink-500 font-medium' : 'text-rt-black',
        )}
      >
        {value}
      </span>
    </li>
  )
}
