/**
 * Contenido editable del sitio servido por el backend (módulo `store-content`).
 *
 * Tres bloques que antes vivían hardcodeados en los componentes y ahora se
 * editan desde el admin:
 *   · Servicios      → GET /store/service-items      (services-grid.tsx)
 *   · Cómo trabajamos→ GET /store/process-steps      (services-process.tsx)
 *   · Categorías home→ GET /store/featured-categories(category-grid.tsx)
 *
 * Las tres funciones son RESILIENTES: nunca lanzan. Si el backend está caído
 * o devuelve una lista vacía, caen al respaldo estático (`*_FALLBACK`), que es
 * copia literal de lo que había hardcodeado. Con el backend apagado la web se
 * ve exactamente igual que antes.
 */

import {
  CalendarCheck,
  Car,
  Hammer,
  Layers,
  Lightbulb,
  MessageSquare,
  Paintbrush2,
  ShieldCheck,
  Sparkles,
  Truck,
  Type,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { sdk } from './medusa'

/* ------------------------------------------------------------------ */
/* Iconos                                                              */
/* ------------------------------------------------------------------ */

/**
 * El backend guarda el icono como STRING (nombre de lucide-react). Aquí se
 * resuelve al componente. Para permitir un icono nuevo desde el admin basta
 * con añadirlo a este mapa.
 */
export const ICONS: Record<string, LucideIcon> = {
  CalendarCheck,
  Car,
  Hammer,
  Layers,
  Lightbulb,
  MessageSquare,
  Paintbrush2,
  ShieldCheck,
  Sparkles,
  Truck,
  Type,
}

/** Icono usado cuando el nombre guardado no existe en el mapa. */
export const DEFAULT_ICON: LucideIcon = Sparkles

/** Resuelve el nombre del icono a componente, con respaldo seguro. */
export function resolveIcon(name?: string | null): LucideIcon {
  if (!name) return DEFAULT_ICON
  return ICONS[name] ?? DEFAULT_ICON
}

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

export interface ServiceItem {
  id: string
  /**
   * Ancla estable de la tarjeta (`<article id>`). La usan enlaces ya
   * publicados como `/servicios#car-wrapping`, así que no se deriva del id
   * del backend sino del título (ver `anchorForTitle`).
   */
  anchor: string
  /** Etiqueta pequeña sobre el título ("Superficial · Full Wrap"). */
  eyebrow: string
  title: string
  description: string
  bullets: string[]
  ctaLabel: string
  ctaHref: string
  /** Nombre del icono lucide-react; resolver con `resolveIcon`. */
  icon: string
  image?: string | undefined
  featured: boolean
}

export interface ProcessStep {
  id: string
  title: string
  description: string
  /** Píldora corta del paso ("< 24 h", "Sin compromiso"…). */
  badge: string
  /** Nombre del icono lucide-react; resolver con `resolveIcon`. */
  icon: string
}

export interface FeaturedCategory {
  id: string
  /** Handle de la categoría real de Medusa a la que apunta el tile. */
  categoryHandle: string
  /** Título a mostrar; si falta se usa el nombre real de la categoría. */
  label?: string | undefined
  /** Foto del tile; si falta se usa la del primer producto de la categoría. */
  image?: string | undefined
}

/* ------------------------------------------------------------------ */
/* Respaldos estáticos (copia literal de lo que estaba hardcodeado)     */
/* ------------------------------------------------------------------ */

export const SERVICE_ITEMS_FALLBACK: ServiceItem[] = [
  {
    id: 'car-wrapping',
    anchor: 'car-wrapping',
    icon: 'Layers',
    title: 'Car Wrapping',
    eyebrow: 'Superficial · Full Wrap',
    description:
      'Cambia el color, textura o acabado de tu coche con vinilo de calidad cast. Aplicamos en zonas exteriores o desmontaje completo para un Full Wrap impecable.',
    bullets: ['Materiales 3M / Hexis / KPMF', 'Garantía 2 años', 'Desmontaje incluido'],
    ctaLabel: 'Solicitar presupuesto · Gratis',
    ctaHref: '/contacto',
    featured: true,
  },
  {
    id: 'car-design',
    anchor: 'car-design',
    icon: 'Paintbrush2',
    title: 'Car Design',
    eyebrow: 'Diseño exterior a medida',
    description:
      'Vinilados parciales pensados para personalizar capó, techo, retrovisores o stripes laterales. Ideal si buscas un toque único sin recubrir el coche entero.',
    bullets: ['Diseños propios o brief', 'Plantillas digitales', 'Acabados mate / brillo / satin'],
    ctaLabel: 'Solicitar presupuesto · Gratis',
    ctaHref: '/contacto',
    featured: false,
  },
  {
    id: 'chrome-delete',
    anchor: 'chrome-delete',
    icon: 'Sparkles',
    title: 'Chrome Delete',
    eyebrow: 'Eliminar cromados',
    description:
      'Cubrimos todas las molduras y embellecedores cromados de tu coche con vinilo negro o de color. Look agresivo, limpio y reversible en cualquier momento.',
    bullets: ['Marcos ventana / parrilla', 'Negro brillo o mate', 'Sin pegamentos residuales'],
    ctaLabel: 'Solicitar presupuesto · Gratis',
    ctaHref: '/contacto',
    featured: false,
  },
  {
    id: 'ahumado-faros',
    anchor: 'ahumado-faros',
    icon: 'Lightbulb',
    title: 'Ahumado de faros',
    eyebrow: 'Faros + protección',
    description:
      'Vinilos translúcidos homologables para oscurecer faros y pilotos sin perder visibilidad. También aplicamos láminas de protección PPF en zonas vulnerables.',
    bullets: ['Tonos 20% · 35% · 50%', 'Protección antigrava', 'Homologable ITV'],
    ctaLabel: 'Solicitar presupuesto · Gratis',
    ctaHref: '/contacto',
    featured: false,
  },
  {
    id: 'rotulacion',
    anchor: 'rotulacion',
    icon: 'Type',
    title: 'Rotulación de vehículos',
    eyebrow: 'Flotas y branding',
    description:
      'Diseñamos y aplicamos rotulaciones para furgonetas, coches comerciales y flotas. Branding completo con tu logo, copy y datos de contacto sobre vinilo de larga duración.',
    bullets: ['Diseño incluido', 'Aplicación en taller', 'Facturación a empresa'],
    ctaLabel: 'Solicitar presupuesto · Gratis',
    ctaHref: '/contacto',
    featured: false,
  },
]

export const PROCESS_STEPS_FALLBACK: ProcessStep[] = [
  {
    id: 'briefing',
    icon: 'MessageSquare',
    title: 'Briefing',
    description:
      'Cuéntanos qué buscas: foto del coche, referencias, idea. Te respondemos por WhatsApp o email con todas las preguntas clave.',
    badge: '< 24 h',
  },
  {
    id: 'presupuesto-cita',
    icon: 'CalendarCheck',
    title: 'Presupuesto + cita',
    description:
      'Recibes un presupuesto detallado por escrito. Si te encaja, cerramos día y hora en taller. Sin sorpresas posteriores.',
    badge: 'Sin compromiso',
  },
  {
    id: 'aplicacion-taller',
    icon: 'Hammer',
    title: 'Aplicación en taller',
    description:
      'Trabajamos en boxes cerrados, con calefacción y filtrado de polvo. Te avisamos cuando avanzamos para que veas el progreso.',
    badge: '1 a 5 días',
  },
  {
    id: 'entrega-garantia',
    icon: 'Sparkles',
    title: 'Entrega + garantía',
    description:
      'Revisamos contigo el resultado, te damos las instrucciones de cuidado y firmamos la garantía oficial del material aplicado.',
    badge: 'Garantía 2 años',
  },
]

/**
 * No hay respaldo estático de categorías destacadas: el comportamiento
 * histórico (y el de respaldo) es coger las 4 primeras categorías reales de
 * Medusa. Ese caso lo resuelve el propio `CategoryGrid` cuando esta lista
 * viene vacía.
 */
export const FEATURED_CATEGORIES_FALLBACK: FeaturedCategory[] = []

/* ------------------------------------------------------------------ */
/* Anclas de servicio                                                  */
/* ------------------------------------------------------------------ */

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Anclas históricas por título. Evita romper enlaces ya publicados como
 * `/servicios#car-wrapping` cuando el servicio viene del backend (cuyo id es
 * un ULID). Se construye desde el respaldo, así que se mantiene sola.
 */
const LEGACY_ANCHORS_BY_TITLE = new Map(
  SERVICE_ITEMS_FALLBACK.map((s) => [s.title.toLowerCase(), s.anchor] as const),
)

function anchorForTitle(title: string, fallbackId: string): string {
  const legacy = LEGACY_ANCHORS_BY_TITLE.get(title.toLowerCase())
  if (legacy) return legacy
  return slugify(title) || fallbackId
}

/* ------------------------------------------------------------------ */
/* Shapes crudos de las rutas públicas                                 */
/* ------------------------------------------------------------------ */

interface StoreServiceItem {
  id: string
  eyebrow?: string | null
  title?: string | null
  description?: string | null
  bullets?: string[] | null
  cta_label?: string | null
  cta_href?: string | null
  icon?: string | null
  image?: string | null
  featured?: boolean | null
  rank?: number
}

interface StoreServiceItemsResponse {
  service_items: StoreServiceItem[]
  count: number
  limit: number
  offset: number
}

interface StoreProcessStep {
  id: string
  title?: string | null
  description?: string | null
  badge?: string | null
  icon?: string | null
  rank?: number
}

interface StoreProcessStepsResponse {
  process_steps: StoreProcessStep[]
  count: number
  limit: number
  offset: number
}

interface StoreFeaturedCategory {
  id: string
  category_handle?: string | null
  label?: string | null
  image?: string | null
  rank?: number
}

interface StoreFeaturedCategoriesResponse {
  featured_categories: StoreFeaturedCategory[]
  count: number
  limit: number
  offset: number
}

/* ------------------------------------------------------------------ */
/* Mapeadores                                                          */
/* ------------------------------------------------------------------ */

function mapServiceItem(s: StoreServiceItem): ServiceItem {
  const title = s.title ?? ''
  const image = s.image ?? undefined

  return {
    id: s.id,
    anchor: anchorForTitle(title, s.id),
    eyebrow: s.eyebrow ?? '',
    title,
    description: s.description ?? '',
    bullets: Array.isArray(s.bullets) ? s.bullets : [],
    ctaLabel: s.cta_label ?? 'Solicitar presupuesto · Gratis',
    ctaHref: s.cta_href ?? '/contacto',
    icon: s.icon ?? 'Sparkles',
    featured: Boolean(s.featured),
    ...(image ? { image } : {}),
  }
}

function mapProcessStep(s: StoreProcessStep): ProcessStep {
  return {
    id: s.id,
    title: s.title ?? '',
    description: s.description ?? '',
    badge: s.badge ?? '',
    icon: s.icon ?? 'Sparkles',
  }
}

function mapFeaturedCategory(c: StoreFeaturedCategory): FeaturedCategory | null {
  const handle = c.category_handle?.trim()
  if (!handle) return null

  const label = c.label ?? undefined
  const image = c.image ?? undefined

  return {
    id: c.id,
    categoryHandle: handle,
    ...(label ? { label } : {}),
    ...(image ? { image } : {}),
  }
}

/* ------------------------------------------------------------------ */
/* Fetchers resilientes                                                */
/* ------------------------------------------------------------------ */

/**
 * Tarjetas de la página de Servicios. Solo publicadas, orden rank asc.
 * Cae a `SERVICE_ITEMS_FALLBACK` si el backend falla o no devuelve nada.
 */
export async function getServiceItems(): Promise<ServiceItem[]> {
  try {
    const data = await sdk.client.fetch<StoreServiceItemsResponse>('/store/service-items', {
      query: { limit: 100 },
      next: { revalidate: 60, tags: ['service-items'] },
    } as Record<string, unknown>)

    const items = (data?.service_items ?? []).map(mapServiceItem)
    return items.length > 0 ? items : SERVICE_ITEMS_FALLBACK
  } catch {
    return SERVICE_ITEMS_FALLBACK
  }
}

/**
 * Pasos del "Cómo trabajamos". Solo publicados, orden rank asc.
 * Cae a `PROCESS_STEPS_FALLBACK` si el backend falla o no devuelve nada.
 */
export async function getProcessSteps(): Promise<ProcessStep[]> {
  try {
    const data = await sdk.client.fetch<StoreProcessStepsResponse>('/store/process-steps', {
      query: { limit: 100 },
      next: { revalidate: 60, tags: ['process-steps'] },
    } as Record<string, unknown>)

    const steps = (data?.process_steps ?? []).map(mapProcessStep)
    return steps.length > 0 ? steps : PROCESS_STEPS_FALLBACK
  } catch {
    return PROCESS_STEPS_FALLBACK
  }
}

/**
 * Categorías destacadas de la home. Solo publicadas, orden rank asc.
 * Devuelve lista vacía si el backend falla: `CategoryGrid` interpreta ese caso
 * como "usa las 4 primeras categorías reales" (comportamiento histórico).
 */
export async function getFeaturedCategories(): Promise<FeaturedCategory[]> {
  try {
    const data = await sdk.client.fetch<StoreFeaturedCategoriesResponse>(
      '/store/featured-categories',
      {
        query: { limit: 100 },
        next: { revalidate: 60, tags: ['featured-categories'] },
      } as Record<string, unknown>,
    )

    const cats = (data?.featured_categories ?? [])
      .map(mapFeaturedCategory)
      .filter((c): c is FeaturedCategory => c !== null)

    return cats.length > 0 ? cats : FEATURED_CATEGORIES_FALLBACK
  } catch {
    return FEATURED_CATEGORIES_FALLBACK
  }
}
