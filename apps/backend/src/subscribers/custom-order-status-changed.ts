import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { sendCustomOrderStatusEmailWorkflow } from '../workflows/emails/send-custom-order-status-email'

/**
 * Cuando cambia el status de un pedido custom, dispara el email al cliente
 * con la plantilla correspondiente. Solo notifica si el status final es uno
 * relevante (in_production / shipped / delivered) y si realmente cambió.
 */
export default async function customOrderStatusChangedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; from: string; to: string }>) {
  if (data.from === data.to) return

  await sendCustomOrderStatusEmailWorkflow(container).run({
    input: { custom_order_id: data.id, status: data.to },
  })
}

export const config: SubscriberConfig = {
  event: 'custom_order.status_changed',
}
