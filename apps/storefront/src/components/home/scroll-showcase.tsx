'use client'

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { useRef } from 'react'

import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'
import { cn } from '@/lib/cn'

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
 * Sección "Más que stickers" de la home. Cada fila revela una foto con
 * parallax ligado al scroll (framer-motion `useScroll` + `useTransform`) y un
 * CTA a otra parte de la web. Respeta `prefers-reduced-motion`.
 */
export function ScrollShowcase() {
  return (
    <section className="overflow-hidden bg-rt-white py-20 md:py-28">
      <div className="container-page">
        <motion.header
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="max-w-[720px]"
        >
          <p className="rt-eyebrow text-rt-yellow-deep">Más que stickers</p>
          <h2 className="mt-3 rt-h2 text-balance">
            No solo fabricamos pegatinas. Transformamos coches enteros.
          </h2>
        </motion.header>

        <div className="mt-16 flex flex-col gap-20 md:mt-20 md:gap-28">
          {ITEMS.map((item, i) => (
            <ShowcaseRow key={item.href} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ShowcaseRow({ item, index }: { item: ShowcaseItem; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  // Parallax vertical de la imagen dentro de su marco.
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['-12%', '12%'])
  const reversed = index % 2 === 1

  return (
    <div className="grid items-center gap-7 md:grid-cols-2 md:gap-14">
      {/* Imagen con parallax */}
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: EASE }}
        className={cn(
          'relative aspect-[4/3] overflow-hidden rounded-[28px] bg-rt-black shadow-[var(--shadow-lg)]',
          reversed && 'md:order-2',
        )}
      >
        <motion.div style={{ y }} className="absolute inset-x-0 -inset-y-[12%]">
          <Image
            src={item.image}
            alt={item.alt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </motion.div>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-rt-black/45 via-transparent to-transparent"
        />
        <span className="absolute left-5 top-5 font-[family-name:var(--font-display)] text-[clamp(40px,6vw,64px)] leading-none text-rt-white/85 [text-shadow:0_2px_18px_rgba(0,0,0,0.45)]">
          0{index + 1}
        </span>
      </motion.div>

      {/* Texto + CTA */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.05 }}
        className={cn(reversed && 'md:order-1')}
      >
        <p className="rt-eyebrow text-rt-yellow-deep">{item.eyebrow}</p>
        <h3 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(28px,3.6vw,44px)] uppercase leading-[1.02] tracking-[-0.02em] text-rt-black text-balance">
          {item.title}
        </h3>
        <p className="mt-4 max-w-[460px] text-[16px] leading-[1.65] text-rt-ink-500">
          {item.description}
        </p>
        <Button asChild variant="primary" size="lg" className="mt-7">
          <Link href={item.href}>
            {item.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </motion.div>
    </div>
  )
}
