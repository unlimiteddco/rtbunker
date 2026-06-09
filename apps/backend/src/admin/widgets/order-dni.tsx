import { defineWidgetConfig } from '@medusajs/admin-sdk'
import { DetailWidgetProps, HttpTypes } from '@medusajs/framework/types'
import { Container, Heading, Text } from '@medusajs/ui'
import { useQuery } from '@tanstack/react-query'

import { sdk } from '../lib/client'

function readDni(metadata: Record<string, unknown> | null | undefined): string | null {
  const value = metadata?.dni
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const OrderDniWidget = ({ data: order }: DetailWidgetProps<HttpTypes.AdminOrder>) => {
  // El metadata puede no venir cargado por defecto en el detalle del pedido,
  // así que lo recuperamos siempre en mount para asegurar tener el DNI.
  const { data: fetched } = useQuery({
    queryFn: () => sdk.admin.order.retrieve(order.id, { fields: 'id,metadata' }),
    queryKey: ['order-dni', order.id],
  })

  const dni = readDni(fetched?.order?.metadata) ?? readDni(order.metadata)

  return (
    <Container className="flex flex-col gap-y-3 px-6 py-4">
      <Heading level="h3">Datos de facturación</Heading>
      <div className="flex flex-col gap-y-1">
        <Text size="small" leading="compact" weight="plus">
          DNI / NIE / CIF para factura
        </Text>
        {dni ? (
          <Text size="small" leading="compact" weight="plus">
            {dni}
          </Text>
        ) : (
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            No facilitado
          </Text>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: 'order.details.side.after',
})

export default OrderDniWidget
