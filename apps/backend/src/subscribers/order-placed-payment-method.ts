import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { copyCartPaymentMethodWorkflow } from '../workflows/copy-cart-payment-method'

/**
 * Al crearse un pedido, copia `cart.metadata.payment_method` (p.ej.
 * `bank_transfer`) a la metadata del pedido. Así Nikita lo ve en el admin
 * (sección Metadata del pedido) y el storefront lo distingue de un pedido
 * gratis, que usa el mismo proveedor manual `pp_system_default`.
 */
export default async function orderPlacedPaymentMethodHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await copyCartPaymentMethodWorkflow(container).run({
    input: { order_id: data.id },
  })
}

export const config: SubscriberConfig = {
  event: 'order.placed',
}
