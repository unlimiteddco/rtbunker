'use server'

import { z } from 'zod'

/**
 * Formulario de contacto. Si `RESEND_API_KEY` está configurado, envía un
 * email al buzón de RT Bunker (`CONTACT_TO`, por defecto info@rtbunker.com)
 * con `reply_to` apuntando al cliente. Si no hay credenciales, lo loguea y
 * devuelve OK para poder desarrollar sin configurar Resend (mismo patrón que
 * `subscribeNewsletterAction`).
 */
const schema = z.object({
  name: z.string().trim().min(2, 'Indica tu nombre').max(120),
  email: z.string().trim().email('Email inválido'),
  subject: z.string().trim().max(160).optional(),
  message: z.string().trim().min(10, 'Cuéntanos un poco más (mín. 10 caracteres)').max(4000),
  // Adjunto opcional: el storefront sube el binario al backend y nos pasa
  // sólo la URL + nombre. Resend descarga el fichero por `path` remoto.
  attachment_url: z.string().url().optional(),
  attachment_name: z.string().max(200).optional(),
  // Honeypot anti-spam: debe llegar vacío.
  company: z.string().optional(),
})

export interface ContactResult {
  ok: boolean
  message?: string
  errors?: Partial<Record<'name' | 'email' | 'subject' | 'message', string>>
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function sendContactAction(formData: FormData): Promise<ContactResult> {
  // FormData devuelve '' para campos vacíos; lo normalizamos a undefined para
  // que los validadores `.optional()` (p. ej. `url()`) no fallen.
  const opt = (key: string): string | undefined => {
    const v = formData.get(key)
    return typeof v === 'string' && v.trim() !== '' ? v : undefined
  }

  const parsed = schema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    subject: formData.get('subject'),
    message: formData.get('message'),
    attachment_url: opt('attachment_url'),
    attachment_name: opt('attachment_name'),
    company: formData.get('company'),
  })

  if (!parsed.success) {
    const errors: ContactResult['errors'] = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (key === 'name' || key === 'email' || key === 'subject' || key === 'message') {
        errors[key] = issue.message
      }
    }
    return { ok: false, message: 'Revisa los campos del formulario', errors }
  }

  // Honeypot: si viene relleno, fingimos éxito y descartamos.
  if (parsed.data.company && parsed.data.company.trim() !== '') {
    return { ok: true, message: '¡Gracias! Te responderemos pronto.' }
  }

  const { name, email, subject, message, attachment_url, attachment_name } = parsed.data
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.CONTACT_TO ?? 'info@rtbunker.com'
  const from = process.env.CONTACT_FROM ?? 'RT Bunker <info@rtbunker.com>'
  const finalSubject = subject?.trim() ? `Contacto · ${subject.trim()}` : `Nuevo mensaje de contacto · ${name}`

  if (!apiKey) {
    console.info('[contact] envío simulado (configura RESEND_API_KEY):', {
      to,
      from: email,
      name,
      subject: finalSubject,
      attachment: attachment_url ?? null,
    })
    return { ok: true, message: '¡Gracias! Te responderemos pronto.' }
  }

  const attachmentName = attachment_name?.trim() || 'archivo adjunto'
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1a1a1a;line-height:1.6">
      <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      ${subject?.trim() ? `<p><strong>Asunto:</strong> ${escapeHtml(subject.trim())}</p>` : ''}
      <p><strong>Mensaje:</strong></p>
      <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
      ${
        attachment_url
          ? `<p><strong>Archivo adjunto:</strong> <a href="${escapeHtml(attachment_url)}">${escapeHtml(attachmentName)}</a></p>`
          : ''
      }
    </div>
  `

  const payload: {
    from: string
    to: string[]
    reply_to: string
    subject: string
    html: string
    attachments?: { path: string; filename: string }[]
  } = {
    from,
    to: [to],
    reply_to: email,
    subject: finalSubject,
    html,
  }
  if (attachment_url) {
    // Resend descarga el adjunto desde la URL remota (`path`).
    payload.attachments = [{ path: attachment_url, filename: attachmentName }]
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[contact] Resend error:', text)
      return {
        ok: false,
        message: `No se pudo enviar el mensaje. Inténtalo de nuevo o escríbenos a ${to}.`,
      }
    }
    return { ok: true, message: '¡Gracias! Hemos recibido tu mensaje y te responderemos pronto.' }
  } catch (err) {
    console.error('[contact] error:', err)
    return { ok: false, message: `No se pudo enviar el mensaje. Escríbenos directamente a ${to}.` }
  }
}
