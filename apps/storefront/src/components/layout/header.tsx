import { Crown } from 'lucide-react'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

import { CartButton } from '@/components/cart/cart-button'
import { MobileNav } from '@/components/layout/mobile-nav'
import { ShopMegaMenu } from '@/components/layout/shop-mega-menu'
import { MobileSearchButton } from '@/components/search/mobile-search-button'
import { SearchBar } from '@/components/search/search-bar'
import { Link } from '@/i18n/routing'
import { getCart } from '@/lib/cart'
import { getShopMenuData } from '@/lib/products'

interface HeaderProps {
  locale: string
}

/**
 * Header al estilo RT Bunker: barra carbón con el LOGO CENTRADO, navegación a
 * la izquierda y acciones (buscador, cuenta, carrito) a la derecha.
 *
 * La barra es una rejilla de tres columnas `[1fr_auto_1fr]`: las dos laterales
 * miden lo mismo por definición, así que el logo cae siempre en el centro
 * exacto sin depender de lo que ocupen nav y acciones.
 */
export async function Header({ locale }: HeaderProps) {
  const t = await getTranslations('nav')
  const cart = await getCart()
  const itemCount = (cart?.items ?? []).reduce((sum, i) => sum + i.quantity, 0)
  const shopMenu = await getShopMenuData()

  const linkClass =
    'inline-flex items-center gap-1.5 font-[family-name:var(--font-heading)] font-bold uppercase text-[12px] tracking-[0.18em] text-rt-white/90 transition-colors hover:text-rt-yellow'

  return (
    <header className="sticky top-0 z-40 border-b border-rt-black-3 bg-rt-black text-rt-white">
      <div className="container-page grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 md:h-[72px]">
        {/* ─── Izquierda: navegación ─────────────────────────── */}
        <div className="flex min-w-0 items-center">
          <MobileNav locale={locale} roots={shopMenu} />

          <nav className="hidden items-center gap-7 md:flex lg:gap-8">
            <ShopMegaMenu roots={shopMenu} linkClass={linkClass} />
            <Link href="/servicios" className={linkClass}>
              Servicios
            </Link>
            <Link href="/personalizadas" className={linkClass}>
              Personalizadas
            </Link>
          </nav>
        </div>

        {/* ─── Centro: logo ──────────────────────────────────── */}
        {/* `py-3` le da al enlace ~48 px de alto real: con solo la altura del
            logo (24 px) el área para pulsar se quedaba muy corta en móvil y
            costaba acertar para volver al inicio. */}
        <Link
          href="/"
          aria-label="RT Bunker · inicio"
          className="flex items-center justify-center py-3"
        >
          {/* width/height al tamaño en el que se ve (x2 para pantallas retina).
              Con las medidas del archivo original (1166 px) Next servía una
              imagen de 3840 px para pintarla a 150: tardaba en aparecer. */}
          <Image
            src="/logo-white.png"
            alt="RT Bunker"
            width={350}
            height={56}
            priority
            className="h-6 w-auto md:h-7"
          />
        </Link>

        {/* ─── Derecha: acciones ─────────────────────────────── */}
        <div className="flex min-w-0 items-center justify-end gap-1 md:gap-2">
          <Link
            href="/planes"
            className="mr-1 hidden items-center gap-1.5 rounded-full bg-rt-yellow px-3 py-1.5 font-[family-name:var(--font-heading)] text-[12px] font-bold uppercase tracking-wider text-rt-black transition-colors hover:bg-rt-yellow-deep lg:inline-flex"
          >
            <Crown className="h-3.5 w-3.5" />
            Club
          </Link>

          <div className="hidden xl:block xl:w-56">
            <SearchBar />
          </div>
          <MobileSearchButton
            label={t('search')}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] text-rt-white transition-colors hover:bg-rt-black-2 xl:hidden"
          />

          <Link
            href="/cuenta"
            aria-label={t('account')}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] text-rt-white transition-colors hover:bg-rt-black-2"
          >
            <UserIcon />
          </Link>

          <CartButton itemCount={itemCount} />
        </div>
      </div>
    </header>
  )
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="h-5 w-5"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  )
}
