import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { sendOrderShippedEmailWorkflow } from '../workflows/emails/send-order-shipped-email'

export default async function orderShippedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ order_id: string; id: string }>) {
  await sendOrderShippedEmailWorkflow(container).run({
    input: { order_id: data.order_id, fulfillment_id: data.id },
  })
}

export const config: SubscriberConfig = {
  // Medusa emite `shipment.created` cuando una fulfillment se marca como enviada.
  event: 'shipment.created',
}
