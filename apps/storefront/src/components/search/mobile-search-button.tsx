'use client'

import { Search } from 'lucide-react'
import { useState } from 'react'

import { SearchBar } from '@/components/search/search-bar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

interface MobileSearchButtonProps {
  /** Texto accesible del botón (viene de las traducciones del header). */
  label: string
  className?: string | undefined
}

/**
 * Lupa del header en pantallas donde no cabe el buscador desplegado.
 *
 * Antes era un enlace a /tienda, así que pulsarla no buscaba nada. Ahora abre
 * un panel superior con el buscador real y el foco puesto en el campo, que es
 * lo que espera quien pulsa una lupa.
 */
export function MobileSearchButton({ label, className }: MobileSearchButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={
            className ??
            'inline-flex h-10 w-10 items-center justify-center rounded-[12px] text-rt-white transition-colors hover:bg-rt-black-2'
          }
        >
          <Search className="h-4 w-4" />
        </button>
      </SheetTrigger>

      <SheetContent side="top" className="p-0">
        <SheetHeader className="space-y-0 border-b border-rt-ink-100 px-5 py-4">
          <SheetTitle className="font-[family-name:var(--font-heading)] text-[13px] font-bold uppercase tracking-[0.18em] text-rt-black">
            {label}
          </SheetTitle>
        </SheetHeader>
        <div className="px-5 py-5">
          {/* Aquí sí queremos el foco: el usuario ha pulsado para buscar. */}
          <SearchBar tone="light" onResultClick={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
