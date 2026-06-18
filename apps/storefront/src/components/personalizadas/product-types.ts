/**
 * Personalizadas — tipo de producto (paso "Tipo de producto" del configurador).
 *
 * Cambios reunión Nikita: el cliente elige primero el tipo de producto.
 * Hoy solo "Vinilos" y "Hojas de pegatinas" están disponibles (mismo precio,
 * mult 1.0×). El resto (Holográfico, Glitter, Cromo) se muestran tachados y
 * deshabilitados como "Próximamente".
 */

export type ProductTypeId = 'vinyls' | 'sheets' | 'holo' | 'glitter' | 'chrome'

export interface ProductType {
  id: ProductTypeId
  name: string
  /** Multiplicador de precio sobre la base (por ahora 1.0× en los activos). */
  mult: number
  /** false → tarjeta tachada y no seleccionable. */
  enabled: boolean
  /** true → muestra etiqueta "Próximamente". */
  comingSoon?: boolean
  desc?: string
}

export const PRODUCT_TYPES: ProductType[] = [
  {
    id: 'vinyls',
    name: 'Vinilos',
    mult: 1.0,
    enabled: true,
    desc: 'Pegatinas individuales en vinilo premium',
  },
  {
    id: 'sheets',
    name: 'Hojas de pegatinas',
    mult: 1.0,
    enabled: true,
    desc: 'Varias pegatinas troqueladas en una hoja',
  },
  {
    id: 'holo',
    name: 'Holográfico',
    mult: 1.0,
    enabled: false,
    comingSoon: true,
    desc: 'Efecto arcoíris',
  },
  {
    id: 'glitter',
    name: 'Glitter',
    mult: 1.0,
    enabled: false,
    comingSoon: true,
    desc: 'Acabado con purpurina',
  },
  {
    id: 'chrome',
    name: 'Cromo',
    mult: 1.0,
    enabled: false,
    comingSoon: true,
    desc: 'Acabado metálico espejo',
  },
]

export const DEFAULT_PRODUCT_TYPE: ProductTypeId = 'vinyls'
