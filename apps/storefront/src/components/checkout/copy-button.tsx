'use client'

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/cn'

interface CopyButtonProps {
  value: string
  /** Texto accesible, p.ej. "Copiar IBAN". */
  label: string
  className?: string
}

/** Botón pequeño que copia `value` al portapapeles (IBAN, concepto…). */
export function CopyButton({ value, label, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function onCopy() {
    try {
      // El IBAN se muestra agrupado; se copia sin espacios para pegarlo en el banco.
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // Sin permiso de portapapeles: el usuario puede seleccionarlo a mano.
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-md border border-rt-ink-100 bg-white px-2 py-1 text-xs font-medium text-rt-ink-700 transition-colors hover:border-rt-yellow hover:text-rt-black',
        className,
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-rt-yellow" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  )
}
