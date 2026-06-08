import { NextResponse } from 'next/server'

import { resetCartCookie } from '@/lib/cart'

/**
 * GET /api/dev/reset-cart
 *
 * Borra el cookie `_rtb_cart_id` y redirige a /carrito. Solo activo en
 * desarrollo — protege contra carts huérfanos por cambios de cuenta
 * Stripe, payment_sessions en estado roto, etc.
 *
 * Para usarlo: abrir http://localhost:8000/api/dev/reset-cart en el
 * navegador. Te deja en /carrito vacío.
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Solo disponible en desarrollo' },
      { status: 403 },
    )
  }

  await resetCartCookie()

  const url = new URL('/carrito', request.url)
  return NextResponse.redirect(url)
}
