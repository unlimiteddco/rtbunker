import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { sendOrderPlacedEmailWorkflow } from '../workflows/emails/send-order-placed-email'

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await sendOrderPlacedEmailWorkflow(container).run({
    input: { order_id: data.id },
  })
}

export const config: SubscriberConfig = {
  event: 'order.placed',
}
