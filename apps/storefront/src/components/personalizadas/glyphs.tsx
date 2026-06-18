/**
 * Glifos / swatches del configurador.
 *   • ShapeGlyph   — 4 formas (rect, square, circle, custom).
 *   • MaterialSwatch — 2 acabados (mate, brillo).
 *   • SizeGlyph    — marcas de corte de vinilo con un rectángulo escalado
 *                    dentro que representa el tamaño relativo.
 */
import type { MaterialId, SizeId } from './pricing'

interface ShapeGlyphProps {
  kind: 'rect' | 'square' | 'circle' | 'custom'
  size?: number
}

export function ShapeGlyph({ kind, size = 40 }: ShapeGlyphProps) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 44 44',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.6,
  }
  switch (kind) {
    case 'rect':
      return (
        <svg {...props}>
          <rect x="6" y="12" width="32" height="20" rx="3" />
        </svg>
      )
    case 'square':
      return (
        <svg {...props}>
          <rect x="9" y="9" width="26" height="26" rx="3" />
        </svg>
      )
    case 'circle':
      return (
        <svg {...props}>
          <circle cx="22" cy="22" r="14" />
        </svg>
      )
    case 'custom':
      return (
        <svg {...props} strokeDasharray="3 3" strokeLinejoin="round">
          <path d="M9 14 q3 -8 12 -6 t10 5 q6 2 5 11 t-8 12 q-9 4 -14 -2 t-5 -20 z" />
        </svg>
      )
  }
}

interface MaterialSwatchProps {
  id: MaterialId
  size?: number
}

export function MaterialSwatch({ id, size = 40 }: MaterialSwatchProps) {
  const STYLES: Record<MaterialId, React.CSSProperties> = {
    mate: { background: '#FCFCFC', border: '1px solid #E3E3E1' },
    brillo: {
      background: '#FCFCFC',
      border: '1px solid #E3E3E1',
      boxShadow: 'inset -10px -10px 0 rgba(10,186,181,0.18)',
    },
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        ...STYLES[id],
      }}
    />
  )
}

interface SizeGlyphProps {
  id: SizeId
}

/**
 * Marcas de recorte en las 4 esquinas + rectángulo central que escala con
 * el tamaño. Estética "blueprint" — coherente con la marca (cortes de vinilo).
 */
export function SizeGlyph({ id }: SizeGlyphProps) {
  // % del SVG que ocupa el rectángulo interno (5cm a 40cm escalado).
  const fill = { s: 24, m: 38, l: 56, xl: 72 }[id]
  const inset = (88 - fill) / 2

  return (
    <svg
      viewBox="0 0 88 88"
      width="48"
      height="48"
      aria-hidden
      className="overflow-visible"
    >
      {/* Esquinas tipo crop-mark */}
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none">
        <path d="M6 18 L6 6 L18 6" />
        <path d="M70 6 L82 6 L82 18" />
        <path d="M82 70 L82 82 L70 82" />
        <path d="M18 82 L6 82 L6 70" />
      </g>
      {/* Rectángulo central proporcional al tamaño */}
      <rect
        x={inset}
        y={inset}
        width={fill}
        height={fill}
        rx="4"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  )
}
