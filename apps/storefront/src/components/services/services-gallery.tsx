import Image from 'next/image'

import { Reveal } from '@/components/services/reveal'

interface ShowcaseTile {
  label: string
  category: string
  /** Tono carbón "graduado" para distinguir tiles sin imágenes reales. */
  tone: 'a' | 'b' | 'c'
  /** Tamaño relativo dentro del mosaico. */
  span?: 'wide' | 'tall' | 'normal'
  /** Texto display que va estampado dentro del tile (fallback sin imagen). */
  stamp: string
  /** Foto real del trabajo. Si falta, se usa el estampado/gradiente. */
  image?: string
}

// TODO Nikita: reemplazar los placeholders de /servicios/*.jpg por fotos reales de cada trabajo.
const TILES: ShowcaseTile[] = [
  { label: 'BMW M3 · Negro mate', category: 'Chrome delete', tone: 'a', span: 'wide', stamp: 'M3', image: '/servicios/chrome-delete.jpg' },
  { label: 'Audi RS6 · Capó carbón', category: 'Car design', tone: 'b', stamp: 'RS6' },
  { label: 'Mercedes G63 · Full wrap', category: 'Full wrap', tone: 'c', span: 'tall', stamp: 'G63', image: '/servicios/full-wrap.jpg' },
  { label: 'Golf R · Faros 35%', category: 'Ahumado', tone: 'a', stamp: 'GOLF' },
  { label: 'Porsche 992 · Stripes', category: 'Car design', tone: 'c', stamp: '992', image: '/servicios/detailing.jpg' },
  { label: 'Furgo Sprinter · Branding', category: 'Rotulación', tone: 'b', span: 'wide', stamp: 'BUNKER', image: '/servicios/branding.jpg' },
]

const TONE_BG: Record<ShowcaseTile['tone'], string> = {
  a: 'bg-gradient-to-br from-rt-black via-rt-black-2 to-rt-black-3',
  b: 'bg-gradient-to-tr from-rt-black-3 via-rt-black-2 to-rt-black',
  c: 'bg-gradient-to-bl from-rt-black to-rt-black-3',
}

const SPAN_CLASS: Record<NonNullable<ShowcaseTile['span']>, string> = {
  wide: 'md:col-span-2',
  tall: 'md:row-span-2',
  normal: '',
}

export function ServicesGallery() {
  return (
    <section className="bg-rt-black py-20 text-rt-white md:py-28">
      <div className="container-page">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <Reveal as="up" className="max-w-[640px]">
            <p className="rt-eyebrow text-rt-yellow">Trabajos recientes</p>
            <h2 className="mt-3 rt-h2 text-balance text-rt-white">
              Cada coche que pasa por aquí se va con su mejor versión.
            </h2>
          </Reveal>
          <Reveal as="up" delay={120}>
            <p className="max-w-[360px] text-[14px] leading-[1.65] text-rt-ink-300">
              Una selección rotativa de proyectos finalizados en Cuarte de Huerva. Pídenos el
              porfolio completo y referencias reales.
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid auto-rows-[220px] grid-cols-1 gap-4 md:grid-cols-3 md:auto-rows-[260px]">
          {TILES.map((tile, i) => (
            <Reveal
              key={tile.label}
              as={i % 2 === 0 ? 'scale' : 'up'}
              delay={(i % 3) * 100}
              className={SPAN_CLASS[tile.span ?? 'normal']}
            >
              <ShowcaseCard tile={tile} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function ShowcaseCard({ tile }: { tile: ShowcaseTile }) {
  return (
    <article
      className={`group relative h-full w-full overflow-hidden rounded-[24px] border border-rt-black-3 ${TONE_BG[tile.tone]}`}
    >
      {tile.image ? (
        <>
          {/* Foto real del trabajo */}
          <Image
            src={tile.image}
            alt={tile.label}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-cover transition-transform duration-[700ms] ease-[var(--ease-out-rt)] group-hover:scale-105"
          />
          {/* Velo para legibilidad de tags/labels */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-rt-black/70 via-rt-black/10 to-rt-black/20"
          />
        </>
      ) : (
        /* Stamp display (fallback sin imagen) */
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <span
            className="font-[family-name:var(--font-display)] text-rt-white/10 transition-transform duration-[700ms] ease-[var(--ease-out-rt)] group-hover:scale-110"
            style={{
              fontSize: 'clamp(72px, 11vw, 180px)',
              letterSpacing: '-0.04em',
              lineHeight: 0.9,
            }}
          >
            {tile.stamp}
          </span>
        </span>
      )}

      {/* Light sweep */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rt-yellow/0 via-rt-yellow/0 to-rt-yellow/15 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />

      {/* Tag */}
      <span className="absolute left-5 top-5 rounded-full border border-rt-white/15 bg-rt-black/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-rt-yellow font-[family-name:var(--font-heading)] backdrop-blur">
        {tile.category}
      </span>

      {/* Label inferior */}
      <span className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-3">
        <span className="font-[family-name:var(--font-heading)] text-[14px] font-bold uppercase tracking-[0.1em] text-rt-white">
          {tile.label}
        </span>
        <span
          aria-hidden
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rt-yellow text-rt-black transition-transform duration-300 group-hover:rotate-45"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4">
            <path d="M7 17 17 7M9 7h8v8" />
          </svg>
        </span>
      </span>
    </article>
  )
}
