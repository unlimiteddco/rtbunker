import { defineMiddlewares } from '@medusajs/framework/http'

import { reviewAdminMiddlewares } from './admin/reviews/middlewares'
import { customOrderMiddlewares } from './admin/custom-orders/middlewares'
import { portfolioAdminMiddlewares } from './admin/portfolio/middlewares'
import { serviceItemAdminMiddlewares } from './admin/service-items/middlewares'
import { processStepAdminMiddlewares } from './admin/process-steps/middlewares'
import { featuredCategoryAdminMiddlewares } from './admin/featured-categories/middlewares'
import { storeCustomOrderMiddlewares } from './store/custom-orders/middlewares'
import { newsletterMiddlewares } from './store/newsletter/middlewares'
import { storePortfolioMiddlewares } from './store/portfolio/middlewares'
import { storeReviewMiddlewares } from './store/reviews/middlewares'
import { storeServiceItemMiddlewares } from './store/service-items/middlewares'
import { storeProcessStepMiddlewares } from './store/process-steps/middlewares'
import { storeFeaturedCategoryMiddlewares } from './store/featured-categories/middlewares'

export default defineMiddlewares({
  routes: [
    ...customOrderMiddlewares,
    ...storeCustomOrderMiddlewares,
    ...newsletterMiddlewares,
    ...storeReviewMiddlewares,
    ...reviewAdminMiddlewares,
    ...portfolioAdminMiddlewares,
    ...storePortfolioMiddlewares,
    // Contenido web editable (módulo siteContent): servicios, proceso y
    // categorías destacadas de la home.
    ...serviceItemAdminMiddlewares,
    ...processStepAdminMiddlewares,
    ...featuredCategoryAdminMiddlewares,
    ...storeServiceItemMiddlewares,
    ...storeProcessStepMiddlewares,
    ...storeFeaturedCategoryMiddlewares,
    // Webhook de suscripciones Stripe: necesita el cuerpo crudo para verificar
    // la firma. `preserveRawBody` expone `req.rawBody`.
    {
      matcher: '/webhooks/stripe-subscriptions',
      method: 'POST',
      bodyParser: { preserveRawBody: true },
    },
  ],
})
