import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { ContainerRegistrationKeys, MedusaError, Modules } from '@medusajs/framework/utils'
import {
  addToCartWorkflow,
  createCartWorkflow,
} from '@medusajs/medusa/core-flows'

import { MEMBERSHIPS_MODULE } from '../../../../modules/memberships'
import type { AddCustomOrderToCartSchema } from '../middlewares'

const BASE_PRODUCT_HANDLE = 'pegatina-personalizada'
const CREDIT_MAX_SIDE_CM = 10

/** ¿La config de tamaño es canjeable con créditos (≤10 cm)? */
function isCreditEligible(cfg: AddCustomOrderToCartSchema['config']): boolean {
  if (cfg.size_id === 's' || cfg.size_id === 'm') return true
  const w = cfg.width_cm ?? 0
  const h = cfg.height_cm ?? 0
  return w > 0 && h > 0 && w <= CREDIT_MAX_SIDE_CM && h <= CREDIT_MAX_SIDE_CM
}

/**
 * POST /store/custom-orders/cart
 *
 * Añade un pedido personalizado al carrito como line item del producto
 * esqueleto `pegatina-personalizada`, con:
 *   - quantity = units
 *   - unit_price = override del configurador (precio según forma×material×tamaño×tier)
 *   - metadata = { custom_request: true, config, design_file_url, design_file_name,
 *                   customer_notes, total_price }
 *
 * Si el body trae `cart_id`, se añade al carrito existente. Si no, crea uno
 * nuevo con la región España (EUR) + sales channel "Tienda Online".
 *
 * Después del checkout (Stripe) un subscriber `order.placed` detectará los
 * line items con `metadata.custom_request === true` y creará el CustomOrder
 * vinculado al order_id resultante.
 */
export async function POST(
  req: MedusaRequest<AddCustomOrderToCartSchema>,
  res: MedusaResponse,
) {
  const body = req.validatedBody
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const channelService: any = req.scope.resolve(Modules.SALES_CHANNEL)
  const regionService: any = req.scope.resolve(Modules.REGION)

  // ── Canje con créditos (RT Bunker Club) ─────────────────────────
  const creditsToUse = Math.max(0, Math.floor(body.credits_used ?? 0))
  let effectiveUnitPrice = body.unit_price
  let paidWithCredits = false

  if (creditsToUse > 0) {
    // 1 crédito = 1 unidad → deben coincidir.
    if (creditsToUse !== body.units) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Los créditos deben coincidir con las unidades.',
      )
    }
    if (!isCreditEligible(body.config)) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Este tamaño no es canjeable con créditos (solo ≤ ${CREDIT_MAX_SIDE_CM} cm).`,
      )
    }
    const customerId = (req as any).auth_context?.actor_id ?? body.customer_id
    if (!customerId) {
      throw new MedusaError(MedusaError.Types.UNAUTHORIZED, 'Inicia sesión para usar tus créditos.')
    }
    const membershipsService: any = req.scope.resolve(MEMBERSHIPS_MODULE)
    const [m] = await membershipsService.listMemberships(
      { customer_id: customerId },
      { take: 1, order: { created_at: 'DESC' } },
    )
    const active = m && (m.status === 'active' || m.status === 'past_due')
    if (!active || (m.credits_balance ?? 0) < creditsToUse) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        'No tienes créditos suficientes para este canje.',
      )
    }
    effectiveUnitPrice = 0
    paidWithCredits = true
  }

  // 1. Resuelve el variant_id del producto base
  const { data: products } = await query.graph({
    entity: 'product',
    fields: ['id', 'handle', 'variants.id'],
    filters: { handle: BASE_PRODUCT_HANDLE },
  })

  const baseProduct = products[0]
  const baseVariant = baseProduct?.variants?.[0]
  if (!baseVariant?.id) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Producto base "${BASE_PRODUCT_HANDLE}" no existe. Corre el seed.`,
    )
  }

  // 2. Asegura cart_id (crea uno si no llega)
  let cart_id = body.cart_id ?? null

  if (!cart_id) {
    // Región España (preferida); fallback al primero con EUR
    let regionId = body.region_id ?? null
    if (!regionId) {
      const [esRegion] = await regionService.listRegions({ name: 'España' })
      regionId = esRegion?.id
      if (!regionId) {
        const [anyEur] = await regionService.listRegions({ currency_code: 'eur' })
        regionId = anyEur?.id
      }
    }
    if (!regionId) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        'No hay una región EUR configurada. Corre el seed.',
      )
    }

    const [salesChannel] = await channelService.listSalesChannels({ name: 'Tienda Online' })
    if (!salesChannel) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        'Sales channel "Tienda Online" no existe.',
      )
    }

    const createInput: Record<string, unknown> = {
      region_id: regionId,
      sales_channel_id: salesChannel.id,
    }
    if (body.customer_id) {
      createInput.customer_id = body.customer_id
    }

    const { result: cart } = await createCartWorkflow(req.scope).run({
      input: createInput as any,
    })
    cart_id = cart.id
  }

  // 3. Añade el line item con price override + metadata
  const lineMetadata: Record<string, unknown> = {
    custom_request: true,
    config: body.config,
    design_file_url: body.design_file_url ?? null,
    design_file_name: body.design_file_name ?? null,
    customer_notes: body.customer_notes ?? null,
    total_price: paidWithCredits ? 0 : body.total_price,
    paid_with_credits: paidWithCredits,
    credits_used: paidWithCredits ? creditsToUse : 0,
  }

  const { result: updatedCart } = await addToCartWorkflow(req.scope).run({
    input: {
      cart_id,
      items: [
        {
          variant_id: baseVariant.id,
          quantity: body.units,
          unit_price: effectiveUnitPrice,
          metadata: lineMetadata,
        },
      ],
    },
  })

  // Encuentra el line_item recién añadido (último con custom_request en metadata)
  const items = (updatedCart as { items?: { id: string; metadata?: { custom_request?: boolean } }[] } | undefined)?.items ?? []
  const addedItem = items
    .slice()
    .reverse()
    .find((it) => it?.metadata?.custom_request === true)

  return res.status(201).json({
    cart_id,
    line_item_id: addedItem?.id ?? null,
  })
}
