import { createWorkflow, WorkflowResponse, createStep, StepResponse } from '@medusajs/framework/workflows-sdk'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import type { INotificationModuleService } from '@medusajs/framework/types'

import { BANK_TRANSFER_METHOD, getBankTransferDetails } from '../../lib/bank-transfer'
import { orderPlacedTemplate, orderPlacedAdminTemplate } from './templates'

type OrderItemRow = {
  title: string
  quantity: number
  unit_price?: number | null
  thumbnail?: string | null
  variant_title?: string | null
  metadata?: Record<string, unknown> | null
}

/** Texto personalizado del line item (`metadata.custom_text`), si existe. */
const customTextOf = (i: OrderItemRow): string | null => {
  const v = i.metadata?.custom_text
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

export interface SendOrderPlacedEmailInput {
  order_id: string
}

const sendOrderPlacedStep = createStep(
  'send-order-placed',
  async (input: SendOrderPlacedEmailInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const notification = container.resolve<INotificationModuleService>(Modules.NOTIFICATION)

    const { data: orders } = await query.graph({
      entity: 'order',
      fields: [
        'id',
        'display_id',
        'email',
        'currency_code',
        'total',
        'subtotal',
        'shipping_total',
        'tax_total',
        'discount_total',
        'metadata',
        'cart.metadata',
        'items.title',
        'items.quantity',
        'items.unit_price',
        'items.thumbnail',
        'items.variant_title',
        'items.metadata',
        'shipping_address.first_name',
        'shipping_address.last_name',
        'shipping_address.address_1',
        'shipping_address.city',
        'shipping_address.postal_code',
        'shipping_address.country_code',
      ],
      filters: { id: input.order_id },
    })

    const order = orders[0]
    if (!order?.email) return new StepResponse(null)

    const sa = order.shipping_address
    const customerName = [sa?.first_name, sa?.last_name].filter(Boolean).join(' ') || null

    // Pago por transferencia: el storefront guarda `payment_method` en la
    // metadata del carrito antes de completarlo. Medusa 2.4 no la copia al
    // pedido (lo hace el subscriber order-placed-payment-method, en paralelo),
    // así que miramos ambas para no depender del orden de los subscribers.
    const paymentMethodOf = (m: unknown) =>
      (m as Record<string, unknown> | null | undefined)?.payment_method
    const isBankTransfer =
      paymentMethodOf(order.metadata) === BANK_TRANSFER_METHOD ||
      paymentMethodOf((order as { cart?: { metadata?: unknown } | null }).cart?.metadata) ===
        BANK_TRANSFER_METHOD
    const bank = getBankTransferDetails()
    const items = (order.items ?? []) as OrderItemRow[]

    const tpl = orderPlacedTemplate({
      display_id: order.display_id,
      email: order.email,
      customer_name: customerName,
      total: order.total,
      subtotal: order.subtotal,
      shipping_total: order.shipping_total,
      tax_total: order.tax_total,
      discount_total: order.discount_total,
      currency_code: order.currency_code,
      storefront_url: process.env.STOREFRONT_URL ?? null,
      shipping_address: sa
        ? {
            name: customerName,
            address_1: sa.address_1,
            city: sa.city,
            postal_code: sa.postal_code,
            country: sa.country_code ? String(sa.country_code).toUpperCase() : null,
          }
        : null,
      items: items.map((i) => ({
        title: i.title,
        quantity: i.quantity,
        unit_price: i.unit_price,
        thumbnail: i.thumbnail,
        variant_title: i.variant_title,
        custom_text: customTextOf(i),
      })),
      bank_transfer: isBankTransfer
        ? { holder: bank.holder, iban: bank.iban, bank: bank.bank, bic: bank.bic }
        : null,
    })

    const result = await notification.createNotifications({
      to: order.email,
      channel: 'email',
      template: 'order.placed',
      data: { subject: tpl.subject, html: tpl.html },
    })

    // Aviso interno al equipo: solo si hay un destinatario configurado.
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL ?? process.env.RESEND_REPLY_TO
    if (adminEmail) {
      const adminTpl = orderPlacedAdminTemplate({
        display_id: order.display_id,
        email: order.email,
        customer_name: customerName,
        total: order.total,
        currency_code: order.currency_code,
        admin_url: `${process.env.MEDUSA_BACKEND_URL ?? ''}/app/orders/${order.id}`,
        is_bank_transfer: isBankTransfer,
        items: items.map((i) => ({
          title: i.title,
          quantity: i.quantity,
          unit_price: i.unit_price,
          variant_title: i.variant_title,
          custom_text: customTextOf(i),
        })),
      })

      // Aislado: un fallo del aviso interno NO debe romper el step (el email
      // al cliente ya se envió) ni provocar reintentos con email duplicado.
      try {
        await notification.createNotifications({
          to: adminEmail,
          channel: 'email',
          template: 'order.placed_admin',
          data: { subject: adminTpl.subject, html: adminTpl.html },
        })
      } catch (err) {
        console.error('[order.placed] Falló el aviso al admin:', err)
      }
    }

    return new StepResponse(result)
  },
)

export const sendOrderPlacedEmailWorkflow = createWorkflow(
  'send-order-placed-email',
  (input: SendOrderPlacedEmailInput) => {
    const result = sendOrderPlacedStep(input)
    return new WorkflowResponse(result)
  },
)
