import Medusa from '@medusajs/js-sdk'

/**
 * SDK cliente para los componentes admin custom (widgets / UI routes).
 * Usa sesión (cookie) porque corre dentro del dashboard admin autenticado.
 */
export const sdk = new Medusa({
  baseUrl: import.meta.env.VITE_BACKEND_URL || '/',
  debug: import.meta.env.DEV,
  auth: {
    type: 'session',
  },
})
