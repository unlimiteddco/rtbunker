import { Sparkles } from 'lucide-react'

/**
 * Helpers para renderizar un line item del carrito cuando se trata de un
 * pedido personalizado (metadata.custom_request === true).
 *
 * Toma la metadata que el endpoint /store/custom-orders/cart inyecta:
 *   {
 *     custom_request: true,
 *     config: { shape, material, size_id, width_cm, height_cm },
 *     design_file_url, design_file_name, total_price
 *   }
 */

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
  s: '5×5 cm',
  m: '10×10 cm',
  l: '20×20 cm',
  xl: '40×40 cm',
}

export interface CustomConfig {
  shape?: string
  material?: string
  size_id?: string | null
  width_cm?: number | null
  height_cm?: number | null
}

export interface CustomLineItemMetadata {
  custom_request?: boolean
  config?: CustomConfig
  design_file_url?: string | null
  design_file_name?: string | null
  paid_with_credits?: boolean
  credits_used?: number
}

export function isCustomLineItem(
  metadata: unknown,
): metadata is CustomLineItemMetadata & { custom_request: true } {
  return (
    typeof metadata === 'object' &&
    metadata !== null &&
    (metadata as { custom_request?: unknown }).custom_request === true
  )
}

/** Devuelve algo como "Cuadrado · Holográfico · 10×10 cm". */
export function describeCustomConfig(config?: CustomConfig): string {
  if (!config) return ''
  const parts: string[] = []
  if (config.shape && SHAPE_LABELS[config.shape]) parts.push(SHAPE_LABELS[config.shape]!)
  if (config.material && MATERIAL_LABELS[config.material]) parts.push(MATERIAL_LABELS[config.material]!)
  if (config.size_id && SIZE_LABELS[config.size_id]) {
    parts.push(SIZE_LABELS[config.size_id]!)
  } else if (config.width_cm && config.height_cm) {
    parts.push(`${config.width_cm}×${config.height_cm} cm`)
  }
  return parts.join(' · ')
}

/**
 * Heurística simple para saber si la URL del diseño se puede previsualizar
 * como imagen (PNG/JPG/WEBP/GIF/SVG). PDF/AI/EPS → fallback al placeholder.
 */
export function isPreviewableImage(url?: string | null): boolean {
  if (!url) return false
  const lower = url.split('?')[0]?.toLowerCase() ?? ''
  return /\.(png|jpe?g|webp|gif|svg)$/.test(lower)
}

interface CustomThumbProps {
  metadata: CustomLineItemMetadata
  /** Tamaño en píxeles. Default 80. */
  size?: number
  className?: string
}

/**
 * Thumbnail dedicada para line items personalizados.
 *   - Si el archivo subido es una imagen previsualizable → la muestra.
 *   - Si no → muestra placeholder cyan con sparkles + texto "Custom".
 */
export function CustomLineItemThumb({
  metadata,
  size = 80,
  className = '',
}: CustomThumbProps) {
  const url = metadata.design_file_url
  const previewable = isPreviewableImage(url)

  if (previewable && url) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-md border border-rt-ink-100 bg-rt-white ${className}`}
        style={{ height: size, width: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={metadata.design_file_name ?? 'Diseño personalizado'}
          className="h-full w-full object-contain"
        />
        <span className="absolute left-1 top-1 inline-flex items-center gap-0.5 rounded-full bg-rt-yellow px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.16em] text-rt-black font-[family-name:var(--font-heading)]">
          <Sparkles className="h-2 w-2" />
          Custom
        </span>
      </div>
    )
  }

  return (
    <div
      className={`relative flex shrink-0 flex-col items-center justify-center gap-1 rounded-md border border-rt-ink-100 bg-gradient-to-br from-rt-yellow-soft to-rt-yellow/30 text-rt-black ${className}`}
      style={{ height: size, width: size }}
    >
      <Sparkles className="h-5 w-5" />
      <span className="text-[9px] font-bold uppercase tracking-[0.16em] font-[family-name:var(--font-heading)]">
        Custom
      </span>
    </div>
  )
}

interface CustomMetaProps {
  metadata: CustomLineItemMetadata
  className?: string
}

/**
 * Línea descriptiva para usar bajo el título del producto en la card del
 * carrito ("Cuadrado · Holográfico · 10×10 cm").
 */
export function CustomLineItemMeta({ metadata, className = '' }: CustomMetaProps) {
  const desc = describeCustomConfig(metadata.config)
  const credits = metadata.paid_with_credits ? metadata.credits_used ?? 0 : 0
  if (!desc && !credits) return null
  return (
    <div className={className}>
      {desc ? (
        <p className="text-[12px] text-rt-ink-500">
          {desc}
          {metadata.design_file_name ? (
            <>
              {' · '}
              <span className="text-rt-ink-700">{metadata.design_file_name}</span>
            </>
          ) : null}
        </p>
      ) : null}
      {credits > 0 ? (
        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-rt-yellow/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-rt-yellow-deep">
          <Sparkles className="h-2.5 w-2.5" />
          {credits} crédito{credits === 1 ? '' : 's'}
        </span>
      ) : null}
    </div>
  )
}
