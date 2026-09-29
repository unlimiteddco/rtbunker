import { createWorkflow, WorkflowResponse } from '@medusajs/framework/workflows-sdk'

import {
  copyCartPaymentMethodStep,
  type CopyCartPaymentMethodInput,
} from './steps/copy-cart-payment-method'

/** Lleva `cart.metadata.payment_method` al pedido recién creado. */
export const copyCartPaymentMethodWorkflow = createWorkflow(
  'copy-cart-payment-method',
  function (input: CopyCartPaymentMethodInput) {
    const result = copyCartPaymentMethodStep(input)
    return new WorkflowResponse(result)
  },
)
