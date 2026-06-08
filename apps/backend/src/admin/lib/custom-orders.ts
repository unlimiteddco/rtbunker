export const CUSTOM_ORDER_STATUSES = [
  'pending_review',
  'proof_sent',
  'awaiting_changes',
  'approved',
  'in_production',
  'shipped',
  'delivered',
  'cancelled',
] as const

export type CustomOrderStatus = (typeof CUSTOM_ORDER_STATUSES)[number]

export interface ProofEntry {
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

export interface CustomOrder {
  id: string
  customer_email: string
  customer_name: string | null
  customer_phone: string | null
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
  customer_notes: string | null
  status: CustomOrderStatus
  proofs: ProofEntry[] | null
  admin_notes: string | null
  magic_token: string
  cart_id: string | null
  order_id: string | null
  tracking_number: string | null
  tracking_url: string | null
  shipping_carrier: string | null
  priority?: boolean
  membership_tier?: string | null
  paid_with_credits?: boolean
  created_at: string
  updated_at: string
}

export const STATUS_LABELS: Record<CustomOrderStatus, string> = {
  pending_review: 'Pendiente',
  proof_sent: 'Mockup enviado',
  awaiting_changes: 'Cambios pedidos',
  approved: 'Aprobado',
  in_production: 'En producción',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

export const STATUS_COLOR: Record<CustomOrderStatus, 'grey' | 'orange' | 'blue' | 'green' | 'red' | 'purple'> = {
  pending_review: 'orange',
  proof_sent: 'blue',
  awaiting_changes: 'orange',
  approved: 'green',
  in_production: 'purple',
  shipped: 'blue',
  delivered: 'green',
  cancelled: 'red',
}

export const SHAPE_LABELS: Record<string, string> = {
  rect: 'Rectángulo',
  square: 'Cuadrado',
  circle: 'Círculo',
  custom: 'Forma libre',
}

export const MATERIAL_LABELS: Record<string, string> = {
  mate: 'Mate',
  brillo: 'Brillo',
  holo: 'Holográfico',
  refl: 'Reflectante',
}

export const SIZE_LABELS: Record<string, string> = {
  s: 'Pequeña (5×5 cm)',
  m: 'Mediana (10×10 cm)',
  l: 'Grande (20×20 cm)',
  xl: 'XL (40×40 cm)',
}

export function formatSize(o: Pick<CustomOrder, 'size_id' | 'width_cm' | 'height_cm'>): string {
  if (o.size_id && SIZE_LABELS[o.size_id]) return SIZE_LABELS[o.size_id]!
  if (o.width_cm && o.height_cm) return `${o.width_cm} × ${o.height_cm} cm (custom)`
  return '—'
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value)
}
