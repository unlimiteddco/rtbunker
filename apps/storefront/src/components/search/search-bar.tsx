'use client'

import { Search, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState, useTransition } from 'react'

import { searchAction, type SearchHit } from '@/app/actions/search'
import { Skeleton } from '@/components/ui/skeleton'
import { Link, useRouter } from '@/i18n/routing'
import { cn } from '@/lib/cn'

interface SearchBarProps {
  onResultClick?: () => void
  /** 'dark' integra el input en el header carbón; 'light' para el menú móvil. */
  tone?: 'dark' | 'light'
}

export function SearchBar({ onResultClick, tone = 'dark' }: SearchBarProps) {
  const t = useTranslations('nav')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Búsqueda instantánea con debounce corto para que se sienta dinámica.
  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setHits([])
      setActive(-1)
      return
    }
    const timer = setTimeout(() => {
      startTransition(async () => {
        const results = await searchAction(trimmed)
        setHits(results)
        setActive(-1)
      })
    }, 140)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function goToSearch() {
    if (!query.trim()) return
    setOpen(false)
    onResultClick?.()
    router.push(`/tienda?q=${encodeURIComponent(query.trim())}`)
  }

  function goToHit(hit: SearchHit) {
    setOpen(false)
    onResultClick?.()
    router.push(`/producto/${hit.handle}`)
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (active >= 0 && hits[active]) goToHit(hits[active])
    else goToSearch()
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || hits.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % hits.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i <= 0 ? hits.length - 1 : i - 1))
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  function clear() {
    setQuery('')
    setHits([])
    setActive(-1)
    inputRef.current?.focus()
  }

  const dark = tone === 'dark'

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={onSubmit}>
        <Search
          className={cn(
            'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
            dark ? 'text-rt-ink-500' : 'text-rt-ink-700',
          )}
        />
        <input
          ref={inputRef}
          type="text"
          inputMode="search"
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={t('search_placeholder')}
          aria-label={t('search')}
          className={cn(
            'h-10 w-full rounded-[12px] border px-9 text-[14px] font-medium outline-none transition-colors',
            'focus:ring-2 focus:ring-rt-yellow/55',
            dark
              ? 'border-rt-black-3 bg-rt-black-2 text-rt-white placeholder:text-rt-ink-500 focus:border-rt-yellow/60'
              : 'border-rt-ink-100 bg-rt-white text-rt-black placeholder:text-rt-ink-500 focus:border-rt-yellow/60',
          )}
        />
        {query ? (
          <button
            type="button"
            onClick={clear}
            aria-label="Limpiar búsqueda"
            className={cn(
              'absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors',
              dark
                ? 'text-rt-ink-500 hover:bg-rt-black-3 hover:text-rt-white'
                : 'text-rt-ink-500 hover:bg-rt-white-2 hover:text-rt-black',
            )}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </form>

      {open && (query.trim() || pending) ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[26rem] overflow-y-auto rounded-[14px] border border-rt-ink-100 bg-rt-white shadow-2xl">
          {pending && hits.length === 0 ? (
            <div className="space-y-1 p-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="h-11 w-11 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : hits.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-rt-ink-500">
              Sin resultados para “{query.trim()}”.
            </p>
          ) : (
            <>
              <ul className="py-1">
                {hits.map((hit, i) => (
                  <li key={hit.id}>
                    <Link
                      href={`/producto/${hit.handle}`}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => {
                        setOpen(false)
                        onResultClick?.()
                      }}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 transition-colors',
                        active === i ? 'bg-rt-yellow/12' : 'hover:bg-rt-white-2',
                      )}
                    >
                      {hit.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={hit.thumbnail}
                          alt=""
                          className="h-11 w-11 rounded-lg object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-lg bg-rt-white-2" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-rt-black">
                          {hit.title}
                        </p>
                        {hit.subtitle ? (
                          <p className="truncate text-[12px] text-rt-ink-500">{hit.subtitle}</p>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={goToSearch}
                className="flex w-full items-center justify-between border-t border-rt-ink-100 px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.12em] text-rt-black transition-colors hover:bg-rt-white-2"
              >
                Ver todos los resultados
                <Search className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
