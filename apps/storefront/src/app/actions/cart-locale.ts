'use server'

import { cookies } from 'next/headers'

import { setCartLocale } from '@/lib/cart'

const CART_COOKIE = '_rtb_cart_id'

export async function setCartLocaleAction(locale: string) {
  const id = (await cookies()).get(CART_COOKIE)?.value
  if (!id) return
  try {
    await setCartLocale({ cartId: id, locale })
  } catch {
    // si el cart ya no existe, no rompemos el cambio de idioma
  }
}
