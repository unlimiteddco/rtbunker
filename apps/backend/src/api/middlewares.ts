import { defineMiddlewares } from '@medusajs/framework/http'

import { reviewAdminMiddlewares } from './admin/reviews/middlewares'
import { customOrderMiddlewares } from './admin/custom-orders/middlewares'
import { storeCustomOrderMiddlewares } from './store/custom-orders/middlewares'
import { newsletterMiddlewares } from './store/newsletter/middlewares'
import { storeReviewMiddlewares } from './store/reviews/middlewares'

export default defineMiddlewares({
  routes: [
    ...customOrderMiddlewares,
    ...storeCustomOrderMiddlewares,
    ...newsletterMiddlewares,
    ...storeReviewMiddlewares,
    ...reviewAdminMiddlewares,
    // Webhook de suscripciones Stripe: necesita el cuerpo crudo para verificar
    // la firma. `preserveRawBody` expone `req.rawBody`.
    {
      matcher: '/webhooks/stripe-subscriptions',
      method: 'POST',
      bodyParser: { preserveRawBody: true },
    },
  ],
})
