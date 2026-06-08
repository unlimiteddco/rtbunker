/**
 * Normaliza el título de variante para mostrar. Medusa asigna "Default
 * variant" / "Default" a los productos de una sola variante, lo cual no aporta
 * nada al cliente y queda feo en inglés. Devolvemos `null` en esos casos para
 * no renderizar la línea.
 */
export function formatVariantTitle(title?: string | null): string | null {
  if (!title) return null
  const t = title.trim()
  if (!t) return null
  if (/^default(\s+variant)?$/i.test(t)) return null
  return t
}
