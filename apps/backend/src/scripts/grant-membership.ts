import type { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

import { MEMBERSHIPS_MODULE } from '../modules/memberships'
import { getBackendTier, isTierId } from '../modules/memberships/tiers'

/**
 * Helper de DESARROLLO: activa (o cancela) una membresía del RT Bunker Club
 * para un cliente, sin pasar por Stripe. Sirve para probar la página de
 * cuenta y el descuento de socio al instante.
 *
 * Uso:
 *   npx medusa exec ./src/scripts/grant-membership.ts tu@email.com plata
 *   npx medusa exec ./src/scripts/grant-membership.ts tu@email.com cancel
 *
 * Para el alta real en producción se usa Stripe Checkout + webhook.
 */
export default async function grantMembership({ container, args }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const customerService = container.resolve(Modules.CUSTOMER)
  const membershipsService: any = container.resolve(MEMBERSHIPS_MODULE)

  const email = (args?.[0] ?? '').trim().toLowerCase()
  const tierArg = (args?.[1] ?? 'plata').trim().toLowerCase()
  if (!email) {
    logger.error('Falta el email. Uso: medusa exec ./src/scripts/grant-membership.ts email tier')
    return
  }

  const customers = await customerService.listCustomers({ email }, { take: 50 })
  if (customers.length === 0) {
    logger.error(`No existe ningún cliente con email ${email}. Regístrate primero en la web.`)
    return
  }

  const groups = await customerService.listCustomerGroups({}, { take: 1000 })
  const clubGroups = (groups as any[]).filter((g) => (g.metadata as any)?.membership_tier)

  const cancel = tierArg === 'cancel'
  if (!cancel && !isTierId(tierArg)) {
    logger.error(`Tier no válido: ${tierArg}. Usa bronce, plata, gold o cancel.`)
    return
  }
  const tier = cancel ? null : getBackendTier(tierArg)!
  const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  // Aplica a TODOS los clientes con ese email (Medusa puede tener duplicados
  // entre checkout invitado y cuenta registrada).
  for (const customer of customers as any[]) {
    const existing = await membershipsService.listMemberships(
      { customer_id: customer.id },
      { take: 1, order: { created_at: 'DESC' } },
    )

    if (cancel) {
      if (existing[0]) {
        await membershipsService.updateMemberships({ id: existing[0].id, status: 'canceled' })
      }
      await customerService.updateCustomers(customer.id, {
        metadata: { ...(customer.metadata ?? {}), membership_tier: null, membership_status: null },
      })
    } else {
      const data = {
        customer_id: customer.id,
        tier: tierArg,
        status: 'active' as const,
        current_period_end: periodEnd,
        cancel_at_period_end: false,
        credits_balance: tier!.credits,
        credits_renews_at: periodEnd,
      }
      if (existing[0]) {
        await membershipsService.updateMemberships({ id: existing[0].id, ...data })
      } else {
        await membershipsService.createMemberships(data)
      }
      await customerService.updateCustomers(customer.id, {
        metadata: {
          ...(customer.metadata ?? {}),
          membership_tier: tierArg,
          membership_status: 'active',
        },
      })
    }

    // Grupos
    for (const g of clubGroups) {
      const pair = { customer_id: customer.id, customer_group_id: g.id }
      try {
        if (!cancel && (g.metadata as any).membership_tier === tierArg) {
          await customerService.addCustomerToGroup(pair)
        } else {
          await customerService.removeCustomerFromGroup(pair)
        }
      } catch {
        /* idempotente */
      }
    }
  }

  if (cancel) {
    logger.info(`[grant] suscripción de ${email} CANCELADA (${customers.length} cuenta/s)`)
  } else {
    logger.info(
      `[grant] ✅ ${email} ahora es socio ${tier!.name} · ${tier!.credits} créditos · ${tier!.discountPct}% dto · renueva ${periodEnd.toLocaleDateString('es-ES')} (${customers.length} cuenta/s)`,
    )
  }
}
