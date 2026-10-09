/**
 * Colecciones de `content_block` (módulo siteContent) y su contenido inicial.
 *
 * El contenido inicial es el que estaba escrito a mano en el storefront: se
 * siembra al arrancar (ver `scripts/startup.ts`) para que en el panel
 * "Contenido web" aparezca todo lo que ya se ve en la web, listo para editar.
 */

export const CONTENT_COLLECTIONS = ['marquee', 'product_type', 'color_swatch', 'showcase'] as const
export type ContentCollection = (typeof CONTENT_COLLECTIONS)[number]

export const isContentCollection = (v: unknown): v is ContentCollection =>
  typeof v === 'string' && (CONTENT_COLLECTIONS as readonly string[]).includes(v)

/**
 * Colecciones de piezas FIJAS: el código necesita reconocer cada una por su
 * `key` (p. ej. el configurador de personalizadas según el tipo), así que no
 * se pueden crear ni borrar desde el panel, solo editar.
 */
export const FIXED_COLLECTIONS: readonly ContentCollection[] = ['product_type']

export type ContentBlockSeed = {
  key?: string | null
  title?: string | null
  subtitle?: string | null
  description?: string | null
  image?: string | null
  value?: string | null
  link_label?: string | null
  link_href?: string | null
}

export const CONTENT_BLOCK_DEFAULTS: Record<ContentCollection, ContentBlockSeed[]> = {
  // Línea corredora de marcas (hero de Servicios y página Personalizadas).
  marquee: [
    'BMW',
    'Audi',
    'Porsche',
    'Mercedes',
    'Volkswagen',
    'Seat',
    'Cupra',
    'Toyota',
    'Nissan',
    'Subaru',
  ].map((title) => ({ title })),

  // Tarjetas "Elige tu producto" de /personalizadas.
  product_type: [
    { key: 'vinyls', title: 'Vinilos', description: 'Pegatinas individuales en vinilo premium' },
    {
      key: 'sheets',
      title: 'Hojas de pegatinas',
      description: 'Varias pegatinas troqueladas en una hoja',
    },
    { key: 'holo', title: 'Holográfico', description: 'Efecto arcoíris' },
    { key: 'glitter', title: 'Glitter', description: 'Acabado con purpurina' },
    { key: 'chrome', title: 'Cromo', description: 'Acabado metálico espejo' },
  ],

  // Muestras de color del selector de variantes (mismo catálogo que traía el
  // storefront). `value` admite un color (#hex) o un degradado CSS.
  color_swatch: [
    { title: 'Negro brillo', value: '#0a0a0a' },
    { title: 'Negro mate', value: '#2b2b2b' },
    { title: 'Blanco', value: '#ffffff' },
    { title: 'Amarillo', value: '#ffd83d' },
    { title: 'Dorado', value: '#d4af37' },
    { title: 'Rojo', value: '#e53935' },
    { title: 'Rosa', value: '#ec407a' },
    { title: 'Lila', value: '#ce93d8' },
    { title: 'Morado', value: '#5e35b1' },
    { title: 'Azul turquesa', value: '#26c6a4' },
    { title: 'Azul claro', value: '#42a5f5' },
    { title: 'Azul oscuro', value: '#1a4ad8' },
    { title: 'Verde pistacho', value: '#9ccc65' },
    { title: 'Verde oscuro', value: '#2e7d32' },
    { title: 'Gris', value: '#9e9e9e' },
    { title: 'Plata', value: '#bdbdbd' },
    {
      title: 'Holografico',
      value:
        'linear-gradient(135deg, #b8c5ff 0%, #d9c4f5 25%, #ffd9d0 50%, #c4f0d9 75%, #b8e4ff 100%)',
    },
    {
      title: 'Cobre/Bronce',
      value: 'linear-gradient(135deg, #c97f4a 0%, #e0a878 30%, #8e4a26 65%, #c97f4a 100%)',
    },
    {
      title: 'Amarillo fluor',
      value: 'linear-gradient(135deg, #d8ff00 0%, #f0ff00 50%, #c9ff3d 100%)',
    },
  ],

  // Paneles "Más que stickers" de la home.
  showcase: [
    {
      subtitle: 'Servicio · Car Wrapping',
      title: 'Cambia el color de tu coche sin pintarlo',
      description:
        'Vinilado integral con láminas premium: mate, satinado, brillo o texturas especiales. Acabado de fábrica, reversible y protegiendo la pintura original.',
      link_label: 'Ver car wrapping',
      link_href: '/servicios#car-wrapping',
      image: '/home/car-wrapping.jpg',
    },
    {
      subtitle: 'Servicio · Car Detailing',
      title: 'Detailing que devuelve el brillo de cero',
      description:
        'Limpieza profunda, corrección de pintura y protección cerámica. Tu coche como el primer día, por dentro y por fuera, en manos de especialistas.',
      link_label: 'Ver detailing',
      link_href: '/servicios',
      image: '/home/car-detailing.jpg',
    },
    {
      subtitle: 'Sobre nosotros · RT Bunker',
      title: 'El taller donde nacen las RT Bunker',
      description:
        'Conoce la historia y los valores de nuestra marca: un equipo obsesionado con el detalle y el vinilo bien puesto.',
      link_label: 'Conócenos',
      link_href: '/nosotros',
      image: '/home/sobre-nosotros.jpg',
    },
  ],
}

/** Campos que devuelven las rutas (admin y tienda). */
export const CONTENT_BLOCK_FIELDS = [
  'id',
  'collection',
  'key',
  'title',
  'subtitle',
  'description',
  'image',
  'value',
  'link_label',
  'link_href',
  'rank',
  'published',
]
