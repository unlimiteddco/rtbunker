import 'dotenv/config'

const WP_BASE = process.env.WP_BASE_URL!

/**
 * Autenticación contra WooCommerce REST API.
 *
 * Aceptamos dos esquemas, con preferencia por consumer_key/consumer_secret
 * (lo que da Woo en "WooCommerce → Settings → Advanced → REST API"). Si no
 * están definidos, caemos a WP Application Password como compatibilidad.
 */
const KEY = process.env.WC_CONSUMER_KEY ?? process.env.WP_USERNAME
const SECRET = process.env.WC_CONSUMER_SECRET ?? process.env.WP_APPLICATION_PASSWORD

if (!WP_BASE || !KEY || !SECRET) {
  throw new Error(
    'Faltan WP_BASE_URL + WC_CONSUMER_KEY/WC_CONSUMER_SECRET (o WP_USERNAME/WP_APPLICATION_PASSWORD) en el .env',
  )
}

const AUTH = `Basic ${Buffer.from(`${KEY}:${SECRET}`).toString('base64')}`

export interface PaginatedFetchOptions {
  per_page?: number
  /** parámetros adicionales serializables. */
  query?: Record<string, string | number | boolean>
}

export async function* paginate<T>(
  endpoint: string,
  options: PaginatedFetchOptions = {},
): AsyncGenerator<T[]> {
  const perPage = options.per_page ?? 100
  let page = 1
  while (true) {
    const url = new URL(`${WP_BASE}/wp-json/wc/v3${endpoint}`)
    url.searchParams.set('per_page', String(perPage))
    url.searchParams.set('page', String(page))
    for (const [k, v] of Object.entries(options.query ?? {})) {
      url.searchParams.set(k, String(v))
    }

    const res = await fetch(url, { headers: { Authorization: AUTH } })
    if (!res.ok) {
      throw new Error(`Woo ${endpoint} page ${page} failed: ${res.status} ${res.statusText}`)
    }
    const totalPages = Number(res.headers.get('X-WP-TotalPages') ?? '1')
    const items = (await res.json()) as T[]
    if (items.length === 0) return
    yield items
    if (page >= totalPages) return
    page += 1
  }
}

export async function wooGet<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${WP_BASE}/wp-json/wc/v3${endpoint}`, {
    headers: { Authorization: AUTH },
  })
  if (!res.ok) throw new Error(`Woo GET ${endpoint} failed: ${res.status}`)
  return res.json() as Promise<T>
}
