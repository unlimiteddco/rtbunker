/**
 * Personalizadas — modelo de precios.
 *
 * Reglas:
 *   • Forma básica (Rectángulo / Cuadrado / Círculo) → mult 1.0×
 *   • Forma libre (silueta a medida) → +25%
 *   • Material — Mate base; Brillo +5%; Holográfico +35%; Reflectante +55%
 *   • Tamaño preset → precio base de la tabla SIZES.
 *   • Tamaño custom (ancho × alto en cm) → priceForArea() interpola entre
 *     los puntos S/M/L/XL con extrapolación lineal arriba.
 *   • Cantidad — mínimo 15, máximo 5000 unidades. Tiers de descuento
 *     escalonados (1.0 → 0.30) según factorForUnits().
 *
 *   unitPrice = baseForSize × shape.mult × material.mult × factorForUnits(units)
 *   total     = unitPrice × units
 *   savings   = (baseForSize × shape.mult × material.mult − unitPrice) × units
 */

export type ShapeId = 'rect' | 'square' | 'circle' | 'custom'
export type MaterialId = 'mate' | 'brillo' | 'holo' | 'refl'
export type SizeId = 's' | 'm' | 'l' | 'xl'

export interface Shape {
  id: ShapeId
  name: string
  mult: number
  tag?: string
  desc: string
}

export interface Material {
  id: MaterialId
  name: string
  mult: number
  tag?: string
  desc: string
}

export interface Size {
  id: SizeId
  name: string
  dim: string
  /** lado en cm (asume cuadrado/rectangular en proporción 1:1). */
  side: number
  base: number
  popular?: boolean
}

export const SHAPES: Shape[] = [
  {
    id: 'rect',
    name: 'Rectángulo',
    mult: 1.0,
    desc: 'Lados rectos, esquinas redondeadas',
  },
  { id: 'square', name: 'Cuadrado', mult: 1.0, desc: 'Iconos, logos compactos' },
  { id: 'circle', name: 'Círculo', mult: 1.0, desc: 'Sellos, logos circulares' },
  {
    id: 'custom',
    name: 'Forma libre',
    mult: 1.25,
    tag: '+25%',
    desc: 'Silueta a medida según tu archivo',
  },
]

export const MATERIALS: Material[] = [
  { id: 'mate', name: 'Mate', mult: 1.0, desc: 'Acabado sobrio, sin reflejos' },
  { id: 'brillo', name: 'Brillo', mult: 1.05, tag: '+5%', desc: 'Acabado vivo, colores intensos' },
  { id: 'holo', name: 'Holográfico', mult: 1.35, tag: '+35%', desc: 'Efecto arcoíris' },
  { id: 'refl', name: 'Reflectante', mult: 1.55, tag: '+55%', desc: 'Visible de noche' },
]

export const SIZES: Size[] = [
  { id: 's', name: 'Pequeña', dim: '5 × 5 cm', side: 5, base: 2.5 },
  { id: 'm', name: 'Mediana', dim: '10 × 10 cm', side: 10, base: 4.8, popular: true },
  { id: 'l', name: 'Grande', dim: '20 × 20 cm', side: 20, base: 9.5 },
  { id: 'xl', name: 'XL', dim: '40 × 40 cm', side: 40, base: 16.8 },
]

export const MIN_QTY = 15
export const MAX_QTY = 5000
export const MIN_DIM_CM = 1
export const MAX_DIM_CM = 200

/**
 * Canje con créditos (RT Bunker Club): 1 crédito = 1 pegatina, cualquier
 * acabado, en tamaños ≤ 10 cm por lado (pequeña 5 cm, mediana 10 cm, o custom
 * con ambos lados ≤ 10 cm). Los tamaños grandes (20/40 cm) y custom >10 cm se
 * pagan con dinero.
 */
export const CREDIT_MAX_SIDE_CM = 10

export function isCreditEligibleSize(input: {
  sizeMode: 'preset' | 'custom'
  sizeId?: SizeId | null
  width_cm?: number | null
  height_cm?: number | null
}): boolean {
  if (input.sizeMode === 'preset') {
    return input.sizeId === 's' || input.sizeId === 'm'
  }
  const w = input.width_cm ?? 0
  const h = input.height_cm ?? 0
  return w > 0 && h > 0 && w <= CREDIT_MAX_SIDE_CM && h <= CREDIT_MAX_SIDE_CM
}

/**
 * Precio base para una superficie en cm² interpolando entre los 4 tamaños
 * predefinidos. Más grande = menor coste por cm² (descuento volumen).
 */
export function priceForArea(cm2: number): number {
  if (cm2 <= 0) return 0
  const pts: [number, number][] = [
    [25, 2.5],
    [100, 4.8],
    [400, 9.5],
    [1600, 16.8],
  ]
  if (cm2 <= pts[0]![0]) {
    return (cm2 / pts[0]![0]) * pts[0]![1]
  }
  for (let i = 0; i < pts.length - 1; i++) {
    const [a1, p1] = pts[i]!
    const [a2, p2] = pts[i + 1]!
    if (cm2 <= a2) {
      const t = (cm2 - a1) / (a2 - a1)
      return p1 + t * (p2 - p1)
    }
  }
  // > 1600 cm²: extrapolar con la pendiente del último tramo.
  const [a1, p1] = pts[pts.length - 2]!
  const [a2, p2] = pts[pts.length - 1]!
  const slope = (p2 - p1) / (a2 - a1)
  return p2 + (cm2 - a2) * slope
}

/**
 * Tiers de descuento por volumen. Empezamos en 15 (cantidad mínima).
 *
 *   15–29      1.00× (sin descuento)
 *   30–49      0.85× (15%)
 *   50–99      0.75× (25%)
 *  100–249     0.65× (35%)
 *  250–499     0.55× (45%)
 *  500–999     0.45× (55%)
 * 1000–2499    0.38× (62%)
 * 2500–5000    0.30× (70%)
 */
export function factorForUnits(u: number): number {
  if (u >= 2500) return 0.3
  if (u >= 1000) return 0.38
  if (u >= 500) return 0.45
  if (u >= 250) return 0.55
  if (u >= 100) return 0.65
  if (u >= 50) return 0.75
  if (u >= 30) return 0.85
  return 1.0
}

/** Devuelve el siguiente tier (umbral, descuento total %). Útil para mostrar
 *  "compra X más unidades para ahorrar Y%". */
export function nextTier(u: number): { at: number; saves: number } | null {
  if (u < 30) return { at: 30, saves: 15 }
  if (u < 50) return { at: 50, saves: 25 }
  if (u < 100) return { at: 100, saves: 35 }
  if (u < 250) return { at: 250, saves: 45 }
  if (u < 500) return { at: 500, saves: 55 }
  if (u < 1000) return { at: 1000, saves: 62 }
  if (u < 2500) return { at: 2500, saves: 70 }
  return null
}

export function currentDiscount(u: number): number {
  return Math.round((1 - factorForUnits(u)) * 100)
}

export interface PriceBreakdown {
  unitPrice: number
  total: number
  baseUnit: number
  savings: number
}

export function computePrice(input: {
  shape: Shape
  material: Material
  baseForSize: number
  units: number
}): PriceBreakdown {
  const { shape, material, baseForSize, units } = input
  const factor = factorForUnits(units)
  const baseUnit = baseForSize * shape.mult * material.mult
  const unitPrice = baseUnit * factor
  const total = unitPrice * units
  const savings = units > 1 ? (baseUnit - unitPrice) * units : 0
  return { unitPrice, total, baseUnit, savings }
}

export const ACCEPTED_FILE_TYPES = ['.png', '.jpg', '.jpeg', '.svg', '.pdf', '.ai', '.eps']
export const ACCEPTED_LABELS = ['PNG', 'JPG', 'SVG', 'PDF', 'AI', 'EPS']
