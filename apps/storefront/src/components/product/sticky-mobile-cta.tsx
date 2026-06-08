'use client'

import { ShoppingBag } from 'lucide-react'
import { useEffect, useState } from 'react'

import { formatMoney } from '@/lib/format'

interface StickyMobileCtaProps {
  amount: number
  currency: string
  locale: string
  /** Selector del CTA principal en el flow. Cuando es visible NO mostramos
   *  la sticky bar (para no duplicar el precio + botón). */
  targetSelector?: string
}

/**
 * Barra fija en móvil con precio + CTA. Aparece SOLO cuando:
 *   1. El usuario ha scrolleado por debajo del fold inicial, y
 *   2. El CTA principal del bloque de variantes está fuera del viewport.
 *
 * Si el card CTA está visible, mantenemos la sticky oculta para no enseñar
 * dos precios y dos botones a la vez.
 */
export function StickyMobileCta({
  amount,
  currency,
  locale,
  targetSelector = '#pdp-add-to-cart',
}: StickyMobileCtaProps) {
  const [scrolled, setScrolled] = useState(false)
  const [ctaVisible, setCtaVisible] = useState(true)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 400)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const el = document.querySelector<HTMLElement>(targetSelector)
    if (!el || typeof IntersectionObserver === 'undefined') return
    const obs = new IntersectionObserver(
      ([entry]) => setCtaVisible(entry.isIntersecting),
      { rootMargin: '-20px 0px -20px 0px', threshold: 0.1 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [targetSelector])

  const show = scrolled && !ctaVisible

  function focusCta() {
    const el = document.querySelector<HTMLElement>(targetSelector)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el?.focus()
  }

  return (
    <div
      aria-hidden={!show}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-rt-ink-100 bg-rt-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur transition-transform duration-300 md:hidden ${
        show ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="font-[family-name:var(--font-heading)] text-[20px] font-extrabold tabular-nums text-rt-black">
          {formatMoney(amount, currency, `${locale}-${locale.toUpperCase()}`)}
        </span>
        <button
          type="button"
          onClick={focusCta}
          className="ml-auto inline-flex h-11 items-center gap-2 rounded-[14px] bg-rt-yellow px-5 font-[family-name:var(--font-heading)] text-[12px] font-bold uppercase tracking-[0.08em] text-rt-black shadow-xs active:translate-y-0 active:shadow-none"
        >
          <ShoppingBag className="h-3.5 w-3.5" /> Añadir
        </button>
      </div>
    </div>
  )
}
