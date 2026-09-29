import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'

import { getBankTransferDetails } from '../../../lib/bank-transfer'

/**
 * GET /store/bank-transfer
 * Datos públicos para el pago por transferencia bancaria (titular, IBAN,
 * banco, BIC). `enabled` = hay IBAN configurado en el backend. El storefront
 * solo ofrece "Transferencia bancaria" si `enabled` y la región tiene el
 * proveedor `pp_system_default`.
 */
export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.json(getBankTransferDetails())
}
