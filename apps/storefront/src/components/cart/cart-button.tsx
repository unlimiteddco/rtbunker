'use client'

import { useTranslations } from 'next-intl'

import { openCartDrawer } from '@/components/cart/cart-store'

interface CartButtonProps {
  itemCount: number
}

/**
 * Botón del carrito en el header. Renderiza un icono custom (estilo
 * Lucide cart-3, alineado con el resto de los iconos del design system) y
 * un badge amarillo si hay artículos.
 */
export function CartButton({ itemCount }: CartButtonProps) {
  const t = useTranslations('nav')
  return (
    <button
      type="button"
      onClick={() => openCartDrawer()}
      aria-label={t('cart')}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-[12px] text-rt-white transition-colors hover:bg-rt-black-2"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[22px] w-[22px]"
      >
        <path d="M3 4h2l2.4 12.5a2 2 0 0 0 2 1.5h7.6a2 2 0 0 0 2-1.5L21 8H6" />
        <circle cx="9" cy="21" r="1.4" />
        <circle cx="18" cy="21" r="1.4" />
      </svg>
      {itemCount > 0 ? (
        <span
          aria-live="polite"
          className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rt-yellow px-1 text-[11px] font-bold text-rt-black font-[family-name:var(--font-heading)]"
        >
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      ) : null}
    </button>
  )
}
