/**
 * Templates de email de RT Bunker. HTML inline, table-based y seguro para
 * clientes de correo (Gmail, Apple Mail, Outlook). Paleta de marca: carbón
 * #0f0f0f + cyan Tiffany #0abab5. En el futuro se pueden migrar a react-email.
 */

const BRAND = {
  carbon: '#0f0f0f',
  cyan: '#0abab5',
  cyanDeep: '#089290',
  ink: '#2a2a2a',
  muted: '#7a7a7a',
  line: '#ececec',
  paper: '#faf9f7',
} as const

const storeBase = () => (process.env.STOREFRONT_URL ?? 'https://rtbunker.com/es').replace(/\/$/, '')

/**
 * Shell de marca: cabecera carbón con el wordmark, tarjeta blanca con el
 * contenido y pie carbón con enlaces. `preheader` es el texto de preview que
 * muestran las bandejas de entrada antes de abrir el email.
 */
const wrap = (title: string, body: string, opts: { preheader?: string } = {}) => {
  const base = storeBase()
  const preheader = opts.preheader ?? ''
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light only" />
<title>${title}</title>
</head>
<body style="margin:0; padding:0; background:${BRAND.line}; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; -webkit-font-smoothing:antialiased;">
  ${preheader ? `<div style="display:none; max-height:0; overflow:hidden; mso-hide:all; opacity:0; color:transparent;">${preheader}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.line}; padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px; width:100%;">
        <tr><td style="background:${BRAND.carbon}; border-radius:16px 16px 0 0; padding:22px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;">
              <span style="color:#ffffff; font-size:21px; font-weight:800; letter-spacing:0.22em; text-transform:uppercase;">RT&nbsp;BUNKER</span>
            </td>
            <td align="right" style="vertical-align:middle;">
              <span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${BRAND.cyan};"></span>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="background:#ffffff; padding:34px 28px 30px;">
          <h1 style="margin:0 0 18px; font-size:23px; line-height:1.2; color:${BRAND.carbon}; font-weight:800; letter-spacing:-0.01em;">${title}</h1>
          <div style="font-size:15px; line-height:1.6; color:${BRAND.ink};">
            ${body}
          </div>
        </td></tr>
        <tr><td style="background:${BRAND.carbon}; border-radius:0 0 16px 16px; padding:24px 28px;">
          <p style="margin:0 0 6px; color:#ffffff; font-size:13px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase;">RT Bunker</p>
          <p style="margin:0 0 14px; color:#8a8a8a; font-size:12px; line-height:1.5;">Pegatinas y vinilos de calidad premium · Fabricación nacional en Cuarte de Huerva (España)</p>
          <p style="margin:0; font-size:11px; line-height:1.5;">
            <a href="${base}/tienda" style="color:${BRAND.cyan}; text-decoration:none;">Tienda</a>
            <span style="color:#444;"> · </span>
            <a href="${base}/cuenta" style="color:${BRAND.cyan}; text-decoration:none;">Mi cuenta</a>
            <span style="color:#444;"> · </span>
            <a href="https://instagram.com/rtbunker" style="color:${BRAND.cyan}; text-decoration:none;">@rtbunker</a>
          </p>
          <p style="margin:14px 0 0; color:#555; font-size:11px;">Email automático. Si necesitas ayuda, responde directamente a este mensaje.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: currency.toUpperCase() }).format(
    amount,
  )

/** Botón CTA inline. variant cyan (default) o dark. */
const button = (href: string, label: string, variant: 'cyan' | 'dark' = 'cyan') => {
  const bg = variant === 'dark' ? BRAND.carbon : BRAND.cyan
  const color = variant === 'dark' ? '#ffffff' : BRAND.carbon
  return `<a href="${href}" style="display:inline-block; background:${bg}; color:${color}; font-weight:700; padding:13px 26px; border-radius:10px; text-decoration:none; text-transform:uppercase; letter-spacing:0.08em; font-size:13px;">${label}</a>`
}

export const orderPlacedTemplate = (order: {
  display_id: number | string
  email: string
  customer_name?: string | null
  total: number
  subtotal?: number | null
  shipping_total?: number | null
  tax_total?: number | null
  discount_total?: number | null
  currency_code: string
  storefront_url?: string | null
  shipping_address?: {
    name?: string | null
    address_1?: string | null
    city?: string | null
    postal_code?: string | null
    country?: string | null
  } | null
  items: Array<{
    title: string
    quantity: number
    unit_price?: number | null
    thumbnail?: string | null
    variant_title?: string | null
  }>
}) => {
  const cur = order.currency_code
  const base = (order.storefront_url ?? storeBase()).replace(/\/$/, '')
  const greeting = order.customer_name ? `Hola ${order.customer_name},` : '¡Gracias por tu compra!'

  const itemRows = order.items
    .map((it) => {
      const lineTotal = (it.unit_price ?? 0) * it.quantity
      const thumb = it.thumbnail
        ? `<img src="${it.thumbnail}" alt="" width="56" height="56" style="width:56px; height:56px; object-fit:cover; border-radius:8px; border:1px solid ${BRAND.line}; display:block;" />`
        : `<div style="width:56px; height:56px; border-radius:8px; background:${BRAND.paper}; border:1px solid ${BRAND.line};"></div>`
      const variant =
        it.variant_title && it.variant_title !== it.title
          ? `<p style="margin:2px 0 0; font-size:12px; color:${BRAND.muted};">${it.variant_title}</p>`
          : ''
      return `<tr>
        <td style="padding:12px 12px 12px 0; vertical-align:top; width:56px;">${thumb}</td>
        <td style="padding:12px 8px 12px 0; vertical-align:middle;">
          <p style="margin:0; font-size:14px; font-weight:600; color:${BRAND.carbon};">${it.title}</p>
          ${variant}
          <p style="margin:4px 0 0; font-size:12px; color:${BRAND.muted};">Cantidad: ${it.quantity}</p>
        </td>
        <td style="padding:12px 0; vertical-align:middle; text-align:right; white-space:nowrap; font-size:14px; font-weight:600; color:${BRAND.carbon};">
          ${formatMoney(lineTotal, cur)}
        </td>
      </tr>`
    })
    .join('')

  const totalsRow = (label: string, value: number, opts: { strong?: boolean; accent?: boolean } = {}) =>
    `<tr>
       <td style="padding:5px 0; font-size:${opts.strong ? '15px' : '13px'}; color:${opts.strong ? BRAND.carbon : BRAND.muted}; font-weight:${opts.strong ? '700' : '400'};">${label}</td>
       <td style="padding:5px 0; text-align:right; font-size:${opts.strong ? '16px' : '13px'}; color:${opts.accent ? BRAND.cyanDeep : opts.strong ? BRAND.carbon : BRAND.ink}; font-weight:${opts.strong ? '800' : '500'};">${formatMoney(value, cur)}</td>
     </tr>`

  const totals =
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;">
       ${order.subtotal != null ? totalsRow('Subtotal', order.subtotal) : ''}
       ${order.discount_total ? totalsRow('Descuento', -Math.abs(order.discount_total), { accent: true }) : ''}
       ${order.shipping_total != null ? totalsRow('Envío', order.shipping_total) : ''}
       ${order.tax_total ? totalsRow('Impuestos (incl.)', order.tax_total) : ''}
       <tr><td colspan="2" style="padding:8px 0 0;"><div style="border-top:1px solid ${BRAND.line};"></div></td></tr>
       ${totalsRow('Total', order.total, { strong: true })}
     </table>`

  const addr = order.shipping_address
  const addressBlock =
    addr && (addr.address_1 || addr.city)
      ? `<div style="margin-top:24px; padding:16px 18px; background:${BRAND.paper}; border-radius:12px;">
           <p style="margin:0 0 6px; font-size:11px; text-transform:uppercase; letter-spacing:0.14em; color:${BRAND.muted};">Envío a</p>
           <p style="margin:0; font-size:14px; line-height:1.5; color:${BRAND.ink};">
             ${addr.name ? `<strong>${addr.name}</strong><br/>` : ''}
             ${addr.address_1 ?? ''}${addr.address_1 ? '<br/>' : ''}
             ${[addr.postal_code, addr.city].filter(Boolean).join(' ')}${addr.country ? `, ${addr.country}` : ''}
           </p>
         </div>`
      : ''

  return {
    subject: `Pedido #${order.display_id} confirmado · ¡gracias!`,
    html: wrap(
      `Pedido confirmado`,
      `<p style="margin:0 0 6px;">${greeting}</p>
       <p style="margin:0 0 22px;">Hemos recibido tu pedido <strong>#${order.display_id}</strong> y ya estamos con él.
       Aquí tienes el resumen:</p>

       <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>

       <div style="margin-top:14px; padding-top:6px; border-top:1px solid ${BRAND.line};">${totals}</div>

       ${addressBlock}

       <div style="margin:28px 0 6px;">${button(`${base}/cuenta`, 'Ver mi pedido →')}</div>

       <div style="margin-top:30px; padding-top:22px; border-top:1px solid ${BRAND.line};">
         <p style="margin:0 0 12px; font-size:11px; text-transform:uppercase; letter-spacing:0.14em; color:${BRAND.muted};">Qué pasa ahora</p>
         <p style="margin:0 0 8px; font-size:14px; color:${BRAND.ink};"><strong style="color:${BRAND.cyanDeep};">1.</strong> Preparamos tu pedido en el taller de Cuarte de Huerva.</p>
         <p style="margin:0 0 8px; font-size:14px; color:${BRAND.ink};"><strong style="color:${BRAND.cyanDeep};">2.</strong> Te avisamos por email en cuanto salga, con el seguimiento.</p>
         <p style="margin:0; font-size:14px; color:${BRAND.ink};"><strong style="color:${BRAND.cyanDeep};">3.</strong> Suele llegar en 24–72 h laborables.</p>
       </div>`,
      { preheader: `Tu pedido #${order.display_id} está confirmado · total ${formatMoney(order.total, cur)}` },
    ),
  }
}

/**
 * Aviso interno al equipo cuando entra un pedido nuevo. Lista los artículos,
 * el total y un CTA directo al pedido en el admin de Medusa.
 */
export const orderPlacedAdminTemplate = (order: {
  display_id: number | string
  email: string
  customer_name?: string | null
  total: number
  currency_code: string
  admin_url: string
  items: Array<{
    title: string
    quantity: number
    unit_price?: number | null
    variant_title?: string | null
  }>
}) => {
  const cur = order.currency_code

  const itemRows = order.items
    .map((it) => {
      const lineTotal = (it.unit_price ?? 0) * it.quantity
      const variant =
        it.variant_title && it.variant_title !== it.title
          ? `<p style="margin:2px 0 0; font-size:12px; color:${BRAND.muted};">${it.variant_title}</p>`
          : ''
      return `<tr>
        <td style="padding:10px 8px 10px 0; vertical-align:middle;">
          <p style="margin:0; font-size:14px; font-weight:600; color:${BRAND.carbon};">${it.title}</p>
          ${variant}
          <p style="margin:4px 0 0; font-size:12px; color:${BRAND.muted};">Cantidad: ${it.quantity}</p>
        </td>
        <td style="padding:10px 0; vertical-align:middle; text-align:right; white-space:nowrap; font-size:14px; font-weight:600; color:${BRAND.carbon};">
          ${formatMoney(lineTotal, cur)}
        </td>
      </tr>`
    })
    .join('')

  const customer = order.customer_name
    ? `${order.customer_name} · ${order.email}`
    : order.email

  return {
    subject: `Nuevo pedido #${order.display_id} · ${formatMoney(order.total, cur)}`,
    html: wrap(
      `Nuevo pedido #${order.display_id}`,
      `<p style="margin:0 0 6px;">Ha entrado un pedido nuevo.</p>
       <p style="margin:0 0 22px; font-size:14px; color:${BRAND.ink};"><strong>Cliente:</strong> ${customer}</p>

       <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>

       <div style="margin-top:14px; padding-top:12px; border-top:1px solid ${BRAND.line};">
         <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
           <tr>
             <td style="padding:5px 0; font-size:15px; color:${BRAND.carbon}; font-weight:700;">Total</td>
             <td style="padding:5px 0; text-align:right; font-size:16px; color:${BRAND.carbon}; font-weight:800;">${formatMoney(order.total, cur)}</td>
           </tr>
         </table>
       </div>

       <div style="margin:28px 0 6px;">${button(order.admin_url, 'Abrir en admin →', 'dark')}</div>`,
      { preheader: `Pedido #${order.display_id} · ${customer} · ${formatMoney(order.total, cur)}` },
    ),
  }
}

export const orderShippedTemplate = (order: {
  display_id: number | string
  tracking_numbers?: string[]
  carrier?: string
}) => {
  const tracking = order.tracking_numbers?.length
    ? `<p>Número(s) de seguimiento: <strong>${order.tracking_numbers.join(', ')}</strong></p>`
    : ''
  const carrier = order.carrier ? `<p>Transportista: ${order.carrier}</p>` : ''
  return {
    subject: `Tu pedido #${order.display_id} está en camino`,
    html: wrap(
      `Tu pedido va de camino`,
      `<p>Hemos enviado tu pedido <strong>#${order.display_id}</strong>.</p>${tracking}${carrier}`,
    ),
  }
}

/**
 * Aviso al cliente cuando un pedido normal pasa a ENTREGADO. Tono cálido,
 * con guiño a compartir en Instagram.
 */
export const orderDeliveredTemplate = (order: {
  display_id: number | string
  customer_name?: string | null
  storefront_url?: string | null
}) => {
  const base = (order.storefront_url ?? storeBase()).replace(/\/$/, '')
  const greeting = order.customer_name ? `¡Hola ${order.customer_name}!` : '¡Hola!'
  return {
    subject: `Tu pedido #${order.display_id} ha llegado · ¡esperamos que te encante!`,
    html: wrap(
      `Tu pedido ha llegado`,
      `<p style="margin:0 0 6px;">${greeting}</p>
       <p style="margin:0 0 18px;">Tu pedido <strong>#${order.display_id}</strong> aparece como entregado.
       Esperamos que haya llegado en perfecto estado y que te encante tanto como a nosotros.</p>
       <p style="margin:0 0 22px;">Si quieres lucirlo en Instagram, etiquétanos como
       <strong>@rtbunker</strong> — nos hace mucha ilusión ver dónde acaban nuestras creaciones.</p>

       <div style="margin:8px 0 6px;">${button(`${base}/tienda`, 'Volver a la tienda →')}</div>

       <p style="margin:28px 0 0; font-size:13px; color:${BRAND.muted};">
         ¿Algún problema con la entrega? Responde a este email y lo resolvemos enseguida.
       </p>`,
      { preheader: `Tu pedido #${order.display_id} ha llegado · esperamos que te encante` },
    ),
  }
}

export const customerCreatedTemplate = (customer: {
  email: string
  first_name?: string | null
  storefront_url?: string | null
}) => {
  const base = (customer.storefront_url ?? storeBase()).replace(/\/$/, '')
  const greeting = customer.first_name ? `Hola ${customer.first_name},` : 'Hola,'

  const perk = (title: string, desc: string) =>
    `<tr>
       <td style="padding:0 12px 0 0; vertical-align:top; width:24px;">
         <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${BRAND.cyan}; margin-top:7px;"></span>
       </td>
       <td style="padding:0 0 14px; vertical-align:top;">
         <p style="margin:0; font-size:14px; font-weight:600; color:${BRAND.carbon};">${title}</p>
         <p style="margin:2px 0 0; font-size:13px; color:${BRAND.muted}; line-height:1.5;">${desc}</p>
       </td>
     </tr>`

  return {
    subject: `Bienvenido al garaje${customer.first_name ? `, ${customer.first_name}` : ''} 🏁`,
    html: wrap(
      `Ya eres de los nuestros`,
      `<p style="margin:0 0 6px;">${greeting}</p>
       <p style="margin:0 0 22px;">Tu cuenta de RT Bunker ya está lista. A partir de ahora comprar pegatinas
       y vinilos de calidad premium —fabricados en España— es cuestión de un par de clics.</p>

       <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
         ${perk('Tus pedidos, siempre a mano', 'Sigue el estado y el envío de cada compra desde tu zona de cliente.')}
         ${perk('Checkout más rápido', 'Guarda tus direcciones y ahorra tiempo en el próximo pedido.')}
         ${perk('Personalizadas a tu medida', 'Encarga diseños propios y aprueba el mockup antes de fabricar.')}
       </table>

       <div style="margin:26px 0 6px;">${button(`${base}/tienda`, 'Explorar la tienda →')}</div>

       <p style="margin:28px 0 0; font-size:12px; color:${BRAND.muted};">
         Tu cuenta está asociada a <strong style="color:${BRAND.ink};">${customer.email}</strong>.
         Si no has sido tú, ignora este email.
       </p>`,
      { preheader: 'Tu cuenta de RT Bunker ya está lista · pegatinas premium fabricadas en España' },
    ),
  }
}

export const newsletterWelcomeTemplate = (data: {
  email: string
  coupon_code: string
  storefront_url?: string | null
}) => {
  const shopHref = data.storefront_url
    ? `${data.storefront_url}/tienda`
    : 'https://rtbunker.com/tienda'
  return {
    subject: `Tu código ${data.coupon_code} ya está activo · -10% en tu primer pedido`,
    html: wrap(
      `Bienvenido al garaje.`,
      `<p>Acabas de unirte a la lista de RT Bunker. Como agradecimiento te dejamos
       este código para usar en tu primer pedido:</p>
       <div style="margin: 24px 0; padding: 18px; background: #fafaf8; border:1px dashed #0abab5; border-radius: 12px; text-align:center;">
         <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.18em; color:#089290;">Tu código</p>
         <p style="margin:6px 0 0; font-family: ui-monospace, Menlo, monospace; font-size:26px; font-weight:bold; letter-spacing:0.12em; color:#0f0f0f;">
           ${data.coupon_code}
         </p>
         <p style="margin:8px 0 0; font-size:13px; color:#666;">−10% sobre el total · sin importe mínimo</p>
       </div>
       <p style="margin:24px 0;">
         <a href="${shopHref}"
            style="display:inline-block; background:#0abab5; color:#0f0f0f; font-weight:700; padding:12px 22px; border-radius:10px; text-decoration:none; text-transform:uppercase; letter-spacing:0.08em; font-size:13px;">
           Ir a la tienda →
         </a>
       </p>
       <p style="font-size:13px; color:#666;">
         A partir de ahora te avisaremos de novedades, drops limitados y descuentos sin sobrecargar tu bandeja. Si quieres salir, hay un link de baja en cada email.
       </p>
       <p style="margin-top:24px; font-size:12px; color:#999;">
         Te suscribiste con la dirección <strong>${data.email}</strong>.
       </p>`,
    ),
  }
}

export const customOrderProofSentTemplate = (data: {
  customer_name?: string | null
  order_short_id: string
  proof_url: string
  proof_version: number
  admin_notes?: string | null
  approval_url?: string | null
}) => {
  const greeting = data.customer_name ? `Hola ${data.customer_name},` : 'Hola,'
  const notesBlock = data.admin_notes
    ? `<div style="margin: 20px 0; padding: 16px; background: #fafaf8; border-left: 3px solid #0abab5; border-radius: 4px;">
         <p style="margin: 0 0 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #888;">Notas del equipo</p>
         <p style="margin: 0; white-space: pre-wrap;">${data.admin_notes}</p>
       </div>`
    : ''
  const approvalCta = data.approval_url
    ? `<p style="margin: 24px 0;">
         <a href="${data.approval_url}"
            style="display:inline-block; background:#0abab5; color:#0f0f0f; font-weight:700; padding:12px 22px; border-radius:10px; text-decoration:none; text-transform:uppercase; letter-spacing:0.08em; font-size:13px;">
           Revisar y aprobar →
         </a>
       </p>`
    : `<p style="margin: 24px 0;">
         <a href="${data.proof_url}" target="_blank"
            style="display:inline-block; background:#0abab5; color:#0f0f0f; font-weight:700; padding:12px 22px; border-radius:10px; text-decoration:none; text-transform:uppercase; letter-spacing:0.08em; font-size:13px;">
           Ver mockup en alta →
         </a>
       </p>
       <p style="font-size:13px; color:#666;">
         Responde a este email para aprobarlo o pedirnos cambios.
       </p>`

  return {
    subject: `Mockup v${data.proof_version} listo · pedido ${data.order_short_id}`,
    html: wrap(
      `Tu mockup está listo`,
      `<p>${greeting}</p>
       <p>Hemos preparado la versión <strong>v${data.proof_version}</strong> del mockup
       para tu pedido <strong>${data.order_short_id}</strong>. Échale un ojo:</p>
       <div style="text-align:center; margin: 20px 0;">
         <a href="${data.proof_url}" target="_blank" rel="noreferrer">
           <img src="${data.proof_url}" alt="Mockup v${data.proof_version}"
                style="max-width:100%; height:auto; border-radius:10px; border:1px solid #eee;" />
         </a>
       </div>
       ${notesBlock}
       ${approvalCta}`,
    ),
  }
}

export const customOrderInProductionTemplate = (data: {
  customer_name?: string | null
  order_short_id: string
}) => {
  const greeting = data.customer_name ? `Hola ${data.customer_name},` : 'Hola,'
  return {
    subject: `Empezamos a fabricar tu pedido ${data.order_short_id}`,
    html: wrap(
      `¡Manos a la obra!`,
      `<p>${greeting}</p>
       <p>Tu mockup ya está aprobado y <strong>hemos empezado a fabricar</strong> tu
       pedido <strong>${data.order_short_id}</strong> en el taller de Cuarte de Huerva.</p>
       <p>El siguiente email que recibirás de nosotros es cuando salga camino a tu casa
       con el número de seguimiento. Suele tardar entre 3 y 5 días laborables.</p>
       <p style="margin-top:24px; color:#666; font-size:13px;">
         Si tienes cualquier duda mientras tanto, responde a este email directamente.
       </p>`,
    ),
  }
}

export const customOrderShippedTemplate = (data: {
  customer_name?: string | null
  order_short_id: string
  tracking_number?: string | null
  tracking_url?: string | null
  shipping_carrier?: string | null
}) => {
  const greeting = data.customer_name ? `Hola ${data.customer_name},` : 'Hola,'

  const trackingBlock =
    data.tracking_number || data.tracking_url
      ? `<div style="margin: 20px 0; padding: 16px; background: #fafaf8; border-left: 3px solid #0abab5; border-radius: 4px;">
           <p style="margin: 0 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #888;">Seguimiento</p>
           ${data.shipping_carrier ? `<p style="margin: 0 0 4px;"><strong>${data.shipping_carrier}</strong></p>` : ''}
           ${data.tracking_number ? `<p style="margin: 0; font-family: ui-monospace, Menlo, monospace;">${data.tracking_number}</p>` : ''}
         </div>`
      : ''

  const trackCta = data.tracking_url
    ? `<p style="margin: 24px 0;">
         <a href="${data.tracking_url}" target="_blank"
            style="display:inline-block; background:#0abab5; color:#0f0f0f; font-weight:700; padding:12px 22px; border-radius:10px; text-decoration:none; text-transform:uppercase; letter-spacing:0.08em; font-size:13px;">
           Seguir el envío →
         </a>
       </p>`
    : ''

  return {
    subject: `Tu pedido ${data.order_short_id} va de camino`,
    html: wrap(
      `Tu pedido va de camino`,
      `<p>${greeting}</p>
       <p>Acabamos de entregar tu pedido <strong>${data.order_short_id}</strong> al transportista.
       Suele llegar en 24-48 h laborables.</p>
       ${trackingBlock}
       ${trackCta}
       <p style="margin-top:24px; color:#666; font-size:13px;">
         Si surge algún problema con la entrega, escríbenos respondiendo a este email.
       </p>`,
    ),
  }
}

export const customOrderDeliveredTemplate = (data: {
  customer_name?: string | null
  order_short_id: string
}) => {
  const greeting = data.customer_name ? `¡Hola ${data.customer_name}!` : '¡Hola!'
  return {
    subject: `¿Te encajan tus pegatinas? · ${data.order_short_id}`,
    html: wrap(
      `Esperamos que te encajen`,
      `<p>${greeting}</p>
       <p>Tu pedido <strong>${data.order_short_id}</strong> aparece como entregado.
       Esperamos que las pegatinas hayan llegado en perfecto estado y te encanten.</p>
       <p>Si quieres compartirlas en Instagram, etiquétanos como <strong>@rtbunker</strong> —
       nos hace mucha ilusión ver dónde acaban nuestras creaciones.</p>
       <p style="margin-top:24px; color:#666; font-size:13px;">
         ¿Algún problema con la entrega? Responde a este email y lo resolvemos.
       </p>`,
    ),
  }
}

export const customOrderResponseTemplate = (data: {
  order_short_id: string
  customer_name?: string | null
  customer_email: string
  decision: 'approved' | 'changes_requested'
  proof_version: number
  proof_url: string
  customer_response_notes?: string | null
  admin_url?: string | null
}) => {
  const approved = data.decision === 'approved'
  const title = approved ? '✅ Cliente APROBÓ el mockup' : '🔄 Cliente pidió CAMBIOS'
  const subject = approved
    ? `Aprobado · ${data.order_short_id} (v${data.proof_version})`
    : `Cambios pedidos · ${data.order_short_id} (v${data.proof_version})`

  const customerNotesBlock = data.customer_response_notes
    ? `<div style="margin: 20px 0; padding: 16px; background: #fafaf8; border-left: 3px solid ${approved ? '#1b7a3e' : '#c8321f'}; border-radius: 4px;">
         <p style="margin: 0 0 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #888;">Mensaje del cliente</p>
         <p style="margin: 0; white-space: pre-wrap;">${data.customer_response_notes}</p>
       </div>`
    : approved
      ? ''
      : `<p style="color:#888; font-size: 14px;">El cliente no añadió notas.</p>`

  const nextStepBlock = approved
    ? `<p>Ya puedes <strong>pasar el pedido a producción</strong> cuando esté cobrado.</p>`
    : `<p>Prepara una <strong>nueva versión del mockup</strong> y súbela al pedido. El cliente recibirá un email automático al subirla.</p>`

  const cta = data.admin_url
    ? `<p style="margin: 24px 0;">
         <a href="${data.admin_url}"
            style="display:inline-block; background:#0f0f0f; color:#fff; font-weight:700; padding:12px 22px; border-radius:10px; text-decoration:none; text-transform:uppercase; letter-spacing:0.08em; font-size:13px;">
           Abrir en admin →
         </a>
       </p>`
    : ''

  return {
    subject,
    html: wrap(
      title,
      `<p>Pedido <strong>${data.order_short_id}</strong> · ${data.customer_name ?? data.customer_email}</p>
       <p>Mockup v${data.proof_version}: <a href="${data.proof_url}" target="_blank">ver imagen</a></p>
       ${customerNotesBlock}
       ${nextStepBlock}
       ${cta}`,
    ),
  }
}

export const reviewRequestTemplate = (data: {
  customer_name?: string | null
  order_short_id: string
  storefront_url?: string | null
  products: Array<{ title: string; handle: string | null; thumbnail: string | null }>
}) => {
  const greeting = data.customer_name ? `Hola ${data.customer_name},` : 'Hola,'
  const base = data.storefront_url ?? 'https://rtbunker.com/es'

  const productBlocks = data.products
    .map((p) => {
      const href = p.handle ? `${base}/producto/${p.handle}#reviews` : base
      const thumb = p.thumbnail
        ? `<img src="${p.thumbnail}" alt="${p.title}" width="64" height="64" style="width:64px; height:64px; object-fit:cover; border-radius:8px; border:1px solid #eee; vertical-align:middle;" />`
        : ''
      return `<tr>
        <td style="padding:10px 12px 10px 0; vertical-align:middle;">${thumb}</td>
        <td style="padding:10px 0; vertical-align:middle;">
          <p style="margin:0 0 6px; font-weight:600;">${p.title}</p>
          <a href="${href}"
             style="display:inline-block; background:#0abab5; color:#0f0f0f; font-weight:700; padding:8px 16px; border-radius:8px; text-decoration:none; text-transform:uppercase; letter-spacing:0.06em; font-size:12px;">
            Valorar producto →
          </a>
        </td>
      </tr>`
    })
    .join('')

  return {
    subject: `¿Qué te han parecido tus pegatinas? · ${data.order_short_id}`,
    html: wrap(
      `Cuéntanos qué te parecieron`,
      `<p>${greeting}</p>
       <p>Ya hace unos días que recibiste tu pedido <strong>${data.order_short_id}</strong>.
       Nos ayudaría muchísimo que dejaras una reseña — solo te llevará un minuto y ayuda
       a otros pilotos a decidirse.</p>
       <table style="width:100%; border-collapse:collapse; margin:20px 0;">${productBlocks}</table>
       <p style="font-size:13px; color:#666;">
         Tu opinión se publica tras una revisión rápida del equipo. ¡Gracias por confiar en RT Bunker!
       </p>`,
    ),
  }
}
