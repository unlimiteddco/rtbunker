'use client'

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

type RevealVariant = 'up' | 'down' | 'left' | 'right' | 'scale' | 'blur'

interface RevealProps {
  children: ReactNode
  /** Dirección/efecto de entrada. */
  as?: RevealVariant
  /** Retraso en ms (útil para escalonar listas). */
  delay?: number
  /** % del elemento visible para disparar (0 a 1). */
  threshold?: number
  /** Si true, vuelve a animarse cada vez que entra (default: solo la 1ª). */
  repeat?: boolean
  className?: string
  /** Componente raíz, default `div`. */
  tag?: 'div' | 'section' | 'article' | 'li' | 'span'
}

/**
 * Scroll-reveal con IntersectionObserver. Toda la transición vive en CSS
 * (ver globals.css → [data-reveal]). El JS solo decide cuándo añadir
 * `data-revealed="true"`.
 */
export function Reveal({
  children,
  as = 'up',
  delay = 0,
  threshold = 0.15,
  repeat = false,
  className,
  tag = 'div',
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    if (typeof IntersectionObserver === 'undefined') {
      node.setAttribute('data-revealed', 'true')
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            node.setAttribute('data-revealed', 'true')
            if (!repeat) observer.unobserve(node)
          } else if (repeat) {
            node.setAttribute('data-revealed', 'false')
          }
        }
      },
      { threshold, rootMargin: '0px 0px -80px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold, repeat])

  const Tag = tag as 'div'
  const style = { '--reveal-delay': `${delay}ms` } as CSSProperties

  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      data-reveal={as}
      style={style}
      className={className}
    >
      {children}
    </Tag>
  )
}
