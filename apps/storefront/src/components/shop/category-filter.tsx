'use client'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { Link } from '@/i18n/routing'
import { cn } from '@/lib/cn'

export interface CategoryNode {
  id: string
  name: string
  handle: string
  children: { id: string; name: string; handle: string }[]
}

interface CategoryFilterProps {
  tree: CategoryNode[]
  active?: string | undefined
  label: string
}

/**
 * Filtro lateral de la tienda con jerarquía categoría → subcategorías.
 * Las subcategorías van ocultas por defecto y se despliegan con el chevron.
 * Si el filtro activo es una subcategoría, su grupo arranca abierto.
 */
export function CategoryFilter({ tree, active, label }: CategoryFilterProps) {
  const initiallyOpen = () => {
    const open = new Set<string>()
    for (const root of tree) {
      if (root.children.some((c) => c.handle === active)) open.add(root.id)
    }
    return open
  }
  const [openIds, setOpenIds] = useState<Set<string>>(initiallyOpen)
  // En móvil el panel arranca plegado para no tapar los productos.
  const [mobileOpen, setMobileOpen] = useState(false)

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const rootClass = (isActive: boolean) =>
    cn(
      'block rounded-md px-2 py-1.5 font-[family-name:var(--font-heading)] text-[13px] font-bold uppercase tracking-[0.04em] transition-colors',
      isActive ? 'bg-rt-yellow/20 text-rt-black' : 'text-rt-black hover:bg-rt-white-2',
    )

  return (
    <div>
      <button
        type="button"
        onClick={() => setMobileOpen((o) => !o)}
        aria-expanded={mobileOpen}
        className="mb-3 flex w-full items-center justify-between md:pointer-events-none md:mb-3"
      >
        <span className="text-eyebrow">{label}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-rt-ink-500 transition-transform md:hidden',
            mobileOpen && 'rotate-180',
          )}
        />
      </button>
      <ul className={cn('space-y-0.5 md:block', mobileOpen ? 'block' : 'hidden')}>
        <li>
          <Link href="/tienda" className={rootClass(!active)}>
            Todas
          </Link>
        </li>

        {tree.map((root) => {
          const hasKids = root.children.length > 0
          const isOpen = openIds.has(root.id)
          const rootActive = active === root.handle
          return (
            <li key={root.id}>
              {hasKids ? (
                <div className="flex items-center gap-1">
                  <Link href={`/categoria/${root.handle}`} className={cn(rootClass(rootActive), 'flex-1')}>
                    {root.name}
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggle(root.id)}
                    aria-expanded={isOpen}
                    aria-label={isOpen ? `Contraer ${root.name}` : `Desplegar ${root.name}`}
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-rt-ink-500 transition-colors hover:bg-rt-white-2 hover:text-rt-black"
                  >
                    <ChevronDown
                      className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
                    />
                  </button>
                </div>
              ) : (
                <Link href={`/categoria/${root.handle}`} className={rootClass(rootActive)}>
                  {root.name}
                </Link>
              )}

              {hasKids && isOpen ? (
                <ul className="my-1 ml-3 space-y-0.5 border-l border-rt-ink-100 pl-2">
                  {root.children.map((kid) => {
                    const kidActive = active === kid.handle
                    return (
                      <li key={kid.id} className="relative">
                        <span
                          aria-hidden
                          className="absolute -left-2 top-1/2 h-px w-2 -translate-y-1/2 bg-rt-ink-100"
                        />
                        <Link
                          href={`/categoria/${kid.handle}`}
                          className={cn(
                            'block rounded-md px-2 py-1.5 text-[13px] transition-colors',
                            kidActive
                              ? 'bg-rt-yellow/20 font-semibold text-rt-black'
                              : 'text-rt-ink-700 hover:bg-rt-white-2 hover:text-rt-black',
                          )}
                        >
                          {kid.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
