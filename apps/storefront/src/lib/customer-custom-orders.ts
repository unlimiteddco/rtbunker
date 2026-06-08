/**
 * Tipos + labels para las páginas de `/cuenta/personalizadas` (lista y
 * detalle). El backend expone los pedidos via /store/customers/me/custom-orders
 * con un subset seguro de campos (sin admin_notes ni magic_token).
 */

export type CustomerCustomOrderStatus =
  | 'pending_review'
  | 'proof_sent'
  | 'awaiting_changes'
  | 'approved'
  | 'in_production'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export interface CustomerProofEntry {
  id: string
  url: string
  file_name?: string | null
  version: number
  sent_at: string
  admin_notes?: string | null
  customer_response?: 'approved' | 'changes_requested' | null
  customer_response_at?: string | null
  customer_response_notes?: string | null
}

export interface CustomerCustomOrder {
  id: string
  short_id: string
  status: CustomerCustomOrderStatus
  shape: string
  material: string
  size_id: string | null
  width_cm: number | null
  height_cm: number | null
  units: number
  unit_price: number
  total_price: number
  design_file_url: string | null
  design_file_name: string | null
  customer_notes?: string | null
  proofs: CustomerProofEntry[]
  tracking_number: string | null
  tracking_url: string | null
  shipping_carrier: string | null
  order_id: string | null
  created_at: string
  updated_at: string
}

export const STATUS_LABEL: Record<CustomerCustomOrderStatus, string> = {
  pending_review: 'Preparando mockup',
  proof_sent: 'Mockup enviado',
  awaiting_changes: 'Aplicando cambios',
  approved: 'Aprobado',
  in_production: 'En producción',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

export const STATUS_COPY: Record<CustomerCustomOrderStatus, string> = {
  pending_review: 'Hemos recibido tu pedido. Estamos preparando la prueba de impresión.',
  proof_sent: 'Revisa el mockup y dinos si te encaja o si quieres cambios.',
  awaiting_changes: 'Estamos preparando la siguiente versión del mockup.',
  approved: '¡Aprobado! Vamos a producirlo en breve.',
  in_production: 'Tus pegatinas se están fabricando.',
  shipped: 'Tu pedido va camino a casa.',
  delivered: 'Entregado. Esperamos que te encanten.',
  cancelled: 'Pedido cancelado.',
}

const SHAPE_LABELS: Record<string, string> = {
  rect: 'Rectángulo',
  square: 'Cuadrado',
  circle: 'Círculo',
  custom: 'Forma libre',
}

const MATERIAL_LABELS: Record<string, string> = {
  mate: 'Mate',
  brillo: 'Brillo',
  holo: 'Holográfico',
  refl: 'Reflectante',
}

const SIZE_LABELS: Record<string, string> = {
  s: 'Pequeña (5×5 cm)',
  m: 'Mediana (10×10 cm)',
  l: 'Grande (20×20 cm)',
  xl: 'XL (40×40 cm)',
}

export function describeShape(shape: string): string {
  return SHAPE_LABELS[shape] ?? shape
}

export function describeMaterial(material: string): string {
  return MATERIAL_LABELS[material] ?? material
}

export function describeSize(o: Pick<CustomerCustomOrder, 'size_id' | 'width_cm' | 'height_cm'>): string {
  if (o.size_id && SIZE_LABELS[o.size_id]) return SIZE_LABELS[o.size_id]!
  if (o.width_cm && o.height_cm) return `${o.width_cm} × ${o.height_cm} cm`
  return '—'
}

export function describeShortConfig(o: CustomerCustomOrder): string {
  return [describeShape(o.shape), describeMaterial(o.material), describeSize(o)].join(' · ')
}

/**
 * Orden lógico de los estados para el stepper visual. `cancelled` queda fuera
 * porque corta el flujo.
 */
export const STATUS_STEPS: CustomerCustomOrderStatus[] = [
  'pending_review',
  'proof_sent',
  'approved',
  'in_production',
  'shipped',
  'delivered',
]

export function statusStepIndex(status: CustomerCustomOrderStatus): number {
  if (status === 'awaiting_changes') return 1 // entre proof_sent y approved
  if (status === 'cancelled') return -1
  return STATUS_STEPS.indexOf(status)
}

export function isCancelled(status: CustomerCustomOrderStatus): boolean {
  return status === 'cancelled'
}
