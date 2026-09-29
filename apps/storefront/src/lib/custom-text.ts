/**
 * Texto personalizado por producto (p.ej. el @usuario de una "Pegatina
 * Instagram").
 *
 * - Configuración: `product.metadata` (la activa Nikita desde el admin con el
 *   widget "Texto personalizado"):
 *     custom_text_enabled      boolean
 *     custom_text_label        string   ("Tu usuario de Instagram")
 *     custom_text_placeholder  string   ("@tuusuario")
 *     custom_text_max          number   (default 30)
 *     custom_text_required     boolean  (default true)
 *     custom_text_help         string   (opcional)
 *
 * - Lo que escribe el comprador se guarda en el line item:
 *   `line_item.metadata.custom_text`. Medusa solo fusiona líneas del mismo
 *   variant si la metadata coincide, así que textos distintos → líneas
 *   distintas.
 */

export const CUSTOM_TEXT_KEY = 'custom_text'
export const CUSTOM_TEXT_DEFAULT_MAX = 30

export interface CustomTextConfig {
  label: string
  placeholder: string
  max: number
  required: boolean
  help: string | null
}

function asBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

function asText(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/** Devuelve la config del campo si el producto lo tiene activo; si no, `null`. */
export function getCustomTextConfig(metadata: unknown): CustomTextConfig | null {
  if (typeof metadata !== 'object' || metadata === null) return null
  const m = metadata as Record<string, unknown>
  if (!asBool(m.custom_text_enabled, false)) return null

  const rawMax = Number(m.custom_text_max)
  const max =
    Number.isFinite(rawMax) && rawMax > 0
      ? Math.min(Math.floor(rawMax), 200)
      : CUSTOM_TEXT_DEFAULT_MAX

  return {
    label: asText(m.custom_text_label) ?? 'Tu texto personalizado',
    placeholder: asText(m.custom_text_placeholder) ?? '',
    max,
    required: asBool(m.custom_text_required, true),
    help: asText(m.custom_text_help),
  }
}

/** Normaliza el texto del comprador: recorta extremos y colapsa espacios. */
export function normalizeCustomText(value: string, max: number): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, max)
}

/** Lee el texto personalizado de la metadata de un line item. */
export function readLineItemCustomText(metadata: unknown): string | null {
  if (typeof metadata !== 'object' || metadata === null) return null
  return asText((metadata as Record<string, unknown>)[CUSTOM_TEXT_KEY])
}
