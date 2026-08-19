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

    // Sin IntersectionObserver, o si el usuario pide menos animación, el
    // contenido se muestra directamente: nunca debe quedarse invisible.
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (typeof IntersectionObserver === 'undefined' || prefersReduced) {
      node.setAttribute('data-revealed', 'true')
      return
    }

    // Un bloque más alto que la pantalla (p. ej. la sección de FAQ con todas
    // las respuestas abiertas) tardaría en alcanzar el 15 % visible: la sección
    // se quedaba en blanco hasta haber bajado mucho. En esos casos basta con
    // que asome por abajo para mostrarla.
    const isTall = node.offsetHeight > window.innerHeight * 0.6
    const effectiveThreshold = isTall ? 0 : threshold

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
      { threshold: effectiveThreshold, rootMargin: '0px 0px -40px 0px' },
    )

    observer.observe(node)

    // Red de seguridad: si por lo que sea el observer no llega a disparar
    // (layout tardío, imágenes que cambian alturas…), mostramos el contenido.
    const failsafe = window.setTimeout(() => {
      if (node.getAttribute('data-revealed') !== 'true') {
        const box = node.getBoundingClientRect()
        if (box.top < window.innerHeight) node.setAttribute('data-revealed', 'true')
      }
    }, 1200)

    return () => {
      observer.disconnect()
      window.clearTimeout(failsafe)
    }
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
