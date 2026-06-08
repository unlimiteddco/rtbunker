import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

interface PageHeaderProps {
  /** Pequeño texto sobre el título (categoría / sección / breadcrumb-ish). */
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  /** Slot a la derecha del título (filtros, CTA, contador, etc.). */
  actions?: ReactNode
  /** Tamaño visual del título. `compact` = h2 más pequeño para cuenta/dashboard. */
  size?: 'default' | 'compact' | 'hero'
  className?: string
}

/**
 * Cabecera de página estándar: eyebrow + título + descripción + acciones.
 * Lo usan /tienda, /carrito, /checkout, /cuenta y las páginas CMS.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  size = 'default',
  className,
}: PageHeaderProps) {
  const titleClass = {
    compact: 'text-xl font-semibold tracking-tight md:text-2xl',
    default: 'text-3xl font-semibold tracking-tight md:text-4xl',
    hero: 'text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl',
  }[size]

  return (
    <header
      className={cn(
        'flex flex-col gap-3 md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div className="space-y-1.5">
        {eyebrow ? <p className="text-eyebrow">{eyebrow}</p> : null}
        <h1 className={titleClass}>{title}</h1>
        {description ? (
          <p className="max-w-prose text-sm text-muted-foreground md:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  )
}
