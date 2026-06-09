import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { sendOrderDeliveredEmailWorkflow } from '../workflows/emails/send-order-delivered-email'

export default async function orderDeliveredHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await sendOrderDeliveredEmailWorkflow(container)
    .run({ input: { fulfillment_id: data.id } })
    .catch((err) => {
      console.error('[delivery.created] Falló el email de entrega:', err)
    })
}

export const config: SubscriberConfig = {
  // Medusa emite `delivery.created` cuando una fulfillment se marca como entregada.
  // El payload solo contiene el id de la fulfillment.
  event: 'delivery.created',
}
