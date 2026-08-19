import { CircleDot, Files, Sparkle, Sparkles, Sticker } from 'lucide-react'
import type { ComponentType } from 'react'

import {
  PRODUCT_TYPES,
  type ProductTypeId,
} from '@/components/personalizadas/product-types'
import { Reveal } from '@/components/services/reveal'
import { Link } from '@/i18n/routing'
import { cn } from '@/lib/cn'

// Mismo mapeo de iconos que el picker de /personalizadas (Nikita pondrá fotos
// reales más adelante). Se duplica aquí para no convertir la home en client
// component: el picker es interactivo, esta versión solo enlaza.
const TYPE_ICONS: Record<ProductTypeId, ComponentType<{ className?: string }>> = {
  vinyls: Sticker,
  sheets: Files,
  holo: Sparkles,
  glitter: Sparkle,
  chrome: CircleDot,
}

/**
 * "Elige tu producto" en la home · misma pieza visual que el selector de
 * /personalizadas (`PersonalizadasProductPicker`), pero SIN configurador
 * inline: cada tarjeta activa enlaza a /personalizadas con el tipo elegido en
 * el query param `?tipo=` (el picker aún no lo lee; el enlace funciona igual).
 * Las tarjetas "Próximamente" se muestran tachadas y no son enlazables.
 */
export function StickerTypes() {
  return (
    <section className="bg-rt-white-2 py-20 md:py-24">
      <div className="container-page">
        <Reveal as="up" className="mx-auto max-w-[640px] text-center">
          <p className="rt-eyebrow text-rt-yellow-deep">Empieza por aquí</p>
          <h2 className="mt-3 rt-h2 text-balance text-rt-black">Elige tu producto</h2>
          <p className="mt-4 text-[16px] leading-[1.65] text-rt-ink-500">
            Selecciona un tipo de pegatina y te llevamos al configurador para diseñar la
            tuya al instante.
          </p>
        </Reveal>

        {/* ─── Grid de 5 tarjetas grandes ─────────────────────── */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {PRODUCT_TYPES.map((p, i) => {
            const Icon = TYPE_ICONS[p.id]
            const disabled = !p.enabled

            const inner = (
              <>
                <span
                  className={cn(
                    'inline-flex h-16 w-16 items-center justify-center rounded-full transition-colors',
                    disabled
                      ? 'bg-rt-white-3 text-rt-ink-300'
                      : 'bg-rt-yellow/15 text-rt-yellow-deep group-hover:bg-rt-yellow group-hover:text-rt-black',
                  )}
                >
                  <Icon className="h-7 w-7" />
                </span>

                <h3
                  className={cn(
                    'mt-5 font-[family-name:var(--font-heading)] text-[17px] font-bold leading-tight',
                    disabled
                      ? 'text-rt-ink-300 line-through decoration-[1.5px]'
                      : 'text-rt-black',
                  )}
                >
                  {p.name}
                </h3>

                {p.desc ? (
                  <p className="mt-2 text-[13px] leading-[1.5] text-rt-ink-500">{p.desc}</p>
                ) : null}

                {disabled ? (
                  <span className="mt-4 inline-flex items-center rounded-full bg-rt-white-3 px-3 py-1 font-[family-name:var(--font-heading)] text-[10px] font-bold uppercase tracking-[0.14em] text-rt-ink-300">
                    Próximamente
                  </span>
                ) : (
                  <span className="mt-4 inline-flex items-center font-[family-name:var(--font-heading)] text-[11px] font-bold uppercase tracking-[0.14em] text-rt-ink-500 transition-colors group-hover:text-rt-black">
                    Diseñar →
                  </span>
                )}
              </>
            )

            return (
              <Reveal key={p.id} as="up" delay={i * 70} className="h-full">
                {disabled ? (
                  <div
                    aria-disabled
                    className="group flex h-full w-full cursor-not-allowed flex-col items-center rounded-[24px] border-[1.5px] border-rt-ink-100 bg-rt-white-2 p-6 text-center opacity-70"
                  >
                    {inner}
                  </div>
                ) : (
                  <Link
                    href={`/personalizadas?tipo=${p.id}`}
                    className="group flex h-full w-full flex-col items-center rounded-[24px] border-[1.5px] border-rt-ink-100 bg-rt-white p-6 text-center transition-all duration-200 hover:-translate-y-1 hover:border-rt-black hover:shadow-[var(--shadow-md)]"
                  >
                    {inner}
                  </Link>
                )}
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
