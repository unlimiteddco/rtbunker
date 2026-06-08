'use client'

import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Link } from '@/i18n/routing'
import { cn } from '@/lib/cn'
import type { ShopMenuNode } from '@/lib/products'

const MARCAS_HANDLE = 'marcas-de-coches'

interface ShopMegaMenuProps {
  roots: ShopMenuNode[]
  linkClass: string
}

export function ShopMegaMenu({ roots, linkClass }: ShopMegaMenuProps) {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function show() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }
  function hideSoon() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), 120)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const marcas = roots.find((r) => r.handle === MARCAS_HANDLE)
  const cards = roots.filter((r) => r.handle !== MARCAS_HANDLE)

  return (
    <div className="static" onMouseEnter={show} onMouseLeave={hideSoon}>
      <Link
        href="/tienda"
        className={cn(linkClass, 'relative')}
        aria-expanded={open}
        onFocus={show}
      >
        Shop stickers
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </Link>

      {/* Panel full-width fijo bajo el header (top = altura del header). */}
      <div
        onMouseEnter={show}
        onMouseLeave={hideSoon}
        className={cn(
          'fixed inset-x-0 top-16 z-40 origin-top border-y border-rt-black-3 bg-rt-white text-rt-black shadow-[var(--shadow-lg)] transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] md:top-[72px]',
          open
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-2 opacity-0',
        )}
      >
        <div className="container-page grid gap-8 py-7 md:grid-cols-[1fr_minmax(200px,260px)] md:py-9">
          {/* Categorías con foto */}
          <div>
            <p className="text-eyebrow mb-4 text-rt-yellow-deep">Categorías</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {cards.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categoria/${cat.handle}`}
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-3 rounded-[14px] border border-rt-ink-100 bg-rt-white p-2 transition-colors hover:border-rt-yellow hover:bg-rt-white-2"
                >
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[10px] bg-rt-white-2">
                    {cat.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cat.thumbnail}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0 font-[family-name:var(--font-heading)] text-[13px] font-bold uppercase leading-tight tracking-[0.02em] text-rt-black">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>

            <Link
              href="/tienda"
              onClick={() => setOpen(false)}
              className="mt-5 inline-flex items-center gap-1.5 font-[family-name:var(--font-heading)] text-[12px] font-bold uppercase tracking-[0.16em] text-rt-black hover:text-rt-yellow-deep"
            >
              Ver toda la tienda →
            </Link>
          </div>

          {/* Marcas de coches */}
          {marcas && marcas.children.length > 0 ? (
            <div className="md:border-l md:border-rt-ink-100 md:pl-8">
              <Link
                href={`/categoria/${marcas.handle}`}
                onClick={() => setOpen(false)}
                className="text-eyebrow mb-4 inline-block text-rt-yellow-deep hover:text-rt-black"
              >
                {marcas.name} →
              </Link>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {marcas.children.map((brand) => (
                  <li key={brand.id}>
                    <Link
                      href={`/categoria/${brand.handle}`}
                      onClick={() => setOpen(false)}
                      className="block truncate text-[13px] font-medium text-rt-ink-700 transition-colors hover:text-rt-black"
                    >
                      {brand.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
