import { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { updateProductsWorkflow } from '@medusajs/medusa/core-flows'

/**
 * Activa el "texto personalizado" en uno o varios productos (idempotente).
 *
 * Pone en `product.metadata` (conservando el resto de claves):
 *   custom_text_enabled: true
 *   custom_text_label: "Tu usuario de Instagram"
 *   custom_text_placeholder: "@tuusuario"
 *   custom_text_max: 30
 *   custom_text_required: true
 *
 * Uso:
 *   npx medusa exec ./src/scripts/enable-custom-text.ts                 # pegatina-instagram
 *   npx medusa exec ./src/scripts/enable-custom-text.ts handle-1 handle-2
 *
 * Lo mismo se puede hacer a mano desde el admin: ficha del producto →
 * bloque "Texto personalizado" → Editar.
 */

const DEFAULT_HANDLES = ['pegatina-instagram']

const CUSTOM_TEXT_CONFIG = {
  custom_text_enabled: true,
  custom_text_label: 'Tu usuario de Instagram',
  custom_text_placeholder: '@tuusuario',
  custom_text_max: 30,
  custom_text_required: true,
} as const

export default async function enableCustomText({ container, args }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const handles = (args ?? []).map((a) => a.trim()).filter(Boolean)
  const targetHandles = handles.length > 0 ? handles : DEFAULT_HANDLES

  const { data: products } = await query.graph({
    entity: 'product',
    fields: ['id', 'handle', 'title', 'metadata'],
    filters: { handle: targetHandles },
  })

  const found = new Set(products.map((p) => p.handle))
  for (const handle of targetHandles) {
    if (!found.has(handle)) logger.warn(`— custom-text: no existe el producto "${handle}"`)
  }

  const toUpdate = products.filter((p) => {
    const m = (p.metadata ?? {}) as Record<string, unknown>
    return Object.entries(CUSTOM_TEXT_CONFIG).some(([k, v]) => m[k] !== v)
  })

  for (const p of products) {
    if (!toUpdate.includes(p)) logger.info(`— custom-text: "${p.handle}" ya estaba activado`)
  }

  if (toUpdate.length === 0) return

  await updateProductsWorkflow(container).run({
    input: {
      products: toUpdate.map((p) => ({
        id: p.id,
        metadata: {
          ...((p.metadata ?? {}) as Record<string, unknown>),
          ...CUSTOM_TEXT_CONFIG,
        },
      })),
    },
  })

  for (const p of toUpdate) {
    logger.info(`— custom-text: activado en "${p.handle}" (${p.title})`)
  }
}
