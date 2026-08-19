'use client'

import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'

interface ShowcaseItem {
  eyebrow: string
  title: string
  description: string
  cta: string
  href: string
  image: string
  alt: string
}

const ITEMS: ShowcaseItem[] = [
  {
    eyebrow: 'Servicio · Car Wrapping',
    title: 'Cambia el color de tu coche sin pintarlo',
    description:
      'Vinilado integral con láminas premium: mate, satinado, brillo o texturas especiales. Acabado de fábrica, reversible y protegiendo la pintura original.',
    cta: 'Ver car wrapping',
    href: '/servicios#car-wrapping',
    image: '/home/car-wrapping.jpg',
    alt: 'Coche de rally con vinilado integral RT Bunker',
  },
  {
    eyebrow: 'Servicio · Car Detailing',
    title: 'Detailing que devuelve el brillo de cero',
    description:
      'Limpieza profunda, corrección de pintura y protección cerámica. Tu coche como el primer día, por dentro y por fuera, en manos de especialistas.',
    cta: 'Ver detailing',
    href: '/servicios',
    image: '/home/car-detailing.jpg',
    alt: 'Proceso de car detailing y pulido de pintura',
  },
  {
    eyebrow: 'Quiénes somos',
    title: 'El taller donde nacen las RT Bunker',
    description:
      'Un equipo obsesionado con el detalle y el vinilo bien puesto. Descubre la historia y la gente que hay detrás de cada pegatina que fabricamos.',
    cta: 'Sobre nosotros',
    href: '/nosotros',
    image: '/home/sobre-nosotros.jpg',
    alt: 'Equipo y taller de RT Bunker',
  },
]

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * Sección "Más que stickers" de la home.
 *
 * En escritorio la sección se ancla a la pantalla (sticky) y los paneles pasan
 * en HORIZONTAL a medida que bajas: el scroll vertical se traduce en
 * desplazamiento en X del carril, con contador y barra de progreso.
 *
 * En móvil no se secuestra el scroll: es un carrusel con `scroll-snap` que se
 * pasa con el dedo. Y si el sistema pide menos movimiento, se degrada a una
 * lista vertical normal. Los tres caminos muestran el mismo contenido.
 */
export function ScrollShowcase() {
  const reduce = useReducedMotion()
  const trackRef = useRef<HTMLDivElement>(null)

  // Recorrido: la sección mide (n+1) pantallas de alto y ese avance se
  // convierte en el desplazamiento horizontal del carril.
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  })
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    mass: 0.4,
  })

  // El desplazamiento va en PÍXELES medidos, no en unidades `vw`: framer no
  // interpola `vw` de forma fiable y el carril se quedaba quieto.
  const [viewportWidth, setViewportWidth] = useState(0)
  useEffect(() => {
    const measure = () => setViewportWidth(window.innerWidth)
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const x = useTransform(progress, [0, 1], [0, -(ITEMS.length - 1) * viewportWidth])

  return (
    <section className="bg-rt-white">
      {/* ─── Encabezado ─────────────────────────────────────── */}
      <div className="container-page pt-20 md:pt-28">
        <motion.header
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="max-w-[760px]"
        >
          <p className="rt-eyebrow text-rt-yellow-deep">Más que stickers</p>
          <h2 className="mt-3 rt-h2 text-balance">
            No solo fabricamos pegatinas. Transformamos coches enteros.
          </h2>
        </motion.header>
      </div>

      {/* ─── Escritorio: carril horizontal anclado ──────────── */}
      {reduce ? null : (
        <div
          ref={trackRef}
          className="relative hidden md:block"
          style={{ height: `${(ITEMS.length + 1) * 100}vh` }}
        >
          <div className="sticky top-0 flex h-screen items-center overflow-hidden">
            <motion.div style={{ x }} className="flex will-change-transform">
              {ITEMS.map((item, i) => (
                <ShowcasePanel key={item.href} item={item} index={i} progress={progress} />
              ))}
            </motion.div>

            {/* Contador + barra de progreso */}
            <div className="pointer-events-none absolute inset-x-0 bottom-10">
              <div className="container-page flex items-center gap-5">
                <Counter progress={progress} />
                <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-rt-ink-100">
                  <motion.div
                    style={{ scaleX: progress }}
                    className="h-full origin-left rounded-full bg-rt-yellow"
                  />
                </div>
                <span className="font-[family-name:var(--font-heading)] text-[11px] font-bold uppercase tracking-[0.22em] text-rt-ink-500">
                  Desliza
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Móvil: carrusel con scroll-snap ────────────────── */}
      <div className="md:hidden">
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-6 pt-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ITEMS.map((item, i) => (
            <article
              key={item.href}
              className="w-[86vw] shrink-0 snap-center rounded-[24px] border border-rt-ink-100 bg-rt-white-2 p-5"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] bg-rt-black">
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  sizes="86vw"
                  className="object-cover"
                />
                <span className="absolute left-4 top-3 font-[family-name:var(--font-display)] text-[40px] leading-none text-rt-white/85 [text-shadow:0_2px_18px_rgba(0,0,0,0.45)]">
                  0{i + 1}
                </span>
              </div>
              <p className="rt-eyebrow mt-5 text-rt-yellow-deep">{item.eyebrow}</p>
              <h3 className="mt-2 font-[family-name:var(--font-display)] text-[26px] uppercase leading-[1.05] tracking-[-0.02em] text-rt-black">
                {item.title}
              </h3>
              <p className="mt-3 text-[15px] leading-[1.6] text-rt-ink-500">{item.description}</p>
              <Button asChild variant="primary" size="lg" className="mt-5">
                <Link href={item.href}>
                  {item.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </article>
          ))}
        </div>
      </div>

      {/* ─── Movimiento reducido: lista vertical simple ─────── */}
      {reduce ? (
        <div className="container-page hidden flex-col gap-14 py-16 md:flex">
          {ITEMS.map((item, i) => (
            <article key={item.href} className="grid items-center gap-8 md:grid-cols-2">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] bg-rt-black">
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  sizes="50vw"
                  className="object-cover"
                />
              </div>
              <div>
                <p className="rt-eyebrow text-rt-yellow-deep">{item.eyebrow}</p>
                <h3 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(28px,3.6vw,44px)] uppercase leading-[1.02] tracking-[-0.02em] text-rt-black">
                  {item.title}
                </h3>
                <p className="mt-4 max-w-[460px] text-[16px] leading-[1.65] text-rt-ink-500">
                  {item.description}
                </p>
                <Button asChild variant="primary" size="lg" className="mt-6">
                  <Link href={item.href}>
                    {item.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <span className="sr-only">{i + 1}</span>
            </article>
          ))}
        </div>
      ) : null}

      <div className="h-16 md:h-24" />
    </section>
  )
}

/**
 * Panel a pantalla completa del carril horizontal. La imagen se mueve un poco
 * en sentido contrario al carril (parallax) para dar profundidad.
 */
function ShowcasePanel({
  item,
  index,
  progress,
}: {
  item: ShowcaseItem
  index: number
  progress: MotionValue<number>
}) {
  // Con N paneles el carril recorre N-1 pantallas, así que el panel `index`
  // queda centrado cuando el avance vale index/(N-1): 0, 0.5 y 1 para tres.
  const steps = Math.max(ITEMS.length - 1, 1)
  const center = index / steps
  const span = 1 / steps

  // Atenúa los paneles que no son el protagonista.
  const opacity = useTransform(progress, [center - span, center, center + span], [0.4, 1, 0.4])
  // Parallax: la imagen se desplaza un poco en sentido contrario al carril.
  const imageX = useTransform(progress, [center - span, center + span], ['10%', '-10%'])

  return (
    <motion.article
      style={{ opacity }}
      className="flex h-screen w-screen shrink-0 items-center"
    >
      <div className="container-page grid w-full items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-16">
        {/* Texto */}
        <div className="max-w-[520px]">
          <span
            aria-hidden
            className="block font-[family-name:var(--font-display)] text-[clamp(56px,7vw,96px)] leading-[0.85] tracking-[-0.03em] text-rt-ink-100"
          >
            0{index + 1}
          </span>
          <p className="rt-eyebrow mt-5 text-rt-yellow-deep">{item.eyebrow}</p>
          <h3 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(30px,3.8vw,52px)] uppercase leading-[1.02] tracking-[-0.02em] text-rt-black text-balance">
            {item.title}
          </h3>
          <p className="mt-5 max-w-[460px] text-[16px] leading-[1.65] text-rt-ink-500">
            {item.description}
          </p>
          <Button asChild variant="primary" size="lg" className="mt-8">
            <Link href={item.href}>
              {item.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Imagen con parallax horizontal */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-[32px] bg-rt-black shadow-[var(--shadow-lg)] lg:aspect-[16/11]">
          <motion.div style={{ x: imageX }} className="absolute -inset-x-[12%] inset-y-0">
            <Image
              src={item.image}
              alt={item.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover"
            />
          </motion.div>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-rt-black/40 via-transparent to-transparent"
          />
        </div>
      </div>
    </motion.article>
  )
}

/** Contador 01 · 02 · 03 ligado al avance del carril. */
function Counter({ progress }: { progress: MotionValue<number> }) {
  return (
    <span className="font-[family-name:var(--font-display)] text-[15px] tracking-[0.08em] text-rt-black">
      {ITEMS.map((item, i) => (
        <CounterItem key={item.href} progress={progress} index={i} />
      ))}
      <span className="text-rt-ink-300"> / 0{ITEMS.length}</span>
    </span>
  )
}

/** Un número del contador: se ilumina cuando su panel está en pantalla. */
function CounterItem({ progress, index }: { progress: MotionValue<number>; index: number }) {
  const steps = Math.max(ITEMS.length - 1, 1)
  const center = index / steps
  const span = 1 / steps
  const opacity = useTransform(progress, [center - span, center, center + span], [0.25, 1, 0.25])
  return (
    <motion.span style={{ opacity }} className="tabular-nums">
      {index === 0 ? '' : ' · '}0{index + 1}
    </motion.span>
  )
}
