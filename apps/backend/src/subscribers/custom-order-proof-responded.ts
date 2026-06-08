import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { sendCustomOrderResponseEmailWorkflow } from '../workflows/emails/send-custom-order-response-email'

/**
 * Cuando el cliente responde a un mockup (aprueba / pide cambios), avisa
 * al equipo por email con la decisión + notas y un link al admin.
 */
export default async function customOrderProofRespondedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; decision: 'approved' | 'changes_requested' }>) {
  await sendCustomOrderResponseEmailWorkflow(container).run({
    input: { custom_order_id: data.id },
  })
}

export const config: SubscriberConfig = {
  event: 'custom_order.proof_responded',
}
