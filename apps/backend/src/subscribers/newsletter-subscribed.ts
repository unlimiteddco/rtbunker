import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { sendNewsletterWelcomeEmailWorkflow } from '../workflows/emails/send-newsletter-welcome-email'

/**
 * Cuando alguien se suscribe a la newsletter, le mandamos el cupón en un
 * email de bienvenida. Solo dispara si es la **primera vez** (is_new=true)
 * para no spammear con cupones extra cada vez que rellena el form.
 */
export default async function newsletterSubscribedHandler({
  event: { data },
  container,
}: SubscriberArgs<{
  id: string
  email: string
  coupon_code: string | null
  is_new: boolean
}>) {
  if (!data.is_new) return
  if (!data.coupon_code) return

  await sendNewsletterWelcomeEmailWorkflow(container).run({
    input: { email: data.email, coupon_code: data.coupon_code },
  })
}

export const config: SubscriberConfig = {
  event: 'newsletter.subscribed',
}
