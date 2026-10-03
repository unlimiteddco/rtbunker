import { updateProductVariantsWorkflow } from '@medusajs/medusa/core-flows'
import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from '@medusajs/framework/workflows-sdk'

import {
  preparePriceTableUpdateStep,
  type UpdatePriceTableInput,
} from './steps/prepare-price-table-update'

/**
 * Cambia precios "por tamaño" en uno o varios productos desde la página admin
 * "Precios por tamaño": calcula qué variantes cambian y delega el guardado en
 * el `updateProductVariantsWorkflow` nativo (precios, eventos y rollback).
 */
export const updatePriceTableWorkflow = createWorkflow(
  'update-price-table',
  function (input: UpdatePriceTableInput) {
    const prepared = preparePriceTableUpdateStep(input)

    when({ prepared }, (data) => data.prepared.product_variants.length > 0).then(function () {
      updateProductVariantsWorkflow.runAsStep({
        input: {
          product_variants: transform({ prepared }, (data) => data.prepared.product_variants),
        },
      })
    })

    const summary = transform({ prepared }, (data) => ({
      updated_variants: data.prepared.product_variants.length,
      products: data.prepared.per_product,
    }))

    return new WorkflowResponse(summary)
  },
)
