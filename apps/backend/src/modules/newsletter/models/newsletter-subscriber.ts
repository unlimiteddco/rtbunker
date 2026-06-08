import { model } from '@medusajs/framework/utils'

const NewsletterSubscriber = model.define('newsletter_subscriber', {
  id: model.id().primaryKey(),
  email: model.text(),
  consent_given: model.boolean().default(false),
  coupon_code: model.text().nullable(),
  source: model.text().nullable(),
  ip: model.text().nullable(),
})

export default NewsletterSubscriber
