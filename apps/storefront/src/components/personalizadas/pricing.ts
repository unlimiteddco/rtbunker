/**
 * Personalizadas — modelo de precios (rework reunión Nikita 17-jun).
 *
 * El precio base sale de la tabla de Sticker Shuttle (pricing-data.ts), en
 * función de la SUPERFICIE en pulgadas² de la pegatina. El descuento por
 * volumen sale de una matriz cantidad × superficie. Todo en USD tratado 1:1
 * como EUR, con un −5% global.
 *
 *   sqin          = area_cm2 / CM2_PER_SQIN
 *   baseUSD(sqin) = interpolación lineal sobre BASE_PRICE_POINTS
 *   discount      = lookup FLOOR en DISCOUNT_MATRIX[cantidad][superficie]
 *   precioUnidad  = baseUSD(sqin) × (1 − discount) × finishMult × GLOBAL_DISCOUNT_MULT
 *   total         = precioUnidad × units
 *
 * Reglas de forma/acabado:
 *   • Forma básica (Rectángulo / Cuadrado / Círculo) → mult 1.0×
 *   • Forma libre (silueta a medida) → +25%
 *   • Acabado — Mate y Brillo, ambos 1.0× (mismo precio).
 *   • Tipo de corte — Corte beso / Troquelado (sin impacto de precio hoy).
 */

import {
  BASE_PRICE_POINTS,
  CM2_PER_SQIN,
  DISCOUNT_MATRIX,
  DISCOUNT_QTYS,
  DISCOUNT_SQIN_COLS,
  GLOBAL_DISCOUNT_MULT,
} from './pricing-data'

export type ShapeId = 'rect' | 'square' | 'circle' | 'custom'
export type MaterialId = 'mate' | 'brillo'
export type CutTypeId = 'kiss_cut' | 'die_cut'
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

export interface CutType {
  id: CutTypeId
  name: string
  desc: string
}

export interface Size {
  id: SizeId
  name: string
  dim: string
  /** lado en cm (asume cuadrado/rectangular en proporción 1:1). */
  side: number
  /** área en cm² del preset (lado²). */
  cm2: number
  /** precio base €/ud a cantidad mínima, derivado del área. */
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

/** Acabado (antes "Material"). Solo Mate y Brillo; ambos mismo precio. */
export const MATERIALS: Material[] = [
  { id: 'mate', name: 'Mate', mult: 1.0, desc: 'Acabado sobrio, sin reflejos' },
  { id: 'brillo', name: 'Brillo', mult: 1.0, desc: 'Acabado vivo, colores intensos' },
]

/** Tipo de corte (vive junto a la sección de "Forma"). */
export const CUT_TYPES: CutType[] = [
  { id: 'kiss_cut', name: 'Corte beso', desc: 'Corta el vinilo dejando el dorso intacto' },
  { id: 'die_cut', name: 'Troquelado', desc: 'Corta la pegatina y el dorso a la silueta' },
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
 * Precio base USD/ud (a cantidad mínima) para una superficie dada en
 * pulgadas², interpolando linealmente sobre BASE_PRICE_POINTS.
 *   • sqin ≤ primer punto → proporcional al primer punto.
 *   • entre dos puntos → interpolación lineal.
 *   • > último punto → extrapola con la pendiente del último tramo.
 */
export function baseUSDForSqin(sqin: number): number {
  if (sqin <= 0) return 0
  const pts = BASE_PRICE_POINTS
  const first = pts[0]!
  if (sqin <= first[0]) {
    return (sqin / first[0]) * first[1]
  }
  for (let i = 0; i < pts.length - 1; i++) {
    const [a1, p1] = pts[i]!
    const [a2, p2] = pts[i + 1]!
    if (sqin <= a2) {
      const t = (sqin - a1) / (a2 - a1)
      return p1 + t * (p2 - p1)
    }
  }
  const [a1, p1] = pts[pts.length - 2]!
  const [a2, p2] = pts[pts.length - 1]!
  const slope = (p2 - p1) / (a2 - a1)
  return p2 + (sqin - a2) * slope
}

/**
 * Descuento por volumen (fracción 0..1) según cantidad y superficie.
 * Lookup "floor": mayor fila DISCOUNT_QTYS ≤ units (si units < 50 → fila 0,
 * descuento 0) y mayor columna DISCOUNT_SQIN_COLS ≤ sqin.
 */
export function volumeDiscount(units: number, sqin: number): number {
  let qi = 0
  for (let i = 0; i < DISCOUNT_QTYS.length; i++) {
    if (units >= DISCOUNT_QTYS[i]!) qi = i
    else break
  }
  // units < primera fila (50) → sin descuento.
  if (units < DISCOUNT_QTYS[0]!) return 0

  let si = 0
  for (let i = 0; i < DISCOUNT_SQIN_COLS.length; i++) {
    if (sqin >= DISCOUNT_SQIN_COLS[i]!) si = i
    else break
  }
  const row = DISCOUNT_MATRIX[qi]
  return row?.[si] ?? 0
}

/**
 * Precio base €/ud (a cantidad mínima, sin descuento por volumen) para una
 * superficie en cm². Aplica USD≈EUR y el −5% global. Se usa para los presets
 * SIZES y para el preview de custom.
 */
export function priceForArea(cm2: number): number {
  if (cm2 <= 0) return 0
  const sqin = cm2 / CM2_PER_SQIN
  return baseUSDForSqin(sqin) * GLOBAL_DISCOUNT_MULT
}

/** Tamaños preset. La base se deriva del área (lado²) vía priceForArea. */
function buildSize(
  id: SizeId,
  name: string,
  side: number,
  popular?: boolean,
): Size {
  const cm2 = side * side
  return {
    id,
    name,
    dim: `${side} × ${side} cm`,
    side,
    cm2,
    base: priceForArea(cm2),
    ...(popular ? { popular } : {}),
  }
}

export const SIZES: Size[] = [
  buildSize('s', 'Pequeña', 5),
  buildSize('m', 'Mediana', 10, true),
  buildSize('l', 'Grande', 20),
  buildSize('xl', 'XL', 40),
]

/**
 * Siguiente umbral de cantidad con su % de ahorro orientativo, para mostrar
 * "sube a X uds y ahorra Y%". El % se calcula a una superficie de referencia
 * (3 pulgadas² ≈ 19 cm², pegatina típica) sobre los tramos de DISCOUNT_QTYS.
 */
const NEXT_TIER_REF_SQIN = 3

export function nextTier(u: number): { at: number; saves: number } | null {
  for (const at of DISCOUNT_QTYS) {
    if (u < at) {
      const saves = Math.round(volumeDiscount(at, NEXT_TIER_REF_SQIN) * 100)
      return { at, saves }
    }
  }
  return null
}

/** % de descuento por volumen aplicado ahora mismo a esta superficie. */
export function currentDiscount(units: number, sqin: number): number {
  return Math.round(volumeDiscount(units, sqin) * 100)
}

export interface PriceBreakdown {
  unitPrice: number
  total: number
  /** precio €/ud sin descuento por volumen (para mostrar el ahorro). */
  baseUnit: number
  savings: number
}

/**
 * Calcula el precio. `cm2` es la superficie efectiva de la pegatina.
 *   unitPrice = baseUSD(sqin) × (1 − descuento) × finishMult × GLOBAL_DISCOUNT_MULT
 *   baseUnit  = precio sin descuento por volumen (descuento = 0)
 */
export function computePrice(input: {
  shape: Shape
  material: Material
  /** superficie efectiva en cm² (preset.cm2 o ancho×alto del custom). */
  cm2: number
  units: number
}): PriceBreakdown {
  const { shape, material, cm2, units } = input
  if (cm2 <= 0) {
    return { unitPrice: 0, total: 0, baseUnit: 0, savings: 0 }
  }
  const sqin = cm2 / CM2_PER_SQIN
  const baseUSD = baseUSDForSqin(sqin)
  const finishMult = shape.mult * material.mult
  const baseUnit = baseUSD * finishMult * GLOBAL_DISCOUNT_MULT
  const discount = volumeDiscount(units, sqin)
  const unitPrice = baseUnit * (1 - discount)
  const total = unitPrice * units
  const savings = units > 1 ? (baseUnit - unitPrice) * units : 0
  return { unitPrice, total, baseUnit, savings }
}

export const ACCEPTED_FILE_TYPES = ['.png', '.jpg', '.jpeg', '.svg', '.pdf', '.ai', '.eps']
export const ACCEPTED_LABELS = ['PNG', 'JPG', 'SVG', 'PDF', 'AI', 'EPS']
