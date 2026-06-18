import {
  Boxes,
  CircleDot,
  Layers,
  Shapes,
  Sparkles,
  Sticker,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Reveal } from '@/components/services/reveal'
import { Link } from '@/i18n/routing'

interface StickerType {
  icon: LucideIcon
  name: string
  desc: string
  /** Filtro/búsqueda que abre la tienda con ese tipo. */
  query: string
}

const TYPES: StickerType[] = [
  {
    icon: Sticker,
    name: 'Die-cut',
    desc: 'Recortadas al contorno exacto de tu diseño.',
    query: 'die-cut',
  },
  {
    icon: Layers,
    name: 'En hoja',
    desc: 'Varias pegatinas en una sola lámina kiss-cut.',
    query: 'hoja',
  },
  {
    icon: CircleDot,
    name: 'Troqueladas',
    desc: 'Formas redondas y ovaladas listas para pegar.',
    query: 'troquelada',
  },
  {
    icon: Sparkles,
    name: 'Holográficas',
    desc: 'Acabado iridiscente que cambia con la luz.',
    query: 'holografica',
  },
  {
    icon: Shapes,
    name: 'Vinilo recortado',
    desc: 'Texto y logos en vinilo de corte, sin fondo.',
    query: 'vinilo',
  },
  {
    icon: Boxes,
    name: 'Packs',
    desc: 'Colecciones temáticas a precio cerrado.',
    query: 'pack',
  },
]

/**
 * Tipos de pegatina · grid de entrada a la tienda. Cada tile lleva al
 * catálogo prefiltrado por su tipo. Tarjetas cuadradas con icono amarillo
 * (no circular — coherente con WhyUs), hover de elevación suave.
 */
export function StickerTypes() {
  return (
    <section className="bg-rt-white py-20 md:py-24">
      <div className="container-page">
        <Reveal as="up">
          <header className="mb-10 max-w-[680px] md:mb-12">
            <p className="rt-eyebrow text-rt-yellow-deep">Para cada idea</p>
            <h2 className="mt-3 rt-h2 text-balance">Elige tu tipo de pegatina</h2>
            <p className="mt-4 text-[16px] leading-[1.65] text-rt-ink-500">
              Die-cut, en hoja, holográficas o vinilo de corte. Sea cual sea tu
              proyecto, lo fabricamos con vinilo premium resistente al sol y al
              lavado.
            </p>
          </header>
        </Reveal>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5">
          {TYPES.map(({ icon: Icon, name, desc, query }, i) => (
            <Reveal key={name} as="up" delay={i * 60}>
              <Link
                href={`/tienda?q=${encodeURIComponent(query)}`}
                className="group flex h-full flex-col gap-4 rounded-[20px] border border-rt-ink-100 bg-rt-white-2 p-6 transition-transform duration-300 ease-[var(--ease-out-rt)] hover:-translate-y-1 hover:border-rt-yellow"
              >
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-[14px] bg-rt-yellow text-rt-black transition-transform duration-300 group-hover:scale-105">
                  <Icon className="h-7 w-7" strokeWidth={1.6} />
                </span>
                <h3 className="font-[family-name:var(--font-heading)] text-[20px] font-bold leading-[1.15] text-rt-black md:text-[22px]">
                  {name}
                </h3>
                <p className="text-[14px] leading-[1.6] text-rt-ink-500">{desc}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
