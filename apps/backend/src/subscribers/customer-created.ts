import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { sendCustomerCreatedEmailWorkflow } from '../workflows/emails/send-customer-created-email'

export default async function customerCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await sendCustomerCreatedEmailWorkflow(container).run({
    input: { customer_id: data.id },
  })
}

export const config: SubscriberConfig = {
  event: 'customer.created',
}
