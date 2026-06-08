import type { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { createPromotionsWorkflow } from '@medusajs/medusa/core-flows'

import { TIERS } from '../modules/memberships/tiers'

/**
 * Configura el descuento de socio del RT Bunker Club (Fase 1c):
 *   - 1 customer group por tier (metadata.membership_tier = bronce|plata|gold)
 *   - 1 promoción automática por tier (5%/10%/10% sobre el total del pedido)
 *     con regla `customer.groups.id IN [groupId]`.
 *
 * El webhook de suscripciones añade/quita al cliente del grupo según el estado
 * de su suscripción, y la promoción se aplica sola en el checkout.
 *
 * Idempotente: si el grupo o la promoción ya existen, no los duplica.
 *
 * Uso: `npx medusa exec ./src/scripts/setup-memberships.ts`
 */
export default async function setupMemberships({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const customerService = container.resolve(Modules.CUSTOMER)
  const promotionService = container.resolve(Modules.PROMOTION)

  const existingGroups = await customerService.listCustomerGroups({}, { take: 1000 })
  const groupIds: string[] = []

  for (const tier of Object.values(TIERS)) {
    const groupName = `RT Bunker Club · ${tier.id.charAt(0).toUpperCase()}${tier.id.slice(1)}`

    // 1. Customer group (busca por metadata.membership_tier, crea si falta)
    let group = (existingGroups as any[]).find(
      (g) => (g.metadata as any)?.membership_tier === tier.id,
    )
    if (!group) {
      const [created] = await customerService.createCustomerGroups([
        { name: groupName, metadata: { membership_tier: tier.id } },
      ])
      group = created
      logger.info(`[memberships] grupo creado: ${groupName} (${group.id})`)
    } else {
      logger.info(`[memberships] grupo ya existe: ${groupName} (${group.id})`)
    }
    groupIds.push(group.id)

    // 2. Promoción automática de descuento (busca por code, crea si falta)
    const code = `RTBCLUB_${tier.id.toUpperCase()}`
    const found = await promotionService.listPromotions({ code }, { take: 1 })
    if (found.length > 0) {
      logger.info(`[memberships] promoción ya existe: ${code}`)
      continue
    }

    await createPromotionsWorkflow(container).run({
      input: {
        promotionsData: [
          {
            code,
            type: 'standard',
            status: 'active',
            is_automatic: true,
            application_method: {
              type: 'percentage',
              target_type: 'order',
              allocation: 'across',
              value: tier.discountPct,
            },
            rules: [
              {
                attribute: 'customer.groups.id',
                operator: 'in',
                values: [group.id],
              },
            ],
          },
        ],
      } as any,
    })
    logger.info(`[memberships] promoción creada: ${code} (${tier.discountPct}% → grupo ${group.id})`)
  }

  // 3. Envío urgente gratis para socios: promoción automática 100% sobre el
  //    envío, dirigida a todos los customer groups del Club.
  const shipCode = 'RTBCLUB_FREESHIP'
  const shipFound = await promotionService.listPromotions({ code: shipCode }, { take: 1 })
  if (shipFound.length > 0) {
    logger.info(`[memberships] promoción ya existe: ${shipCode}`)
  } else if (groupIds.length > 0) {
    await createPromotionsWorkflow(container).run({
      input: {
        promotionsData: [
          {
            code: shipCode,
            type: 'standard',
            status: 'active',
            is_automatic: true,
            application_method: {
              type: 'percentage',
              target_type: 'shipping_methods',
              allocation: 'across',
              value: 100,
            },
            rules: [{ attribute: 'customer.groups.id', operator: 'in', values: groupIds }],
          },
        ],
      } as any,
    })
    logger.info(`[memberships] promoción creada: ${shipCode} (envío gratis → ${groupIds.length} grupos)`)
  }

  logger.info('[memberships] setup de descuentos de socio completado ✅')
}
