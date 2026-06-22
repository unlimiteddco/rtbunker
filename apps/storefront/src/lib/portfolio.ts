/**
 * Portafolio de trabajos de RT Bunker.
 *
 * ── Para Nikita ──────────────────────────────────────────────────────
 * Para añadir un trabajo nuevo, copia uno de los objetos de abajo y
 * cambia los datos. Las fotos van en `/public/portfolio/` y se referencian
 * con ruta absoluta desde la raíz (p. ej. `/portfolio/mi-foto.jpg`).
 * Ver `public/portfolio/README.md` para el paso a paso.
 *
 * Campos:
 *   · id          identificador único (sin espacios, en minúsculas).
 *   · title       título del trabajo que se ve en la rejilla y el modal.
 *   · serviceType categoría — controla el filtro. Uno de SERVICE_TYPES.
 *   · thumbnail   foto que se ve en la rejilla.
 *   · images      todas las fotos del trabajo (carrusel del modal).
 *   · description texto descriptivo (qué se hizo, materiales, acabado…).
 *   · car         (opcional) modelo del coche.
 *   · materials   (opcional) materiales/vinilos usados.
 *   · date        (opcional) fecha o mes del trabajo.
 * ─────────────────────────────────────────────────────────────────────
 */

import { sdk } from './medusa'

export type ServiceType =
  | 'wrapping'
  | 'car-design'
  | 'chrome-delete'
  | 'ahumado'
  | 'rotulacion'

export interface PortfolioWork {
  id: string
  title: string
  serviceType: ServiceType
  thumbnail: string
  images: string[]
  description: string
  car?: string
  materials?: string
  date?: string
}

/** Etiquetas legibles por categoría (filtro + tag de la card). */
export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  wrapping: 'Full Wrap',
  'car-design': 'Car Design',
  'chrome-delete': 'Chrome Delete',
  ahumado: 'Ahumado',
  rotulacion: 'Rotulación',
}

/** Orden de las categorías en la barra de filtros. */
export const SERVICE_TYPES: ServiceType[] = [
  'wrapping',
  'car-design',
  'chrome-delete',
  'ahumado',
  'rotulacion',
]

// Trabajos placeholder de respaldo. Se muestran si el backend no está
// disponible o no devuelve trabajos publicados, para que la galería nunca
// quede vacía. El origen real de datos es `getPortfolioWorks()` (abajo).
export const PORTFOLIO_FALLBACK: PortfolioWork[] = [
  {
    id: 'wrapping-g63',
    title: 'Mercedes-AMG G63 · Full Wrap negro mate',
    serviceType: 'wrapping',
    thumbnail: '/portfolio/wrapping-g63-1.jpg',
    images: [
      '/portfolio/wrapping-g63-1.jpg',
      '/portfolio/wrapping-g63-2.jpg',
      '/portfolio/wrapping-g63-3.jpg',
    ],
    description:
      'Cambio de color completo a negro mate con desmontaje de embellecedores y faldones. Acabado uniforme en todas las piezas, incluidos pilares y manetas.',
    car: 'Mercedes-AMG G63',
    materials: '3M 2080 Matte Black',
    date: '2025',
  },
  {
    id: 'car-design-992',
    title: 'Porsche 911 (992) · Stripes y diseño deportivo',
    serviceType: 'car-design',
    thumbnail: '/portfolio/car-design-992-1.jpg',
    images: ['/portfolio/car-design-992-1.jpg', '/portfolio/car-design-992-2.jpg'],
    description:
      'Diseño de líneas deportivas a medida sobre carrocería original. Bandas centrales y laterales con corte preciso y bordes sellados.',
    car: 'Porsche 911 Carrera (992)',
    materials: 'KPMF impresión + laminado brillo',
    date: '2025',
  },
  {
    id: 'chrome-m3',
    title: 'BMW M3 · Chrome Delete integral',
    serviceType: 'chrome-delete',
    thumbnail: '/portfolio/chrome-m3-1.jpg',
    images: ['/portfolio/chrome-m3-1.jpg', '/portfolio/chrome-m3-2.jpg'],
    description:
      'Eliminado de todos los cromados (parrillas, marcos de ventanilla, molduras y logos) en negro brillo para un look más agresivo y limpio.',
    car: 'BMW M3 Competition',
    materials: '3M 2080 Gloss Black',
    date: '2025',
  },
  {
    id: 'ahumado-golf',
    title: 'Volkswagen Golf R · Ahumado de faros 35%',
    serviceType: 'ahumado',
    thumbnail: '/portfolio/ahumado-golf-1.jpg',
    images: ['/portfolio/ahumado-golf-1.jpg', '/portfolio/ahumado-golf-2.jpg'],
    description:
      'Ahumado de pilotos delanteros y traseros con film homologado al 35% de transmisión. Mantiene la visibilidad nocturna y respeta la normativa.',
    car: 'Volkswagen Golf R',
    materials: 'Lámina de ahumado homologada 35%',
    date: '2024',
  },
  {
    id: 'rotulacion-sprinter',
    title: 'Mercedes Sprinter · Rotulación de flota',
    serviceType: 'rotulacion',
    thumbnail: '/portfolio/rotulacion-sprinter-1.jpg',
    images: ['/portfolio/rotulacion-sprinter-1.jpg', '/portfolio/rotulacion-sprinter-2.jpg'],
    description:
      'Branding corporativo en furgoneta comercial: logotipo, datos de contacto y elementos gráficos de marca con vinilo de corte de larga duración.',
    car: 'Mercedes-Benz Sprinter',
    materials: 'Vinilo de corte premium',
    date: '2024',
  },
  {
    id: 'car-design-rs6',
    title: 'Audi RS6 · Capó en carbón vinílico',
    serviceType: 'car-design',
    thumbnail: '/portfolio/car-design-rs6-1.jpg',
    images: ['/portfolio/car-design-rs6-1.jpg', '/portfolio/car-design-rs6-2.jpg'],
    description:
      'Detalle de capó y techo en textura carbono 4D para un acabado deportivo sin el coste de piezas de fibra. Bordes envueltos y sellados.',
    car: 'Audi RS6 Avant',
    materials: '3M Di-Noc Carbon 4D',
    date: '2024',
  },
]

/**
 * Alias retrocompatible. Mantiene los imports existentes de `PORTFOLIO`
 * funcionando (apuntan al respaldo estático). El origen real de datos es
 * `getPortfolioWorks()`.
 */
export const PORTFOLIO: PortfolioWork[] = PORTFOLIO_FALLBACK

/** Shape crudo que devuelve la ruta pública GET /store/portfolio. */
interface StorePortfolioWork {
  id: string
  service_type: ServiceType
  title: string
  description: string
  car?: string | null
  materials?: string | null
  date_label?: string | null
  thumbnail?: string | null
  images?: string[] | null
  rank?: number
}

interface StorePortfolioResponse {
  portfolio_works: StorePortfolioWork[]
  count: number
  limit: number
  offset: number
}

/** Mapea un trabajo del backend al shape que consume el storefront. */
function mapStoreWork(w: StorePortfolioWork): PortfolioWork {
  const images = Array.isArray(w.images) ? w.images : []
  const thumbnail = w.thumbnail ?? images[0] ?? ''

  return {
    id: w.id,
    title: w.title,
    serviceType: w.service_type,
    thumbnail,
    images,
    description: w.description,
    ...(w.car ? { car: w.car } : {}),
    ...(w.materials ? { materials: w.materials } : {}),
    ...(w.date_label ? { date: w.date_label } : {}),
  }
}

/**
 * Trabajos del portafolio desde el backend (módulo `portfolio`). Server-side.
 * Solo publicados, orden rank asc. Es RESILIENTE: si el backend falla o no
 * devuelve trabajos, cae al respaldo estático `PORTFOLIO_FALLBACK`. Nunca lanza.
 */
export async function getPortfolioWorks(): Promise<PortfolioWork[]> {
  try {
    const data = await sdk.client.fetch<StorePortfolioResponse>('/store/portfolio', {
      query: { limit: 100 },
      next: { revalidate: 60, tags: ['portfolio'] },
    } as Record<string, unknown>)

    const works = (data?.portfolio_works ?? []).map(mapStoreWork)
    return works.length > 0 ? works : PORTFOLIO_FALLBACK
  } catch {
    return PORTFOLIO_FALLBACK
  }
}
