/**
 * "Opciones a elegir": cosas que el comprador ELIGE al pedir un producto y que
 * no cambian el precio ni son variantes (la fuente de la pegatina de
 * Instagram, la orientación…).
 *
 *   product.metadata.custom_choices   = [{ label, options: string[], required }]
 *   line_item.metadata.custom_choices = [{ label, value }]
 *
 * El storefront lee lo mismo en apps/storefront/src/lib/custom-text.ts.
 */

export const CUSTOM_CHOICES_KEY = 'custom_choices'
export const CUSTOM_CHOICES_MAX = 6
export const CUSTOM_CHOICE_OPTIONS_MAX = 30

export interface CustomChoice {
  label: string
  options: string[]
  required: boolean
}

/** Estado de formulario: las opciones se escriben una por línea. */
export interface CustomChoiceDraft {
  label: string
  optionsText: string
  required: boolean
}

export const emptyChoiceDraft = (): CustomChoiceDraft => ({
  label: '',
  optionsText: '',
  required: true,
})

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

/** Lee las opciones a elegir de la metadata de un producto. */
export function readCustomChoices(metadata: unknown): CustomChoice[] {
  if (typeof metadata !== 'object' || metadata === null) return []
  const raw = (metadata as Record<string, unknown>)[CUSTOM_CHOICES_KEY]
  if (!Array.isArray(raw)) return []
  return raw.flatMap((entry): CustomChoice[] => {
    if (typeof entry !== 'object' || entry === null) return []
    const e = entry as Record<string, unknown>
    const label = text(e.label)
    const options = Array.isArray(e.options) ? e.options.map(text).filter(Boolean) : []
    if (!label || options.length === 0) return []
    return [{ label, options, required: e.required !== false }]
  })
}

export const choicesToDrafts = (choices: CustomChoice[]): CustomChoiceDraft[] =>
  choices.map((c) => ({
    label: c.label,
    optionsText: c.options.join('\n'),
    required: c.required,
  }))

/** Opciones escritas una por línea (o separadas por comas), sin repetidas. */
export function parseOptions(optionsText: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const piece of optionsText.split(/[\n,]/)) {
    const value = piece.trim()
    const key = value.toLowerCase()
    if (!value || seen.has(key)) continue
    seen.add(key)
    out.push(value)
  }
  return out
}

export const draftsToChoices = (drafts: CustomChoiceDraft[]): CustomChoice[] =>
  drafts.map((d) => ({
    label: d.label.trim(),
    options: parseOptions(d.optionsText),
    required: d.required,
  }))

/** Devuelve el primer problema que impide guardar, o null si todo está bien. */
export function validateChoiceDrafts(drafts: CustomChoiceDraft[]): string | null {
  const labels = new Set<string>()
  for (const [i, d] of drafts.entries()) {
    const n = i + 1
    const label = d.label.trim()
    if (!label) return `Falta el nombre de la opción ${n} (por ejemplo «Fuente»).`
    if (labels.has(label.toLowerCase())) return `Hay dos opciones que se llaman «${label}».`
    labels.add(label.toLowerCase())
    const options = parseOptions(d.optionsText)
    if (options.length < 2) return `«${label}» necesita al menos dos valores entre los que elegir.`
    if (options.length > CUSTOM_CHOICE_OPTIONS_MAX) {
      return `«${label}» tiene demasiados valores (máximo ${CUSTOM_CHOICE_OPTIONS_MAX}).`
    }
  }
  return null
}

/** Opciones que eligió el comprador en una línea de pedido. */
export function readLineItemChoices(metadata: unknown): { label: string; value: string }[] {
  if (typeof metadata !== 'object' || metadata === null) return []
  const raw = (metadata as Record<string, unknown>)[CUSTOM_CHOICES_KEY]
  if (!Array.isArray(raw)) return []
  return raw.flatMap((entry) => {
    if (typeof entry !== 'object' || entry === null) return []
    const e = entry as Record<string, unknown>
    const label = text(e.label)
    const value = text(e.value)
    return label && value ? [{ label, value }] : []
  })
}
