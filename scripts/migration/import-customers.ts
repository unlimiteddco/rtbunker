/**
 * Importa clientes (output/customers.json) vía la Admin API de Medusa.
 *
 * Notas:
 * - Crea el customer con email + dirección. La contraseña no se migra; los
 *   clientes deberán usar "olvidé mi contraseña" la primera vez (el reset
 *   se gestiona por el provider de auth `emailpass`).
 * - Es idempotente: si el email ya existe, lo salta.
 */
import 'dotenv/config'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import Medusa from '@medusajs/js-sdk'
import pLimit from 'p-limit'

import type { WooCustomer } from './types.ts'

const OUT_DIR = join(import.meta.dirname, 'output')
const CONCURRENCY = 5

const sdk = new Medusa({
  baseUrl: process.env.MEDUSA_BACKEND_URL!,
  auth: { type: 'session' },
})

async function ensureLogin() {
  await sdk.auth.login('user', 'emailpass', {
    email: process.env.MEDUSA_ADMIN_EMAIL!,
    password: process.env.MEDUSA_ADMIN_PASSWORD!,
  })
}

interface ImportReport {
  imported: { wpId: number; email: string; medusaId: string }[]
  skipped: { wpId: number; email: string; reason: string }[]
  failed: { wpId: number; email: string; error: string }[]
}

async function importOne(customer: WooCustomer, report: ImportReport): Promise<void> {
  if (!customer.email) {
    report.skipped.push({ wpId: customer.id, email: '', reason: 'sin email' })
    return
  }

  try {
    const { customers } = await sdk.admin.customer.list({ email: customer.email })
    if (customers.length > 0) {
      report.skipped.push({
        wpId: customer.id,
        email: customer.email,
        reason: 'ya existe en Medusa',
      })
      return
    }

    const { customer: created } = await sdk.admin.customer.create({
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.phone ?? customer.billing?.phone,
      addresses: customer.shipping?.address_1
        ? [
            {
              first_name: customer.first_name,
              last_name: customer.last_name,
              address_1: customer.shipping.address_1,
              address_2: customer.shipping.address_2,
              city: customer.shipping.city,
              postal_code: customer.shipping.postcode,
              country_code: (customer.shipping.country ?? 'ES').toLowerCase(),
              province: customer.shipping.state,
            },
          ]
        : [],
    })

    report.imported.push({ wpId: customer.id, email: customer.email, medusaId: created.id })
  } catch (err) {
    report.failed.push({
      wpId: customer.id,
      email: customer.email,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

async function main() {
  await ensureLogin()
  const customers = JSON.parse(
    await readFile(join(OUT_DIR, 'customers.json'), 'utf8'),
  ) as WooCustomer[]

  const report: ImportReport = { imported: [], skipped: [], failed: [] }
  const limit = pLimit(CONCURRENCY)

  let done = 0
  await Promise.all(
    customers.map((c) =>
      limit(async () => {
        await importOne(c, report)
        done += 1
        process.stdout.write(`  ${done}/${customers.length}\r`)
      }),
    ),
  )

  await writeFile(
    join(OUT_DIR, 'customers-import-report.json'),
    JSON.stringify(report, null, 2),
  )
  console.info(
    `\n✓ import: ${report.imported.length} creados, ${report.skipped.length} saltados, ${report.failed.length} fallidos`,
  )
}

main().catch((err) => {
  console.error('✗ import falló:', err)
  process.exit(1)
})
