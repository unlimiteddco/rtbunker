/** Tipos compartidos por los scripts de migración. */

export interface WooImage {
  id: number
  src: string
  alt?: string
}

export interface WooCategory {
  id: number
  name: string
  slug: string
}

export interface WooAttribute {
  id: number
  name: string
  options: string[]
  variation: boolean
}

export interface WooProduct {
  id: number
  slug: string
  name: string
  type: 'simple' | 'variable' | 'grouped' | 'external'
  status: string
  description: string
  short_description: string
  sku: string
  price: string
  regular_price: string
  sale_price: string
  weight: string
  stock_quantity: number | null
  manage_stock: boolean
  in_stock: boolean
  categories: WooCategory[]
  images: WooImage[]
  attributes: WooAttribute[]
  variations: number[]
}

export interface WooVariation {
  id: number
  sku: string
  price: string
  regular_price: string
  sale_price: string
  stock_quantity: number | null
  attributes: { name: string; option: string }[]
  image?: WooImage
}

export interface WooCustomer {
  id: number
  email: string
  first_name: string
  last_name: string
  phone?: string
  billing?: {
    address_1?: string
    address_2?: string
    city?: string
    postcode?: string
    country?: string
    state?: string
    phone?: string
  }
  shipping?: {
    address_1?: string
    address_2?: string
    city?: string
    postcode?: string
    country?: string
    state?: string
  }
}

export interface MediaMapping {
  /** URL original en WordPress. */
  source: string
  /** URL final en R2 (CDN). */
  destination: string
}
