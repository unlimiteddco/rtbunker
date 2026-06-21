'use client'

import { Reveal } from '@/components/services/reveal'

// TODO Nikita: sustituir por logos reales (PNG transparentes) de las marcas
// para las que hemos impreso, cuando los pases. Por ahora son placeholders de
// texto en tipografía display.
const LOGOS = [
  'BMW',
  'Audi',
  'Porsche',
  'Mercedes',
  'Volkswagen',
  'Seat',
  'Cupra',
  'Toyota',
  'Nissan',
  'Subaru',
] as const

/**
 * Marquee horizontal infinito de "logos" de marcas para las que ya hemos
 * impreso. La lista se duplica y se anima con translateX (-50%) para un bucle
 * sin costuras (ver `.animate-marquee` / `@keyframes marquee` en globals.css).
 * Se pausa al hover y respeta prefers-reduced-motion (la animación se desactiva
 * vía la regla global de reduced-motion).
 */
export function PersonalizadasLogosMarquee() {
  // Duplicamos la lista para que el bucle de -50% no muestre el corte.
  const tiles = [...LOGOS, ...LOGOS]

  return (
    <section className="border-y border-rt-ink-100 bg-rt-white py-10 md:py-12">
      <Reveal as="up" className="container-page">
        <p className="text-center font-[family-name:var(--font-heading)] text-[11px] font-bold uppercase tracking-[0.22em] text-rt-ink-500 md:text-[12px]">
          Han confiado en nuestras pegatinas
        </p>
      </Reveal>

      <div
        className="group relative mt-7 overflow-hidden"
        // Máscara de degradado en los bordes para que entren/salgan suaves.
        style={{
          maskImage:
            'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        }}
      >
        <ul className="animate-marquee flex w-max items-center gap-12 group-hover:[animation-play-state:paused] md:gap-16">
          {tiles.map((name, i) => (
            <li
              key={`${name}-${i}`}
              aria-hidden={i >= LOGOS.length}
              className="shrink-0 select-none font-[family-name:var(--font-display)] text-[clamp(22px,3vw,34px)] uppercase leading-none tracking-[0.04em] text-rt-ink-300 transition-colors duration-300 hover:text-rt-black"
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
