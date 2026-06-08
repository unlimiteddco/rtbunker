/**
 * Convierte HTML (típicamente descripciones importadas de WooCommerce) en
 * texto plano legible, preservando los saltos de párrafo. Pensado para
 * renderizar dentro de un contenedor con `whitespace-pre-line`.
 *
 * - Cierres de bloque (`</p>`, `</div>`, `</li>`…) y `<br>` → salto de línea.
 * - Resto de etiquetas → se eliminan.
 * - Entidades HTML (`&nbsp;`, `&aacute;`, `&#39;`…) → su carácter real.
 * - Colapsa espacios y saltos de línea redundantes.
 */
const NAMED_ENTITIES: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  hellip: '…',
  mdash: '—',
  ndash: '–',
  laquo: '«',
  raquo: '»',
  ldquo: '“',
  rdquo: '”',
  lsquo: '‘',
  rsquo: '’',
  deg: '°',
  euro: '€',
  aacute: 'á',
  eacute: 'é',
  iacute: 'í',
  oacute: 'ó',
  uacute: 'ú',
  Aacute: 'Á',
  Eacute: 'É',
  Iacute: 'Í',
  Oacute: 'Ó',
  Uacute: 'Ú',
  ntilde: 'ñ',
  Ntilde: 'Ñ',
  uuml: 'ü',
  Uuml: 'Ü',
  iquest: '¿',
  iexcl: '¡',
}

function decodeEntities(input: string): string {
  return input
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&([a-z]+);/gi, (match, name: string) => NAMED_ENTITIES[name] ?? match)
}

export function htmlToText(html?: string | null): string {
  if (!html) return ''
  return decodeEntities(
    html
      // saltos de párrafo / lista / línea → newline
      .replace(/<\/(p|div|li|h[1-6]|tr|blockquote)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      // resto de etiquetas fuera
      .replace(/<[^>]+>/g, ''),
  )
    // limpieza de espacios
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
