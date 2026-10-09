import { BRAND_LOGOS } from './brand-logos'
import { sdk } from './medusa'

/**
 * Piezas de contenido editables desde el panel ("Contenido web"): marcas de la
 * línea corredora, tarjetas de "Elige tu producto", muestras de color y
 * paneles "Más que stickers".
 *
 * Todas vienen del mismo endpoint (`/store/content-blocks?collection=…`) y
 * todas tienen un valor por defecto: si el backend falla o la colección está
 * vacía, la web enseña lo de siempre en vez de quedarse en blanco.
 */

interface StoreContentBlock {
  id: string
  key: string | null
  title: string | null
  subtitle: string | null
  description: string | null
  image: string | null
  value: string | null
  link_label: string | null
  link_href: string | null
}

type Collection = 'marquee' | 'product_type' | 'color_swatch' | 'showcase'

const text = (v: string | null | undefined) => {
  const t = typeof v === 'string' ? v.trim() : ''
  return t.length > 0 ? t : null
}

async function fetchBlocks(collection: Collection): Promise<StoreContentBlock[]> {
  try {
    const data = await sdk.client.fetch<{ content_blocks: StoreContentBlock[] }>(
      '/store/content-blocks',
      {
        query: { collection },
        next: { revalidate: 60, tags: ['content-blocks', `content-blocks:${collection}`] },
      } as Record<string, unknown>,
    )
    return data?.content_blocks ?? []
  } catch {
    return []
  }
}

/* ─── Línea corredora de marcas ─────────────────────────────────── */

export interface MarqueeItem {
  text: string
  /** Logo (opcional). Si existe, se pinta el logo en lugar del texto. */
  image: string | null
}

const MARQUEE_FALLBACK: MarqueeItem[] = BRAND_LOGOS.map((name) => ({ text: name, image: null }))

export async function getMarqueeItems(): Promise<MarqueeItem[]> {
  const items = (await fetchBlocks('marquee')).flatMap((b): MarqueeItem[] => {
    const title = text(b.title)
    const image = text(b.image)
    if (!title && !image) return []
    return [{ text: title ?? '', image }]
  })
  return items.length > 0 ? items : MARQUEE_FALLBACK
}

/* ─── Tarjetas "Elige tu producto" (Personalizadas) ─────────────── */

export interface ProductTypeContent {
  name?: string
  desc?: string
  image?: string
}

/** Contenido editado por tipo de producto (clave = id interno del tipo). */
export async function getProductTypeContent(): Promise<Record<string, ProductTypeContent>> {
  const out: Record<string, ProductTypeContent> = {}
  for (const b of await fetchBlocks('product_type')) {
    const key = text(b.key)
    if (!key) continue
    const name = text(b.title)
    const desc = text(b.description)
    const image = text(b.image)
    out[key] = {
      ...(name ? { name } : {}),
      ...(desc ? { desc } : {}),
      ...(image ? { image } : {}),
    }
  }
  return out
}

/* ─── Muestras de color de las variantes ────────────────────────── */

/**
 * Fondo CSS de cada muestra, por nombre de color en minúsculas. Una foto manda
 * sobre el color. Lo que no esté aquí lo resuelve el catálogo por defecto del
 * selector de variantes.
 */
export async function getColorSwatches(): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  for (const b of await fetchBlocks('color_swatch')) {
    const name = text(b.title)?.toLowerCase()
    if (!name) continue
    const image = text(b.image)
    const value = text(b.value)
    if (image) out[name] = `center / cover no-repeat url("${encodeURI(image)}")`
    else if (value) out[name] = value
  }
  return out
}

/* ─── Paneles "Más que stickers" (home) ─────────────────────────── */

export interface ShowcaseItem {
  eyebrow: string
  title: string
  description: string
  cta: string
  href: string
  image: string
  alt: string
}

const SHOWCASE_FALLBACK: ShowcaseItem[] = [
  {
    eyebrow: 'Servicio · Car Wrapping',
    title: 'Cambia el color de tu coche sin pintarlo',
    description:
      'Vinilado integral con láminas premium: mate, satinado, brillo o texturas especiales. Acabado de fábrica, reversible y protegiendo la pintura original.',
    cta: 'Ver car wrapping',
    href: '/servicios#car-wrapping',
    image: '/home/car-wrapping.jpg',
    alt: 'Coche de rally con vinilado integral RT Bunker',
  },
  {
    eyebrow: 'Servicio · Car Detailing',
    title: 'Detailing que devuelve el brillo de cero',
    description:
      'Limpieza profunda, corrección de pintura y protección cerámica. Tu coche como el primer día, por dentro y por fuera, en manos de especialistas.',
    cta: 'Ver detailing',
    href: '/servicios',
    image: '/home/car-detailing.jpg',
    alt: 'Proceso de car detailing y pulido de pintura',
  },
  {
    // Aquí vive el "Sobre nosotros" de la home (petición del cliente: el
    // bloque "Conoce la historia y valores de nuestra marca" va donde nacen
    // las RT Bunker, no en una franja aparte).
    eyebrow: 'Sobre nosotros · RT Bunker',
    title: 'El taller donde nacen las RT Bunker',
    description:
      'Conoce la historia y los valores de nuestra marca: un equipo obsesionado con el detalle y el vinilo bien puesto.',
    cta: 'Conócenos',
    href: '/nosotros',
    image: '/home/sobre-nosotros.jpg',
    alt: 'Equipo y taller de RT Bunker',
  },
]

export async function getShowcaseItems(): Promise<ShowcaseItem[]> {
  const items = (await fetchBlocks('showcase')).flatMap((b): ShowcaseItem[] => {
    const title = text(b.title)
    const image = text(b.image)
    // Un panel sin título o sin foto quedaría roto: se descarta.
    if (!title || !image) return []
    return [
      {
        eyebrow: text(b.subtitle) ?? '',
        title,
        description: text(b.description) ?? '',
        cta: text(b.link_label) ?? '',
        href: text(b.link_href) ?? '',
        image,
        alt: title,
      },
    ]
  })
  return items.length > 0 ? items : SHOWCASE_FALLBACK
}
