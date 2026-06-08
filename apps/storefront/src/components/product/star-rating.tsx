import { Star } from 'lucide-react'

import { cn } from '@/lib/cn'

interface StarRatingProps {
  value: number
  /** Tamaño del icono en px. */
  size?: number
  className?: string
}

/**
 * Estrellas de valoración (solo display). Redondea al 0.5 más cercano y
 * pinta la fracción con un recorte CSS para medias estrellas.
 */
export function StarRating({ value, size = 16, className }: StarRatingProps) {
  const rounded = Math.round(value * 2) / 2
  return (
    <div
      className={cn('inline-flex items-center gap-0.5', className)}
      role="img"
      aria-label={`${value} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, rounded - (n - 1))) // 0, 0.5 o 1
        return (
          <span key={n} className="relative inline-block" style={{ width: size, height: size }}>
            <Star
              className="absolute inset-0 text-rt-ink-300"
              style={{ width: size, height: size }}
              strokeWidth={1.5}
            />
            {fill > 0 ? (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star
                  className="text-rt-yellow"
                  style={{ width: size, height: size }}
                  fill="currentColor"
                  strokeWidth={1.5}
                />
              </span>
            ) : null}
          </span>
        )
      })}
    </div>
  )
}
