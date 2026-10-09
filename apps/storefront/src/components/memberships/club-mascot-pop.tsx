'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useState } from 'react'

import { cn } from '@/lib/cn'

export interface ClubTip {
  q: string
  a: string
}

/** Cada cuánto cambia sola la pregunta. */
const ROTATE_MS = 6500

/**
 * El "pop" del muñeco de RT Bunker en la cabecera del Club: una burbuja con
 * preguntas rápidas que van rotando solas, con el muñeco al lado como si las
 * contara él. Los puntos permiten saltar a una pregunta concreta.
 *
 * La rotación se detiene mientras el ratón o el foco están encima (para poder
 * leer) y no arranca si el sistema pide menos movimiento.
 */
export function ClubMascotPop({ tips }: { tips: ClubTip[] }) {
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (reduce || paused || tips.length < 2) return
    const id = setInterval(() => setIndex((i) => (i + 1) % tips.length), ROTATE_MS)
    return () => clearInterval(id)
  }, [reduce, paused, tips.length])

  const tip = tips[index]
  if (!tip) return null

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.88, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.25 }}
      className="flex items-end gap-3 lg:h-full lg:flex-col lg:items-stretch lg:justify-end lg:gap-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Burbuja */}
      <div className="relative order-2 flex-1 rounded-[22px] border border-rt-black-3 bg-rt-black-2 p-5 lg:order-1 lg:flex-none">
        <p className="font-[family-name:var(--font-heading)] text-[10px] font-bold uppercase tracking-[0.2em] text-rt-yellow">
          Dudas rápidas
        </p>

        {/* Alto mínimo fijo: la burbuja no salta al cambiar de pregunta. */}
        <div className="mt-2 min-h-[118px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={index}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
            >
              <p className="font-[family-name:var(--font-heading)] text-[15px] font-bold leading-snug text-rt-white">
                {tip.q}
              </p>
              <p className="mt-1.5 text-[13.5px] leading-[1.55] text-rt-ink-300">{tip.a}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {tips.length > 1 ? (
          <div className="mt-3 flex items-center gap-1.5">
            {tips.map((t, i) => (
              <button
                key={t.q}
                type="button"
                aria-label={`Ver la pregunta ${i + 1}: ${t.q}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === index ? 'w-6 bg-rt-yellow' : 'w-1.5 bg-rt-white/25 hover:bg-rt-white/50',
                )}
              />
            ))}
          </div>
        ) : null}

        {/* Rabito de la burbuja, apuntando al muñeco. */}
        <span
          aria-hidden
          className="absolute -left-[7px] bottom-7 h-3.5 w-3.5 rotate-45 border-b border-l border-rt-black-3 bg-rt-black-2 lg:-bottom-[7px] lg:left-auto lg:right-14 lg:border-l-0 lg:border-r"
        />
      </div>

      {/* Muñeco */}
      <div className="order-1 shrink-0 lg:order-2 lg:mt-3 lg:flex lg:justify-end lg:pr-2">
        <Image
          src="/club/mascota.webp"
          alt="El muñeco de RT Bunker"
          width={520}
          height={983}
          sizes="(min-width: 1024px) 110px, 76px"
          priority
          className="h-[124px] w-auto animate-float-slow drop-shadow-[0_10px_24px_rgba(0,0,0,0.55)] lg:h-[178px]"
        />
      </div>
    </motion.div>
  )
}
