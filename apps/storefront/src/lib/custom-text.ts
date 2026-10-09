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

/* ─── Opciones a elegir (sin cambio de precio) ──────────────────────
 *
 * Además del texto libre, un producto puede pedir al comprador que ELIJA
 * entre varias opciones que no cambian el precio ni son variantes: la fuente
 * de una "Pegatina Instagram", la orientación, etc.
 *
 * - Configuración: `product.metadata.custom_choices`, un array de
 *     { label: 'Fuente', options: ['Clásica', 'Redonda'], required: true }
 *   (lo edita Nikita en el widget "Texto personalizado" del producto).
 * - Elección del comprador: `line_item.metadata.custom_choices`, un array de
 *     { label: 'Fuente', value: 'Redonda' }
 */

export const CUSTOM_CHOICES_KEY = 'custom_choices'
export const CUSTOM_CHOICES_MAX = 6

export interface CustomChoiceConfig {
  label: string
  options: string[]
  required: boolean
}

export interface CustomChoiceValue {
  label: string
  value: string
}

/** Opciones a elegir configuradas en el producto (vacío si no tiene). */
export function getCustomChoicesConfig(metadata: unknown): CustomChoiceConfig[] {
  if (typeof metadata !== 'object' || metadata === null) return []
  const raw = (metadata as Record<string, unknown>)[CUSTOM_CHOICES_KEY]
  if (!Array.isArray(raw)) return []

  return raw.slice(0, CUSTOM_CHOICES_MAX).flatMap((entry): CustomChoiceConfig[] => {
    if (typeof entry !== 'object' || entry === null) return []
    const e = entry as Record<string, unknown>
    const label = asText(e.label)
    const options = Array.isArray(e.options)
      ? e.options.map(asText).filter((o): o is string => o !== null)
      : []
    if (!label || options.length === 0) return []
    return [{ label, options, required: asBool(e.required, true) }]
  })
}

/** Limpia las elecciones antes de guardarlas en el line item. */
export function sanitizeCustomChoices(raw: unknown): CustomChoiceValue[] {
  if (!Array.isArray(raw)) return []
  return raw.slice(0, CUSTOM_CHOICES_MAX).flatMap((entry): CustomChoiceValue[] => {
    if (typeof entry !== 'object' || entry === null) return []
    const e = entry as Record<string, unknown>
    const label = asText(e.label)?.slice(0, 80)
    const value = asText(e.value)?.slice(0, 120)
    return label && value ? [{ label, value }] : []
  })
}

/** Lee las opciones elegidas de la metadata de un line item. */
export function readLineItemChoices(metadata: unknown): CustomChoiceValue[] {
  if (typeof metadata !== 'object' || metadata === null) return []
  return sanitizeCustomChoices((metadata as Record<string, unknown>)[CUSTOM_CHOICES_KEY])
}
