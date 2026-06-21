'use client'

import { Check } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

interface OptionCardProps {
  selected: boolean
  onClick: () => void
  children: ReactNode
  /** "+20%", "+35%" — Acompañamiento al multiplicador. */
  tag?: string | undefined
  /** "Top" / "Más elegido" badge. */
  popular?: boolean | undefined
  className?: string | undefined
}

/**
 * Botón-tarjeta para cualquier opción del configurador. Cuando está
 * seleccionado pasa a fondo carbón con texto blanco + stamp amarillo en
 * la esquina superior izquierda.
 */
export function OptionCard({
  selected,
  onClick,
  children,
  tag,
  popular,
  className,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'relative flex min-h-[120px] flex-col gap-2.5 rounded-[16px] border-[1.5px] p-4 text-left transition-all duration-[200ms] ease-[var(--ease-out-rt)]',
        selected
          ? 'border-rt-black bg-rt-black text-rt-white'
          : 'border-rt-ink-100 bg-rt-white text-rt-black hover:border-rt-black',
        className,
      )}
    >
      {selected ? (
        <span
          aria-hidden
          className="absolute -left-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-rt-yellow text-rt-black shadow-[0_4px_10px_rgba(10,186,181,0.45)]"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
      ) : null}

      {tag && !selected ? (
        <span className="absolute right-2.5 top-2.5 rounded-full bg-rt-yellow-soft px-2 py-0.5 font-[family-name:var(--font-heading)] text-[10px] font-bold tracking-[0.1em] text-rt-black">
          {tag}
        </span>
      ) : null}

      {popular ? (
        <span
          className={cn(
            'absolute right-2.5 top-2.5 rounded-full px-2 py-0.5 font-[family-name:var(--font-heading)] text-[10px] font-bold uppercase tracking-[0.14em]',
            selected ? 'bg-rt-yellow text-rt-black' : 'bg-rt-black text-rt-white',
          )}
        >
          Top
        </span>
      ) : null}

      {children}
    </button>
  )
}
