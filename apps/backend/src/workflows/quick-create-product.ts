import { createProductsWorkflow } from '@medusajs/medusa/core-flows'
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from '@medusajs/framework/workflows-sdk'

import {
  prepareQuickProductStep,
  type QuickProductInput,
} from './steps/prepare-quick-product'

/**
 * Crea un producto listo para vender desde la página admin "Publicar
 * producto": prepara el input (handle único, variantes, precios EUR, canal de
 * venta por defecto…) y delega en el `createProductsWorkflow` nativo, que
 * gestiona precios, links con canal de venta, eventos y rollback.
 */
export const quickCreateProductWorkflow = createWorkflow(
  'quick-create-product',
  function (input: QuickProductInput) {
    const productInput = prepareQuickProductStep(input)

    const products = createProductsWorkflow.runAsStep({
      input: {
        products: transform({ productInput }, (data) => [data.productInput]),
      },
    })

    const product = transform({ products }, (data) => data.products[0])

    return new WorkflowResponse(product)
  },
)
