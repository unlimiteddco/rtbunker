/**
 * Actualiza las URLs de imagen / thumbnail de TODOS los productos importados
 * sustituyendo URLs de WordPress por sus equivalentes en Cloudflare R2.
 *
 * Lee `output/media-mapping.json` (generado por upload-media.ts) y para cada
 * producto:
 *   1) Busca el producto por handle vía Admin API.
 *   2) Sustituye `thumbnail` y cada `images[*].url` que coincida con una
 *      URL de origen del mapping.
 *   3) Lanza un PATCH /admin/products/:id con los nuevos valores.
 *
 * Idempotente: si una URL ya está en R2, no se reescribe.
 * Skip:        si un producto no encuentra match en el mapping, queda igual.
 */
import 'dotenv/config'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import pLimit from 'p-limit'

import type { MediaMapping } from './types.ts'

const OUT_DIR = join(import.meta.dirname, 'output')
const BASE = process.env.MEDUSA_BACKEND_URL ?? 'http://localhost:9000'
const CONCURRENCY = 3

let TOKEN = ''

interface ProductImage {
  id: string
  url: string
}
interface Product {
  id: string
  handle: string
  thumbnail: string | null
  images: ProductImage[]
}

async function login() {
  const res = await fetch(`${BASE}/auth/user/emailpass`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: process.env.MEDUSA_ADMIN_EMAIL,
      password: process.env.MEDUSA_ADMIN_PASSWORD,
    }),
  })
  if (!res.ok) throw new Error(`login failed: ${res.status}`)
  TOKEN = (await res.json()).token
}

async function adminFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${init.method ?? 'GET'} ${path} ${res.status}: ${body.slice(0, 220)}`)
  }
  if (res.status === 204) return {} as T
  return res.json() as Promise<T>
}

interface Report {
  updated: { handle: string; replaced: number }[]
  skipped: { handle: string; reason: string }[]
  failed: { handle: string; error: string }[]
}

async function listAllProducts(): Promise<Product[]> {
  const all: Product[] = []
  let offset = 0
  const limit = 50
  while (true) {
    const data = await adminFetch<{ products: Product[]; count: number }>(
      `/admin/products?limit=${limit}&offset=${offset}&fields=id,handle,thumbnail,images.id,images.url`,
    )
    all.push(...data.products)
    if (data.products.length < limit || offset + limit >= data.count) break
    offset += limit
  }
  return all
}

async function main() {
  await login()
  console.info('— login OK')

  const mapping = JSON.parse(
    await readFile(join(OUT_DIR, 'media-mapping.json'), 'utf8'),
  ) as MediaMapping[]
  const map = new Map(mapping.map((m) => [m.source, m.destination]))
  console.info(`— ${map.size} URLs en el mapping`)

  const products = await listAllProducts()
  console.info(`— ${products.length} productos a revisar`)

  const report: Report = { updated: [], skipped: [], failed: [] }
  const limit = pLimit(CONCURRENCY)
  let done = 0

  await Promise.all(
    products.map((p) =>
      limit(async () => {
        try {
          const oldImages = p.images ?? []
          const newImages = oldImages.map((img) => ({
            ...img,
            url: map.get(img.url) ?? img.url,
          }))
          const newThumbnail = p.thumbnail
            ? (map.get(p.thumbnail) ?? p.thumbnail)
            : p.thumbnail

          let changed = 0
          if (newThumbnail !== p.thumbnail) changed++
          for (let i = 0; i < newImages.length; i++) {
            if (newImages[i].url !== oldImages[i]?.url) changed++
          }

          if (changed === 0) {
            report.skipped.push({ handle: p.handle, reason: 'sin cambios' })
            return
          }

          // El endpoint admin PATCH /admin/products/:id acepta { thumbnail,
          // images: [{ url }] }. Nota: enviar `images` reemplaza el array.
          await adminFetch(`/admin/products/${p.id}`, {
            method: 'POST',
            body: JSON.stringify({
              thumbnail: newThumbnail,
              images: newImages.map((i) => ({ url: i.url })),
            }),
          })
          report.updated.push({ handle: p.handle, replaced: changed })
        } catch (err) {
          report.failed.push({
            handle: p.handle,
            error: err instanceof Error ? err.message : String(err),
          })
        } finally {
          done += 1
          process.stdout.write(`  ${done}/${products.length}\r`)
        }
      }),
    ),
  )

  await writeFile(
    join(OUT_DIR, 'update-images-report.json'),
    JSON.stringify(report, null, 2),
  )
  console.info(
    `\n✓ ${report.updated.length} actualizados · ${report.skipped.length} sin cambios · ${report.failed.length} fallidos`,
  )
  if (report.failed.length > 0) {
    console.warn('Primeros 3 fallos:')
    for (const f of report.failed.slice(0, 3)) console.warn(`  · ${f.handle}: ${f.error}`)
  }
}

main().catch((err) => {
  console.error('✗ update-product-images falló:', err)
  process.exit(1)
})
