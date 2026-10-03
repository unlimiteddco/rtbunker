/**
 * Textos e imagen por defecto para buscadores y para cuando se comparte un
 * enlace (WhatsApp, Instagram, iMessage…). Los usa el layout raíz como valor
 * heredado y las páginas que definen su propio `openGraph`, porque en Next un
 * `openGraph` de página REEMPLAZA entero al del layout (se perdería la imagen).
 */
export const SITE_NAME = 'RT Bunker'

export const DEFAULT_TITLE = 'RT Bunker · Pegatinas premium para tu coche'

export const DEFAULT_DESCRIPTION =
  'Pegatinas y vinilos para coche fabricados en España: más de 120 diseños listos para enviar en 24-72 h, pegatinas personalizadas y car wrapping en Zaragoza.'

/** 1200×630, la proporción que piden WhatsApp, Facebook y X para la vista previa grande. */
export const OG_IMAGE = {
  url: '/og.jpg',
  width: 1200,
  height: 630,
  alt: 'RT Bunker · Pegatinas premium para tu coche',
}

/**
 * Bloque `openGraph` + `twitter` para una página concreta: así, al compartir
 * /personalizadas o /planes, la vista previa lleva el título de ESA página y
 * no el genérico de la portada. `image` permite poner una foto propia (p. ej.
 * la del producto); si no, va la imagen general de la marca.
 */
export function shareMetadata(input: {
  title: string
  description?: string | undefined
  /** Ruta con locale, p. ej. `/es/planes`. */
  path?: string | undefined
  image?: string | null | undefined
}) {
  const images = input.image ? [{ url: input.image }] : [OG_IMAGE]
  return {
    openGraph: {
      siteName: SITE_NAME,
      type: 'website' as const,
      locale: 'es_ES',
      title: input.title,
      description: input.description,
      ...(input.path ? { url: input.path } : {}),
      images,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: input.title,
      description: input.description,
      images: images.map((i) => i.url),
    },
  }
}

/**
 * Texto plano y corto para `description`: las descripciones de producto vienen
 * en HTML (<p>…</p>) y, sin limpiar, las etiquetas salían tal cual en Google y
 * en la vista previa al compartir.
 */
export function plainDescription(html: string | null | undefined, max = 160): string | undefined {
  if (!html) return undefined
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return undefined
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}
