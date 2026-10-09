import { ArrowDown, Crown } from 'lucide-react'
import Image from 'next/image'

import { Reveal } from '@/components/services/reveal'

import { ClubMascotPop, type ClubTip } from './club-mascot-pop'

/** Preguntas rápidas del "pop": versión corta de las FAQ del Club. */
const TIPS: ClubTip[] = [
  {
    q: '¿Cómo funcionan los créditos?',
    a: 'Cada mes recibes créditos y los canjeas por pegatinas personalizadas: 1 crédito, 1 pegatina.',
  },
  {
    q: '¿De qué tamaño son las pegatinas?',
    a: 'Los créditos valen para pegatinas de 5, 7 y 9 cm, en cualquier acabado.',
  },
  {
    q: '¿Las diseñáis vosotros?',
    a: 'Tú subes tu diseño o tu logo; nosotros lo imprimimos y te lo enviamos.',
  },
  {
    q: '¿Qué es el Fast Pass?',
    a: 'Tus pedidos pasan primero: normalmente se imprimen en 24 horas.',
  },
  {
    q: '¿Puedo cancelar cuando quiera?',
    a: 'Sí, sin cargos. Los créditos que ya tengas siguen siendo tuyos hasta que los uses.',
  },
]

/**
 * Cabecera del RT Bunker Club, al estilo de la referencia que pasó el cliente:
 * a la izquierda una tarjeta grande con el contenido (qué es el Club) y las
 * pegatinas de muestra asomando; a la derecha el "pop" del muñeco con dudas
 * rápidas que van rotando.
 *
 * Sigue siendo una cabecera carbón como las del resto de páginas; solo cambia
 * lo que hay dentro.
 */
export function ClubHero() {
  return (
    <section className="relative overflow-hidden bg-rt-black text-rt-white">
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-grid-carbon opacity-50" />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-rt-yellow/20 blur-3xl"
      />

      <div className="container-page relative grid gap-5 py-10 md:py-14 lg:min-h-[480px] lg:grid-cols-[minmax(0,1fr)_320px] lg:items-stretch lg:gap-6">
        {/* ─── Izquierda: tarjeta de contenido ───────────────────── */}
        <Reveal as="up" className="h-full">
          <div className="relative flex h-full min-h-[340px] flex-col justify-center overflow-hidden rounded-[28px] bg-gradient-to-br from-rt-yellow via-rt-yellow to-rt-yellow-deep p-7 text-rt-black md:p-10">
            <div className="relative z-10 md:max-w-[52%]">
              <p className="inline-flex items-center gap-2 rounded-full bg-rt-black px-3.5 py-1.5 font-[family-name:var(--font-heading)] text-[11px] font-bold uppercase tracking-[0.18em] text-rt-yellow">
                <Crown className="h-3.5 w-3.5" /> RT Bunker Club
              </p>
              <h1 className="mt-5 font-[family-name:var(--font-display)] text-[clamp(34px,5vw,62px)] uppercase leading-[0.95] tracking-[-0.02em]">
                Hazte socio y produce más
              </h1>
              <p className="mt-4 max-w-[440px] text-[15px] font-medium leading-[1.6] text-rt-black/80 md:text-[16px]">
                Créditos mensuales para pegatinas personalizadas, envío urgente gratis, impresión
                el mismo día y descuento en todos tus pedidos. Cancela cuando quieras.
              </p>
              <a
                href="#planes"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-rt-black px-5 py-3 font-[family-name:var(--font-heading)] text-[12px] font-bold uppercase tracking-[0.14em] text-rt-white transition-colors hover:bg-rt-black-2"
              >
                Ver planes <ArrowDown className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Pegatinas de muestra. En móvil van debajo del texto; en
                escritorio asoman por la derecha de la tarjeta. */}
            <div
              aria-hidden
              className="pointer-events-none relative mx-auto mt-7 h-[190px] w-full max-w-[340px] md:absolute md:inset-y-0 md:right-0 md:mt-0 md:h-auto md:w-[46%] md:max-w-none"
            >
              <Image
                src="/club/hojas-pegatinas.webp"
                alt=""
                width={1000}
                height={823}
                sizes="(min-width: 768px) 30vw, 300px"
                className="absolute bottom-0 right-0 w-[78%] rotate-[5deg] drop-shadow-[0_18px_30px_rgba(0,0,0,0.35)] md:-right-[6%] md:bottom-[4%] md:w-[88%]"
              />
              <Image
                src="/club/sticker-coche.webp"
                alt=""
                width={900}
                height={639}
                sizes="(min-width: 768px) 22vw, 220px"
                priority
                className="absolute left-0 top-0 w-[62%] -rotate-[9deg] drop-shadow-[0_14px_24px_rgba(0,0,0,0.35)] md:left-[2%] md:top-[8%] md:w-[60%]"
              />
            </div>
          </div>
        </Reveal>

        {/* ─── Derecha: el pop del muñeco ────────────────────────── */}
        <ClubMascotPop tips={TIPS} />
      </div>
    </section>
  )
}
