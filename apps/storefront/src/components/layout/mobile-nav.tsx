'use client'

import {
  ChevronDown,
  ChevronRight,
  Crown,
  Info,
  Mail,
  Menu,
  ShieldCheck,
  Sparkles,
  Truck,
  User,
  Wrench,
} from 'lucide-react'
import { useState } from 'react'

import { SearchBar } from '@/components/search/search-bar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Link } from '@/i18n/routing'
import { cn } from '@/lib/cn'
import type { ShopMenuNode } from '@/lib/products'

interface MobileNavProps {
  locale: string
  roots: ShopMenuNode[]
}

const SECONDARY = [
  { href: '/personalizadas', label: 'Personalizadas', icon: Sparkles, badge: 'Nuevo' },
  { href: '/planes', label: 'Hazte socio', icon: Crown, badge: 'Club' },
  { href: '/servicios', label: 'Servicios', icon: Wrench },
  { href: '/nosotros', label: 'Nosotros', icon: Info },
  { href: '/contacto', label: 'Contacto', icon: Mail },
] as const

export function MobileNav({ roots }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const [catsOpen, setCatsOpen] = useState(true)
  const close = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Menú"
          className="-ml-1 inline-flex h-10 w-10 items-center justify-center rounded-[12px] text-rt-white transition-colors hover:bg-rt-black-2 md:hidden"
        >
          <Menu className="h-6 w-6" strokeWidth={2} />
        </button>
      </SheetTrigger>

      <SheetContent side="left" className="flex w-[88%] max-w-sm flex-col gap-0 p-0">
        {/* Cabecera de marca */}
        <SheetHeader className="shrink-0 space-y-0 border-b border-rt-ink-100 px-5 py-4">
          <SheetTitle className="font-[family-name:var(--font-display)] text-[22px] uppercase leading-none tracking-[-0.01em] text-rt-black">
            RT <span className="text-rt-yellow-deep">Bunker</span>
          </SheetTitle>
        </SheetHeader>

        {/* Buscador */}
        <div className="shrink-0 px-5 py-4">
          <SearchBar tone="light" onResultClick={close} />
        </div>

        {/* Cuerpo scrolleable */}
        <div className="flex-1 overflow-y-auto pb-2">
          {/* Categorías de la tienda */}
          <div className="px-5">
            <button
              type="button"
              onClick={() => setCatsOpen((o) => !o)}
              aria-expanded={catsOpen}
              className="flex w-full items-center justify-between py-2"
            >
              <span className="text-eyebrow text-rt-yellow-deep">Categorías</span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-rt-ink-500 transition-transform',
                  catsOpen && 'rotate-180',
                )}
              />
            </button>

            {catsOpen ? (
              <ul className="space-y-1 pb-2">
                {roots.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/categoria/${cat.handle}`}
                      onClick={close}
                      className="group flex items-center gap-3 rounded-[12px] border border-rt-ink-100 bg-rt-white p-2 transition-colors hover:border-rt-yellow hover:bg-rt-white-2"
                    >
                      <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[8px] bg-rt-white-2">
                        {cat.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cat.thumbnail}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1 font-[family-name:var(--font-heading)] text-[13px] font-bold uppercase leading-tight tracking-[0.02em] text-rt-black">
                        {cat.name}
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-rt-ink-300 transition-colors group-hover:text-rt-yellow-deep" />
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/tienda"
                    onClick={close}
                    className="mt-1 flex items-center justify-center gap-1.5 rounded-[12px] bg-rt-black px-3 py-2.5 font-[family-name:var(--font-heading)] text-[12px] font-bold uppercase tracking-[0.14em] text-rt-white transition-colors hover:bg-rt-black-2"
                  >
                    Ver toda la tienda
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </li>
              </ul>
            ) : null}
          </div>

          {/* Navegación secundaria */}
          <nav className="mt-2 border-t border-rt-ink-100 px-3 pt-3">
            {SECONDARY.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className="flex items-center gap-3 rounded-[10px] px-2 py-2.5 text-[15px] font-medium text-rt-black transition-colors hover:bg-rt-white-2"
                >
                  <Icon className="h-[18px] w-[18px] text-rt-ink-500" />
                  {item.label}
                  {'badge' in item && item.badge ? (
                    <span className="ml-1 inline-flex items-center rounded-full bg-rt-yellow px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-rt-black">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Pie: cuenta + confianza */}
        <div className="shrink-0 border-t border-rt-ink-100 bg-rt-white-2 px-5 py-4">
          <Link
            href="/cuenta"
            onClick={close}
            className="mb-3 flex items-center gap-3 rounded-[12px] border border-rt-ink-100 bg-rt-white px-3 py-2.5 text-[14px] font-semibold text-rt-black transition-colors hover:border-rt-yellow"
          >
            <User className="h-[18px] w-[18px] text-rt-ink-500" />
            Mi cuenta
            <ChevronRight className="ml-auto h-4 w-4 text-rt-ink-300" />
          </Link>
          <ul className="space-y-1.5 text-[12px] text-rt-ink-500">
            <li className="flex items-center gap-2">
              <Truck className="h-3.5 w-3.5 text-rt-yellow-deep" />
              Envío 24–48 h a toda España
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-rt-yellow-deep" />
              Vinilo premium fabricado en España
            </li>
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  )
}
