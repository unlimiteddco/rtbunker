import { defineMiddlewares } from '@medusajs/framework/http'

/**
 * El endpoint /store/search es público y solo lee de Meilisearch.
 * No necesita autenticación, pero sí pasa por los CORS de store.
 */
export default defineMiddlewares({
  routes: [
    {
      matcher: '/store/search',
      method: ['GET'],
      middlewares: [],
    },
  ],
})
