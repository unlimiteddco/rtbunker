'use server'

import { z } from 'zod'

import { env } from '@/../env'

/**
 * Suscripción a newsletter. Si `RESEND_AUDIENCE_ID` está configurado,
 * añade el contacto a la audiencia de Resend. Si no, sólo lo loguea para
 * que sea fácil empezar sin credenciales reales.
 */
const schema = z.object({
  email: z.string().email(),
})

export interface NewsletterResult {
  ok: boolean
  message?: string
}

export async function subscribeNewsletterAction(formData: FormData): Promise<NewsletterResult> {
  const parsed = schema.safeParse({ email: formData.get('email') })
  if (!parsed.success) {
    return { ok: false, message: 'Email inválido' }
  }

  const apiKey = process.env.RESEND_API_KEY
  const audienceId = process.env.RESEND_AUDIENCE_ID

  if (!apiKey || !audienceId) {
    console.info('[newsletter] suscripción simulada (configura RESEND_API_KEY y RESEND_AUDIENCE_ID):', parsed.data.email)
    // Validamos env del cliente para evitar warning de import no usado.
    void env.NEXT_PUBLIC_BASE_URL
    return { ok: true, message: 'Suscripción registrada' }
  }

  try {
    const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: parsed.data.email, unsubscribed: false }),
    })

    if (!res.ok && res.status !== 409) {
      const text = await res.text()
      return { ok: false, message: `Error de Resend: ${text}` }
    }
    return { ok: true, message: '¡Gracias por suscribirte!' }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Error' }
  }
}
