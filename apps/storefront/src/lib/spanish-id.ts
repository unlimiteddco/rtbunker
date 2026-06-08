/**
 * Validación de DNI / NIE / CIF español.
 *
 * - DNI: 8 dígitos + letra de control (módulo 23 sobre la tabla oficial).
 * - NIE: prefijo X|Y|Z + 7 dígitos + letra de control (X→0, Y→1, Z→2).
 * - CIF: letra inicial (organización) + 7 dígitos + dígito o letra de control
 *   (algoritmo Luhn modificado oficial).
 *
 * Usar este módulo en `/registro`, `/checkout` (address step) y en el
 * configurador de `/personalizadas` antes de pasar al cart.
 */

const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE'
const NIE_PREFIX_MAP: Record<string, string> = { X: '0', Y: '1', Z: '2' }

const DNI_REGEX = /^([0-9]{8})([A-Z])$/
const NIE_REGEX = /^([XYZ])([0-9]{7})([A-Z])$/
const CIF_REGEX = /^([ABCDEFGHJNPQRSUVW])([0-9]{7})([0-9A-J])$/

export type SpanishIdKind = 'dni' | 'nie' | 'cif'

export interface SpanishIdValidation {
  valid: boolean
  kind: SpanishIdKind | null
  /** Forma canónica en mayúsculas sin espacios ni guiones. */
  normalized: string
}

export function normalizeSpanishId(value: string): string {
  return value.replace(/[\s-]/g, '').toUpperCase()
}

export function validateSpanishId(rawValue: string): SpanishIdValidation {
  const value = normalizeSpanishId(rawValue ?? '')
  if (!value) return { valid: false, kind: null, normalized: value }

  // DNI
  const dniMatch = value.match(DNI_REGEX)
  if (dniMatch) {
    const numbers = dniMatch[1]!
    const letter = dniMatch[2]!
    const expected = DNI_LETTERS[parseInt(numbers, 10) % 23]
    return {
      valid: expected === letter,
      kind: 'dni',
      normalized: value,
    }
  }

  // NIE
  const nieMatch = value.match(NIE_REGEX)
  if (nieMatch) {
    const prefix = nieMatch[1]!
    const numbers = nieMatch[2]!
    const letter = nieMatch[3]!
    const numericPrefix = NIE_PREFIX_MAP[prefix]!
    const expected = DNI_LETTERS[parseInt(`${numericPrefix}${numbers}`, 10) % 23]
    return {
      valid: expected === letter,
      kind: 'nie',
      normalized: value,
    }
  }

  // CIF
  const cifMatch = value.match(CIF_REGEX)
  if (cifMatch) {
    const orgLetter = cifMatch[1]!
    const numbers = cifMatch[2]!
    const control = cifMatch[3]!

    let evenSum = 0
    let oddSum = 0
    for (let i = 0; i < numbers.length; i++) {
      const n = parseInt(numbers[i]!, 10)
      if ((i + 1) % 2 === 0) {
        evenSum += n
      } else {
        const doubled = n * 2
        oddSum += Math.floor(doubled / 10) + (doubled % 10)
      }
    }
    const totalUnit = (evenSum + oddSum) % 10
    const controlDigit = totalUnit === 0 ? 0 : 10 - totalUnit

    // Para organizaciones del grupo PQRSW el control DEBE ser letra (J K L M N P Q R S W)
    const lettersGroup = 'PQRSW'
    const needLetter = lettersGroup.includes(orgLetter)
    const controlLetterMap = 'JABCDEFGHI'
    const expectedLetter = controlLetterMap[controlDigit]

    let isValid = false
    if (needLetter) {
      isValid = control === expectedLetter
    } else {
      // ABEH solo dígito; el resto admite ambos
      if (/[0-9]/.test(control)) {
        isValid = parseInt(control, 10) === controlDigit
      } else {
        isValid = control === expectedLetter
      }
    }

    return { valid: isValid, kind: 'cif', normalized: value }
  }

  return { valid: false, kind: null, normalized: value }
}

/**
 * Devuelve `true` si el string es un DNI, NIE o CIF español válido.
 * Atajo para usar dentro de `zod.refine(...)`.
 */
export function isValidSpanishId(value: string): boolean {
  return validateSpanishId(value).valid
}
