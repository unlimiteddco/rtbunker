import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { createCustomOrdersFromOrderWorkflow } from '../workflows/create-custom-orders-from-order'

/**
 * Cuando se completa un pedido, escanea sus line items en busca de aquellos
 * con `metadata.custom_request === true` (añadidos vía
 * /store/custom-orders/cart) y crea un CustomOrder por cada uno. Lo deja
 * en `pending_review` esperando a Nikita.
 *
 * Es independiente del subscriber `order-placed.ts` que manda el email de
 * confirmación general — los dos corren en paralelo.
 */
export default async function orderPlacedCreateCustomOrderHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await createCustomOrdersFromOrderWorkflow(container).run({
    input: { order_id: data.id },
  })
}

export const config: SubscriberConfig = {
  event: 'order.placed',
}
