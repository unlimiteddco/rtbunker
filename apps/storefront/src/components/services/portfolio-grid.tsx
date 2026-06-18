'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'

import { PortfolioDetailModal } from '@/components/services/portfolio-detail-modal'
import {
  PORTFOLIO,
  SERVICE_TYPES,
  SERVICE_TYPE_LABELS,
  type PortfolioWork,
  type ServiceType,
} from '@/lib/portfolio'

type Filter = ServiceType | 'all'

/**
 * Rejilla compacta y filtrable del portafolio. Al hacer click en un
 * trabajo se abre el modal de detalle (`PortfolioDetailModal`).
 * Solo se muestran filtros con al menos un trabajo.
 */
export function PortfolioGrid() {
  const [filter, setFilter] = useState<Filter>('all')
  const [activeWork, setActiveWork] = useState<PortfolioWork | null>(null)
  const [open, setOpen] = useState(false)

  // Categorías que tienen al menos un trabajo (evita filtros vacíos).
  const availableTypes = useMemo(
    () => SERVICE_TYPES.filter((t) => PORTFOLIO.some((w) => w.serviceType === t)),
    [],
  )

  const works = useMemo(
    () => (filter === 'all' ? PORTFOLIO : PORTFOLIO.filter((w) => w.serviceType === filter)),
    [filter],
  )

  const openWork = (work: PortfolioWork) => {
    setActiveWork(work)
    setOpen(true)
  }

  return (
    <>
      {/* Filtros */}
      <div className="mt-10 flex flex-wrap gap-2">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
          Todos
        </FilterChip>
        {availableTypes.map((type) => (
          <FilterChip key={type} active={filter === type} onClick={() => setFilter(type)}>
            {SERVICE_TYPE_LABELS[type]}
          </FilterChip>
        ))}
      </div>

      {/* Rejilla */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {works.map((work) => (
          <PortfolioCard key={work.id} work={work} onClick={() => openWork(work)} />
        ))}
      </div>

      <PortfolioDetailModal work={activeWork} open={open} onOpenChange={setOpen} />
    </>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-2 text-[12px] font-bold uppercase tracking-[0.12em] transition-colors font-[family-name:var(--font-heading)] ${
        active
          ? 'border-rt-yellow bg-rt-yellow text-rt-black'
          : 'border-rt-black-3 bg-rt-black-2 text-rt-ink-300 hover:border-rt-white/30 hover:text-rt-white'
      }`}
    >
      {children}
    </button>
  )
}

function PortfolioCard({ work, onClick }: { work: PortfolioWork; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ver detalle: ${work.title}`}
      className="group relative block aspect-[4/3] w-full overflow-hidden rounded-[20px] border border-rt-black-3 bg-rt-black-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-rt-yellow"
    >
      <Image
        src={work.thumbnail}
        alt={work.title}
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover transition-transform duration-[700ms] ease-[var(--ease-out-rt)] group-hover:scale-105"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-rt-black/80 via-rt-black/10 to-rt-black/15"
      />

      {/* Tag categoría */}
      <span className="absolute left-4 top-4 rounded-full border border-rt-white/15 bg-rt-black/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-rt-yellow font-[family-name:var(--font-heading)] backdrop-blur">
        {SERVICE_TYPE_LABELS[work.serviceType]}
      </span>

      {/* Pie con título + flecha */}
      <span className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
        <span className="font-[family-name:var(--font-heading)] text-[14px] font-bold uppercase leading-[1.2] tracking-[0.04em] text-rt-white">
          {work.title}
        </span>
        <span
          aria-hidden
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rt-yellow text-rt-black transition-transform duration-300 group-hover:rotate-45"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4">
            <path d="M7 17 17 7M9 7h8v8" />
          </svg>
        </span>
      </span>
    </button>
  )
}
