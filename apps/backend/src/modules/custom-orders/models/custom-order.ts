import { model } from '@medusajs/framework/utils'

/**
 * CustomOrder — pedido de pegatinas personalizadas (configurador
 * /personalizadas). Captura toda la config del configurador, el archivo de
 * diseño que sube el cliente, y los mockups (proofs) que Nikita envía antes
 * de producir.
 *
 * Fase actual (MVP):
 *   - Se crean manualmente desde admin o vía Store API en una fase posterior.
 *   - Nikita sube mockups, cambia status, escribe notas.
 *
 * Fase siguiente (carrito):
 *   - cart_id / order_id se rellenarán cuando el flujo pase por el carrito y
 *     Stripe. Hoy quedan nullables.
 *
 * Status convención:
 *   pending_review   - recibido, Nikita lo está revisando
 *   proof_sent       - se envió el primer mockup al cliente
 *   awaiting_changes - cliente pidió cambios, Nikita está preparando v2/v3...
 *   approved         - cliente aprobó el mockup, listo para fabricar
 *   in_production    - en producción en taller
 *   shipped          - enviado
 *   delivered        - entregado
 *   cancelled        - cancelado (por cliente o por admin)
 */
const CustomOrder = model.define('custom_order', {
  id: model.id().primaryKey(),

  // ─── Cliente (nullable para guest checkout futuro) ───────────
  customer_email: model.text(),
  customer_name: model.text().nullable(),
  customer_phone: model.text().nullable(),

  // ─── Config del configurador ─────────────────────────────────
  product_type: model.text().nullable(), // vinyls | sheets | holo | glitter | chrome
  shape: model.text(), // rect | square | circle | custom
  cut_type: model.text().nullable(), // kiss_cut | die_cut
  material: model.text(), // mate | brillo (acabado)
  size_id: model.text().nullable(), // s | m | l | xl  (null si custom)
  width_cm: model.number().nullable(),
  height_cm: model.number().nullable(),
  units: model.number(),
  unit_price: model.number(), // €/unidad calculado por pricing.ts
  total_price: model.number(), // total €

  // ─── Diseño y notas del cliente ──────────────────────────────
  design_file_url: model.text().nullable(),
  design_file_name: model.text().nullable(),
  customer_notes: model.text().nullable(),

  // ─── Estado del workflow ─────────────────────────────────────
  status: model.text().default('pending_review'),

  // ─── Mockups versionados ─────────────────────────────────────
  // JSON array: { id, url, file_name?, version, sent_at, admin_notes?,
  //               customer_response?: 'approved'|'changes_requested',
  //               customer_response_at?, customer_response_notes? }
  proofs: model.json().nullable(),

  // ─── Trabajo interno ─────────────────────────────────────────
  admin_notes: model.text().nullable(),

  // ─── Prioridad de producción (socios RT Bunker Club) ─────────
  // priority=true → al principio de la cola (impresión mismo día).
  priority: model.boolean().default(false),
  membership_tier: model.text().nullable(), // bronce | plata | gold | null
  paid_with_credits: model.boolean().default(false),

  // ─── Integración futura con Cart/Order de Medusa ─────────────
  cart_id: model.text().nullable(),
  order_id: model.text().nullable(),

  // ─── Token para futura página pública de aprobación ──────────
  magic_token: model.text(),

  // ─── Envío (se rellenan al pasar a status="shipped") ─────────
  tracking_number: model.text().nullable(),
  tracking_url: model.text().nullable(),
  shipping_carrier: model.text().nullable(),
})

export default CustomOrder
