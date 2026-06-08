'use server'

import { revalidatePath } from 'next/cache'

import { addLineItem, clearCart, getCart, updateLineItem } from '@/lib/cart'

export interface AddToCartResult {
  ok: boolean
  message?: string
  cart?: {
    id: string
    item_count: number
    subtotal: number
    currency_code: string
  }
}

/** Server action invocada desde el cliente — devuelve estado para el drawer/toast. */
export async function addToCartAction(input: {
  variantId: string
  quantity: number
  countryCode: string
}): Promise<AddToCartResult> {
  if (!input.variantId) return { ok: false, message: 'Selecciona una variante' }

  try {
    const cart = await addLineItem({
      variantId: input.variantId,
      quantity: input.quantity,
      countryCode: input.countryCode,
    })
    revalidatePath(`/${input.countryCode}`, 'layout')
    const itemCount = (cart.items ?? []).reduce((sum, i) => sum + i.quantity, 0)
    return {
      ok: true,
      cart: {
        id: cart.id,
        item_count: itemCount,
        subtotal: cart.subtotal ?? 0,
        currency_code: cart.currency_code ?? 'eur',
      },
    }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Error añadiendo al carrito' }
  }
}

/** Server action de form (carrito), mantiene compatibilidad con la UI vieja. */
export async function updateLineItemAction(formData: FormData) {
  const cartId = String(formData.get('cart_id') ?? '')
  const itemId = String(formData.get('item_id') ?? '')
  const quantity = Number(formData.get('quantity') ?? 1)
  const countryCode = String(formData.get('country_code') ?? 'es')

  await updateLineItem({ cartId, itemId, quantity })
  revalidatePath(`/${countryCode}/carrito`)
}

/** Vacía el carrito por completo. Resiliente a payment sessions obsoletas. */
export async function clearCartAction(countryCode = 'es') {
  await clearCart()
  revalidatePath(`/${countryCode}/carrito`)
  revalidatePath(`/${countryCode}`, 'layout')
}

/** Lectura del carrito para el drawer (server). */
export async function getCartSnapshot() {
  const cart = await getCart()
  if (!cart) return null
  return {
    id: cart.id,
    items: (cart.items ?? []).map((i) => ({
      id: i.id,
      product_title: i.product_title ?? '',
      variant_title: i.variant_title ?? '',
      thumbnail: i.thumbnail ?? null,
      quantity: i.quantity,
      unit_price: i.unit_price ?? 0,
      total: (i.unit_price ?? 0) * i.quantity,
      metadata: (i.metadata ?? null) as Record<string, unknown> | null,
    })),
    subtotal: cart.subtotal ?? 0,
    discount_total: cart.discount_total ?? 0,
    total: cart.total ?? 0,
    currency_code: cart.currency_code ?? 'eur',
  }
}
