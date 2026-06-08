import type { ExecArgs } from '@medusajs/framework/types'

import { createCustomOrderWorkflow } from '../workflows/create-custom-order'

/**
 * Crea 3 pedidos custom de ejemplo para probar el admin.
 * Uso:
 *   npx medusa exec ./src/scripts/seed-custom-orders.ts
 */
export default async function seedCustomOrders({ container }: ExecArgs) {
  const logger = container.resolve('logger')

  const samples = [
    {
      customer_email: 'pedro.garcia@example.com',
      customer_name: 'Pedro García',
      customer_phone: '+34 600 123 456',
      shape: 'rect',
      material: 'holo',
      size_id: 'm',
      units: 50,
      unit_price: 3.6,
      total_price: 180,
      customer_notes:
        'Quiero el logo en azul oscuro, fondo transparente. Tengo el SVG en alta.',
    },
    {
      customer_email: 'maria.lopez@example.com',
      customer_name: 'María López',
      customer_phone: '+34 612 998 877',
      shape: 'circle',
      material: 'mate',
      size_id: 'l',
      units: 200,
      unit_price: 1.85,
      total_price: 370,
      customer_notes:
        'Para un evento de moto en septiembre. Necesito 200 idénticas para repartir.',
    },
    {
      customer_email: 'carlos.taller@example.com',
      customer_name: 'Carlos · Taller MotorSport',
      customer_phone: '+34 666 555 444',
      shape: 'custom',
      material: 'refl',
      width_cm: 18,
      height_cm: 6,
      units: 30,
      unit_price: 7.4,
      total_price: 222,
      customer_notes:
        'Silueta a medida con el logo del taller. Reflectante para visibilidad nocturna.',
    },
  ]

  for (const input of samples) {
    const { result } = await createCustomOrderWorkflow(container).run({ input })
    logger.info(`Created custom order ${result.id} for ${input.customer_email}`)
  }

  logger.info(`Seed completed: ${samples.length} custom orders created.`)
}
