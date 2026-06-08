/**
 * Descarga las imágenes de Woo y las sube a R2 manteniendo el mapping
 * (URL original → URL nueva). El mapping se guarda en
 * `output/media-mapping.json` y es leído por `transform-products.ts`.
 *
 * Idempotente: si una clave ya existe en R2, no la re-sube.
 */
import 'dotenv/config'
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join, basename } from 'node:path'

import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import pLimit from 'p-limit'

import type { MediaMapping, WooProduct, WooVariation } from './types.ts'

const OUT_DIR = join(import.meta.dirname, 'output')
const CONCURRENCY = 8

const s3 = new S3Client({
  region: process.env.R2_REGION ?? 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
})
const BUCKET = process.env.R2_BUCKET!
const PUBLIC_BASE = process.env.R2_PUBLIC_URL!.replace(/\/$/, '')

function keyFor(sourceUrl: string): string {
  const hash = createHash('sha1').update(sourceUrl).digest('hex').slice(0, 10)
  const ext = extname(new URL(sourceUrl).pathname).toLowerCase() || '.jpg'
  const name = basename(new URL(sourceUrl).pathname, ext).replace(/[^a-z0-9-_]/gi, '-')
  return `products/${hash}-${name}${ext}`
}

async function existsInR2(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
    return true
  } catch {
    return false
  }
}

async function uploadOne(sourceUrl: string): Promise<MediaMapping | null> {
  if (!sourceUrl) return null
  const key = keyFor(sourceUrl)
  const destination = `${PUBLIC_BASE}/${key}`

  if (await existsInR2(key)) return { source: sourceUrl, destination }

  const res = await fetch(sourceUrl)
  if (!res.ok) {
    console.warn(`  ✗ ${sourceUrl} → ${res.status}`)
    return null
  }
  const body = Buffer.from(await res.arrayBuffer())
  const contentType = res.headers.get('content-type') ?? 'application/octet-stream'

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  )
  return { source: sourceUrl, destination }
}

async function main() {
  const products = JSON.parse(
    await readFile(join(OUT_DIR, 'products.json'), 'utf8'),
  ) as WooProduct[]
  const variations = JSON.parse(
    await readFile(join(OUT_DIR, 'variations.json'), 'utf8'),
  ) as Record<number, WooVariation[]>

  const allUrls = new Set<string>()
  for (const p of products) {
    for (const img of p.images ?? []) allUrls.add(img.src)
  }
  for (const vars of Object.values(variations)) {
    for (const v of vars) {
      if (v.image?.src) allUrls.add(v.image.src)
    }
  }

  console.info(`▼ ${allUrls.size} imágenes únicas a procesar`)
  const limit = pLimit(CONCURRENCY)
  const mapping: MediaMapping[] = []
  let done = 0

  await Promise.all(
    [...allUrls].map((url) =>
      limit(async () => {
        const m = await uploadOne(url)
        if (m) mapping.push(m)
        done += 1
        process.stdout.write(`  ${done}/${allUrls.size}\r`)
      }),
    ),
  )

  await writeFile(join(OUT_DIR, 'media-mapping.json'), JSON.stringify(mapping, null, 2))
  console.info(`\n✓ ${mapping.length} imágenes en R2 → output/media-mapping.json`)
}

main().catch((err) => {
  console.error('✗ upload-media falló:', err)
  process.exit(1)
})
