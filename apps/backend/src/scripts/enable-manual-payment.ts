import { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { updateRegionsWorkflow } from '@medusajs/medusa/core-flows'

/**
 * Habilita el proveedor de pago manual de Medusa (`pp_system_default`) en
 * TODAS las regiones. Se usa para el pago por transferencia bancaria (y para
 * los pedidos a 0 €): autoriza sin cobrar y el equipo marca el pago como
 * capturado en el admin cuando llega la transferencia.
 *
 * Idempotente: si la región ya lo tiene, no hace nada. Conserva los
 * proveedores que la región ya tuviera (Stripe, PayPal…), porque
 * `updateRegionsWorkflow` REEMPLAZA la lista completa de `payment_providers`.
 *
 * Se ejecuta automáticamente al arrancar el backend en producción (ver
 * apps/backend/Dockerfile). Manual: `npx medusa exec ./src/scripts/enable-manual-payment.ts`
 */
const MANUAL_PROVIDER_ID = 'pp_system_default'

type RegionRow = {
  id: string
  name: string
  payment_providers?: Array<{ id: string; is_enabled?: boolean | null } | null> | null
}

export default async function enableManualPayment({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  // Proveedores habilitados en el módulo de pago. El workflow valida que todos
  // los IDs existan y estén habilitados, así que solo conservamos esos.
  const { data: providers } = await query.graph({
    entity: 'payment_provider',
    fields: ['id', 'is_enabled'],
  })
  const enabledIds = new Set(
    (providers as Array<{ id: string; is_enabled?: boolean | null }>)
      .filter((p) => p.is_enabled !== false)
      .map((p) => p.id),
  )

  if (!enabledIds.has(MANUAL_PROVIDER_ID)) {
    logger.warn(`[enable-manual-payment] ${MANUAL_PROVIDER_ID} no está registrado/habilitado; nada que hacer.`)
    return
  }

  const { data: regions } = await query.graph({
    entity: 'region',
    fields: ['id', 'name', 'payment_providers.id', 'payment_providers.is_enabled'],
  })

  let updated = 0
  for (const region of regions as RegionRow[]) {
    const current = (region.payment_providers ?? [])
      .filter((p): p is { id: string; is_enabled?: boolean | null } => Boolean(p?.id))
      .map((p) => p.id)

    if (current.includes(MANUAL_PROVIDER_ID)) {
      logger.info(`[enable-manual-payment] "${region.name}" ya tiene ${MANUAL_PROVIDER_ID}.`)
      continue
    }

    const dropped = current.filter((id) => !enabledIds.has(id))
    if (dropped.length) {
      logger.warn(
        `[enable-manual-payment] "${region.name}": proveedores no habilitados que no se pueden conservar: ${dropped.join(', ')}`,
      )
    }

    const next = Array.from(
      new Set([...current.filter((id) => enabledIds.has(id)), MANUAL_PROVIDER_ID]),
    )

    await updateRegionsWorkflow(container).run({
      input: {
        selector: { id: region.id },
        update: { payment_providers: next },
      },
    })
    updated++
    logger.info(`[enable-manual-payment] "${region.name}" → ${next.join(', ')}`)
  }

  logger.info(
    `[enable-manual-payment] Listo: ${updated} región(es) actualizadas de ${regions.length}.`,
  )
}
