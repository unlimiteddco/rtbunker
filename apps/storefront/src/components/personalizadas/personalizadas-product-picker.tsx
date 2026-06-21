'use client'

import { CircleDot, Files, Sparkle, Sparkles, Sticker } from 'lucide-react'
import { useEffect, useState, type ComponentType } from 'react'

import { Reveal } from '@/components/services/reveal'
import { cn } from '@/lib/cn'

import { PersonalizadasCompact } from './personalizadas-compact'
import { PRODUCT_TYPES, type ProductTypeId } from './product-types'

interface PersonalizadasProductPickerProps {
  /** Créditos disponibles del socio (0 si no es socio o no tiene). */
  availableCredits?: number
}

// Icono lucide por tipo de producto (Nikita pondrá fotos reales más adelante).
const TYPE_ICONS: Record<ProductTypeId, ComponentType<{ className?: string }>> = {
  vinyls: Sticker,
  sheets: Files,
  holo: Sparkles,
  glitter: Sparkle,
  chrome: CircleDot,
}

/**
 * Selector de tipo de producto a lo Sticker Shuttle: el configurador NO se
 * muestra hasta que el usuario clica un tipo activo. Al seleccionar uno aparece
 * `PersonalizadasCompact` justo debajo (sin su hero ni el paso "Tipo"), con ese
 * tipo ya fijado, y hacemos scroll suave hacia el ancla #configurador.
 */
export function PersonalizadasProductPicker({
  availableCredits = 0,
}: PersonalizadasProductPickerProps) {
  const [selected, setSelected] = useState<ProductTypeId | null>(null)

  // Scroll suave hacia el configurador cuando se selecciona (o cambia) un tipo.
  useEffect(() => {
    if (selected === null) return
    document
      .getElementById('configurador')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [selected])

  return (
    <section className="bg-rt-white-2 py-20 md:py-24">
      <div className="container-page">
        <Reveal as="up" className="mx-auto max-w-[640px] text-center">
          <p className="rt-eyebrow text-rt-yellow-deep">Empieza por aquí</p>
          <h2 className="mt-3 rt-h2 text-balance text-rt-black">Elige tu producto</h2>
          <p className="mt-4 text-[16px] leading-[1.65] text-rt-ink-500">
            Selecciona un tipo de pegatina para abrir el configurador y diseñar la tuya al instante.
          </p>
        </Reveal>

        {/* ─── Grid de 5 tarjetas grandes ─────────────────────── */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {PRODUCT_TYPES.map((p, i) => {
            const Icon = TYPE_ICONS[p.id]
            const isSelected = selected === p.id
            const disabled = !p.enabled

            return (
              <Reveal key={p.id} as="up" delay={i * 70} className="h-full">
                <button
                  type="button"
                  disabled={disabled}
                  aria-pressed={isSelected}
                  onClick={() => {
                    if (p.enabled) setSelected(p.id)
                  }}
                  className={cn(
                    'group flex h-full w-full flex-col items-center rounded-[24px] border-[1.5px] p-6 text-center transition-all duration-200',
                    disabled
                      ? 'cursor-not-allowed border-rt-ink-100 bg-rt-white-2 opacity-70'
                      : isSelected
                        ? 'border-rt-black bg-rt-white shadow-[var(--shadow-md)] ring-2 ring-rt-yellow'
                        : 'border-rt-ink-100 bg-rt-white hover:-translate-y-1 hover:border-rt-black hover:shadow-[var(--shadow-md)]',
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex h-16 w-16 items-center justify-center rounded-full transition-colors',
                      disabled
                        ? 'bg-rt-white-3 text-rt-ink-300'
                        : isSelected
                          ? 'bg-rt-yellow text-rt-black'
                          : 'bg-rt-yellow/15 text-rt-yellow-deep group-hover:bg-rt-yellow group-hover:text-rt-black',
                    )}
                  >
                    <Icon className="h-7 w-7" />
                  </span>

                  <h3
                    className={cn(
                      'mt-5 font-[family-name:var(--font-heading)] text-[17px] font-bold leading-tight',
                      disabled ? 'text-rt-ink-300 line-through decoration-[1.5px]' : 'text-rt-black',
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
                    <span
                      className={cn(
                        'mt-4 inline-flex items-center font-[family-name:var(--font-heading)] text-[11px] font-bold uppercase tracking-[0.14em] transition-colors',
                        isSelected
                          ? 'text-rt-yellow-deep'
                          : 'text-rt-ink-500 group-hover:text-rt-black',
                      )}
                    >
                      {isSelected ? 'Seleccionado' : 'Diseñar →'}
                    </span>
                  )}
                </button>
              </Reveal>
            )
          })}
        </div>

        {/* ─── Texto guía antes de seleccionar ────────────────── */}
        {selected === null ? (
          <p className="mt-10 text-center text-[14px] font-medium text-rt-ink-500">
            Elige un tipo de producto para empezar a diseñar.
          </p>
        ) : null}
      </div>

      {/* ─── Configurador embebido (solo tras seleccionar) ────── */}
      {selected !== null ? (
        <div id="configurador" className="mt-12 scroll-mt-24">
          <PersonalizadasCompact
            key={selected}
            initialProductType={selected}
            showTypeStep={false}
            showHero={false}
            availableCredits={availableCredits}
          />
        </div>
      ) : null}
    </section>
  )
}
