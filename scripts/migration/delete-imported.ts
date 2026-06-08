/**
 * Borra todos los productos que importamos previamente, leyendo los IDs
 * de `output/import-report.json` (los 2 productos originales de prueba
 * no están ahí, así que quedan intactos).
 *
 * Útil cuando hay que re-importar tras un cambio en el script.
 */
import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import pLimit from 'p-limit'

const OUT_DIR = join(import.meta.dirname, 'output')
const BASE = process.env.MEDUSA_BACKEND_URL ?? 'http://localhost:9000'
const CONCURRENCY = 5

let TOKEN = ''

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

async function deleteProduct(id: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${BASE}/admin/products/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${TOKEN}` },
  })
  if (!res.ok && res.status !== 404) {
    return { ok: false, error: `${res.status}: ${await res.text()}` }
  }
  return { ok: true }
}

async function main() {
  await login()
  console.info('— login OK')

  const report = JSON.parse(
    await readFile(join(OUT_DIR, 'import-report.json'), 'utf8'),
  ) as { imported: { medusaId: string; slug: string }[] }

  const ids = report.imported.map((r) => r.medusaId)
  console.info(`— borrando ${ids.length} productos`)

  let ok = 0
  let ko = 0
  const limit = pLimit(CONCURRENCY)
  await Promise.all(
    ids.map((id) =>
      limit(async () => {
        const r = await deleteProduct(id)
        if (r.ok) ok += 1
        else {
          ko += 1
          if (ko < 5) console.warn(`  ${id}: ${r.error}`)
        }
        process.stdout.write(`  ${ok + ko}/${ids.length}\r`)
      }),
    ),
  )
  console.info(`\n✓ borrados: ${ok} · errores: ${ko}`)
}

main().catch((err) => {
  console.error('✗ delete falló:', err)
  process.exit(1)
})
