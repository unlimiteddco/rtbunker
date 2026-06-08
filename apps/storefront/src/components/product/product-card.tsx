import type { HttpTypes } from '@medusajs/types'
import { ArrowRight } from 'lucide-react'

import { Link } from '@/i18n/routing'
import { formatMoney } from '@/lib/format'

interface ProductCardProps {
  product: HttpTypes.StoreProduct
  locale: string
}

/**
 * ProductCard RT Bunker:
 *   • Aspect 4/5, radius 20, surface blanca, hairline ink-100.
 *   • Hover → translateY(-3px), shadow-md, imagen escala 1.04.
 *   • CTA "Seleccionar opciones" desliza desde el bottom al hover (desktop).
 *   • Badge "Oferta" en pill amarilla esquina superior izquierda si aplica.
 *
 * Range price: muestra min – max si las variantes tienen rango.
 */
export function ProductCard({ product, locale }: ProductCardProps) {
  const handle = product.handle ?? ''
  const variants = product.variants ?? []
  const prices = variants
    .map((v) => v.calculated_price?.calculated_amount)
    .filter((n): n is number => typeof n === 'number' && n > 0)
  const min = prices.length ? Math.min(...prices) : 0
  const max = prices.length ? Math.max(...prices) : 0
  const currency = variants[0]?.calculated_price?.currency_code ?? 'eur'
  const compareAt = variants[0]?.calculated_price?.original_amount ?? undefined
  const onSale = typeof compareAt === 'number' && compareAt > min
  const localeId = `${locale}-${locale.toUpperCase()}`
  const firstCategory = (product.categories ?? [])[0]?.name

  return (
    <Link
      href={`/producto/${handle}`}
      className="group relative block overflow-hidden rounded-[20px] border border-rt-ink-100 bg-rt-white transition-all duration-[220ms] ease-[var(--ease-out-rt)] hover:-translate-y-1 hover:shadow-md focus-visible:-translate-y-1 focus-visible:shadow-md"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-rt-white-2">
        {product.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.thumbnail}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[380ms] ease-[var(--ease-out-rt)] group-hover:scale-[1.04]"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-[12px] uppercase tracking-[0.2em] text-rt-ink-300">
            sin imagen
          </span>
        )}

        {onSale ? (
          <span className="absolute left-3.5 top-3.5 rounded-full bg-rt-yellow px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-rt-black font-[family-name:var(--font-heading)]">
            Oferta
          </span>
        ) : null}

        {/* CTA hidden que sube en hover (solo desktop). */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-[120%] opacity-0 transition-all duration-[280ms] ease-[var(--ease-out-rt)] group-hover:translate-y-0 group-hover:opacity-100"
        >
          <span className="flex w-full items-center justify-between gap-2 rounded-[14px] bg-rt-yellow px-4 py-3 font-[family-name:var(--font-heading)] text-[12px] font-bold uppercase tracking-[0.08em] text-rt-black shadow-md">
            Seleccionar opciones
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 px-4 pb-5 pt-3.5">
        {firstCategory ? (
          <span className="text-eyebrow text-[10px] tracking-[0.18em]">{firstCategory}</span>
        ) : null}
        <h3 className="font-[family-name:var(--font-heading)] text-[16px] font-bold leading-tight text-rt-black line-clamp-2">
          {product.title}
        </h3>
        <p className="mt-1 flex items-baseline gap-1.5">
          {min > 0 && max > min ? (
            <>
              <span className="text-[11px] uppercase tracking-[0.16em] text-rt-ink-500 font-[family-name:var(--font-heading)] font-semibold">
                Desde
              </span>
              <span className="font-[family-name:var(--font-heading)] text-[16px] font-bold tabular-nums">
                {formatMoney(min, currency, localeId)}
              </span>
            </>
          ) : (
            <span className="font-[family-name:var(--font-heading)] text-[16px] font-bold tabular-nums">
              {formatMoney(min, currency, localeId)}
            </span>
          )}
        </p>
      </div>
    </Link>
  )
}
