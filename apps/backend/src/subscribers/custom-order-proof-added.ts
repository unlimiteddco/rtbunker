import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { sendCustomOrderProofEmailWorkflow } from '../workflows/emails/send-custom-order-proof-email'

/**
 * Cuando se añade un mockup a un pedido custom, dispara el email al
 * cliente con la imagen + notas internas + CTA de aprobación (cuando la
 * página pública con magic_token esté online, si no se queda con CTA
 * directo al archivo).
 */
export default async function customOrderProofAddedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await sendCustomOrderProofEmailWorkflow(container).run({
    input: { custom_order_id: data.id },
  })
}

export const config: SubscriberConfig = {
  event: 'custom_order.proof_added',
}
