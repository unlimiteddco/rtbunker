import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

interface ContainerProps {
  children: ReactNode
  as?: 'div' | 'section' | 'main' | 'article' | 'header' | 'footer' | 'aside'
  className?: string
  /** Si `false`, no aplica el max-width del contenedor (raro). */
  bounded?: boolean
}

/**
 * Wrapper consistente con max-width + padding. Sustituye al uso disperso
 * de `container-page` para que el contenedor de página viva en un único
 * sitio si algún día queremos cambiar el ancho.
 */
export function Container({
  children,
  as: Tag = 'div',
  className,
  bounded = true,
}: ContainerProps) {
  return (
    <Tag
      className={cn(
        bounded ? 'container-page' : 'w-full px-4 md:px-6 lg:px-8',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
