import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys, MedusaError } from '@medusajs/framework/utils'

import {
  buildPriceTable,
  PRICE_TABLE_PRODUCT_FIELDS,
  type PriceTableProduct,
} from '../../../../lib/price-table'
import { hashSignature } from '../signatures'

/**
 * GET /admin/price-tables/:id
 * Tabla de precios de un producto: filas (tamaños) × grupos de color con el
 * mismo precio. Es lo que pinta y edita la página "Precios por tamaño".
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: 'product',
    fields: PRICE_TABLE_PRODUCT_FIELDS,
    filters: { id: req.params.id },
  })
  const product = data[0] as unknown as PriceTableProduct | undefined
  if (!product) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Producto no encontrado')
  }

  const { signature, ...table } = buildPriceTable(product)

  return res.json({
    product: {
      id: product.id,
      title: product.title,
      handle: product.handle ?? null,
      thumbnail: product.thumbnail ?? null,
    },
    table: { ...table, signature: hashSignature(signature) },
  })
}
