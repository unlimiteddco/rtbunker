'use server'

import { cookies } from 'next/headers'
import { revalidateTag } from 'next/cache'

import { getCurrentCustomer } from './auth'
import { sdk } from './medusa'
import { getRegion } from './region'

const CART_COOKIE = '_rtb_cart_id'

/**
 * Devuelve el id del customer logueado si lo hay (vía cookie de sesión).
 * Se usa para asociar el cart al customer al crearlo y evitar que Medusa
 * cree un guest customer duplicado al recibir el email en checkout.
 */
async function getLoggedInCustomerId(): Promise<string | null> {
  const customer = await getCurrentCustomer()
  return customer?.id ?? null
}

async function getCartId(): Promise<string | null> {
  const store = await cookies()
  return store.get(CART_COOKIE)?.value ?? null
}

async function setCartId(id: string): Promise<void> {
  const store = await cookies()
  store.set(CART_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
}

export async function getOrCreateCart(countryCode: string) {
  const id = await getCartId()
  const customerId = await getLoggedInCustomerId()

  if (id) {
    try {
      const { cart } = await sdk.store.cart.retrieve(id)
      if (cart) {
        // Si hay cart anónimo y ahora el user está logueado, transferimos.
        if (customerId && !cart.customer_id) {
          try {
            const c = await cookies()
            const cookieHeader = c.toString()
            await sdk.store.cart.transferCart(
              cart.id,
              {},
              { Cookie: cookieHeader } as Record<string, string>,
            )
          } catch {
            // si la SDK no expone transferCart en esta versión, lo hacemos
            // vía update reenviando la cookie de sesión
            const c = await cookies()
            const cookieHeader = c.toString()
            await sdk.store.cart.update(
              cart.id,
              {},
              {},
              { Cookie: cookieHeader } as Record<string, string>,
            )
          }
        }
        return cart
      }
    } catch {
      // cart caducado o borrado — caemos al create
    }
  }

  const region = await getRegion(countryCode)
  const c = await cookies()
  const cookieHeader = c.toString()

  // Pasamos cookieHeader para que Medusa asocie el cart al customer logueado
  // (cuando lo haya). Sin esto, el cart queda anónimo y al recibir email en
  // checkout Medusa crea un guest customer duplicado.
  const { cart } = await sdk.store.cart.create(
    {
      region_id: region.id,
      metadata: { locale: countryCode },
    },
    {},
    { Cookie: cookieHeader } as Record<string, string>,
  )
  await setCartId(cart.id)
  return cart
}

export async function getCart() {
  const id = await getCartId()
  if (!id) return null
  try {
    const { cart } = await sdk.store.cart.retrieve(id)
    return cart
  } catch {
    return null
  }
}

export async function addLineItem(input: {
  countryCode: string
  variantId: string
  quantity: number
}) {
  try {
    const cart = await getOrCreateCart(input.countryCode)
    const { cart: updated } = await sdk.store.cart.createLineItem(cart.id, {
      variant_id: input.variantId,
      quantity: input.quantity,
    })
    revalidateTag(`cart:${updated.id}`)
    return updated
  } catch (err) {
    // Carrito inusable (payment session obsoleta o ya completado): lo
    // descartamos y reintentamos en uno limpio.
    if (isRecoverableCartError(err)) {
      await resetCartCookie()
      const fresh = await getOrCreateCart(input.countryCode)
      const { cart: updated } = await sdk.store.cart.createLineItem(fresh.id, {
        variant_id: input.variantId,
        quantity: input.quantity,
      })
      revalidateTag(`cart:${updated.id}`)
      return updated
    }
    throw err
  }
}

/**
 * Errores de los que el carrito puede recuperarse descartándolo y creando uno
 * nuevo: payment session obsoleta (PaymentIntent de otra cuenta Stripe, live →
 * test, que Stripe rechaza al cancelar) o carrito ya completado (la cookie
 * apunta a un cart que ya se convirtió en pedido).
 */
function isRecoverableCartError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return /payment session|already completed|is completed/i.test(msg)
}

export type UpdateLineItemResult =
  | { ok: true; clearedCart?: false }
  | { ok: true; clearedCart: true }

export async function updateLineItem(input: {
  cartId: string
  itemId: string
  quantity: number
}): Promise<UpdateLineItemResult> {
  try {
    if (input.quantity <= 0) {
      await sdk.store.cart.deleteLineItem(input.cartId, input.itemId)
    } else {
      await sdk.store.cart.updateLineItem(input.cartId, input.itemId, {
        quantity: input.quantity,
      })
    }
    revalidateTag(`cart:${input.cartId}`)
    return { ok: true }
  } catch (err) {
    if (isRecoverableCartError(err)) {
      // Carrito bloqueado (payment session obsoleta o ya completado): lo
      // descartamos por completo para desbloquear al usuario.
      await resetCartCookie()
      revalidateTag(`cart:${input.cartId}`)
      return { ok: true, clearedCart: true }
    }
    throw err
  }
}

/**
 * Vacía el carrito por completo: intenta borrar línea por línea y, si el
 * backend lo bloquea (payment session obsoleta), descarta el cookie. Siempre
 * deja al usuario con un carrito vacío utilizable.
 */
export async function clearCart() {
  const id = await getCartId()
  if (!id) return
  try {
    const { cart } = await sdk.store.cart.retrieve(id)
    for (const item of cart?.items ?? []) {
      await sdk.store.cart.deleteLineItem(id, item.id)
    }
    revalidateTag(`cart:${id}`)
  } catch {
    // Si algo falla (payment session obsoleta, cart caducado…), descartamos
    // el cookie: la próxima request creará un carrito nuevo y limpio.
    await resetCartCookie()
  }
}

export async function setCartLocale(input: { cartId: string; locale: string }) {
  const { cart } = await sdk.store.cart.update(input.cartId, {
    metadata: { locale: input.locale },
  })
  revalidateTag(`cart:${input.cartId}`)
  return cart
}

/**
 * Borra el cookie del carrito. El cart de Medusa queda huérfano (lo
 * recolectará el GC del backend), pero el storefront creará uno nuevo
 * en la próxima request. Útil para desbloquear estados rotos: por
 * ejemplo si la `payment_session` apunta a un PaymentIntent de otra
 * cuenta Stripe (live → test).
 */
export async function resetCartCookie() {
  const store = await cookies()
  store.delete(CART_COOKIE)
}

export interface AddCustomOrderToCartInput {
  config: {
    shape: 'rect' | 'square' | 'circle' | 'custom'
    material: 'mate' | 'brillo' | 'holo' | 'refl'
    size_id?: 's' | 'm' | 'l' | 'xl' | null
    width_cm?: number | null
    height_cm?: number | null
  }
  units: number
  unit_price: number
  total_price: number
  /** Créditos de socio a canjear (0 = pago normal). */
  credits_used?: number
  design_file_url: string
  design_file_name: string
  customer_notes?: string | null
}

/**
 * Server action: añade un pedido personalizado al carrito llamando a
 * `/store/custom-orders/cart`. Si la API crea un cart nuevo, persistimos
 * el cookie aquí.
 */
export async function addCustomOrderToCart(input: AddCustomOrderToCartInput) {
  const customerId = await getLoggedInCustomerId()

  async function post(cartId: string | null) {
    return sdk.client.fetch<{ cart_id: string; line_item_id: string }>(
      '/store/custom-orders/cart',
      { method: 'POST', body: { ...input, cart_id: cartId, customer_id: customerId } },
    )
  }

  const existingCartId = await getCartId()
  let response: { cart_id: string; line_item_id: string }
  try {
    response = await post(existingCartId)
  } catch (err) {
    // El cart del cookie está completado o inusable: lo descartamos y
    // reintentamos sin cart_id (la API creará uno nuevo y limpio).
    if (existingCartId && isRecoverableCartError(err)) {
      await resetCartCookie()
      response = await post(null)
    } else {
      throw err
    }
  }

  // Si la API creó un cart nuevo, guardamos el id en el cookie.
  if (response.cart_id !== existingCartId) {
    await setCartId(response.cart_id)
  }

  revalidateTag(`cart:${response.cart_id}`)
  return response
}
