import { defineWidgetConfig } from '@medusajs/admin-sdk'
import { DetailWidgetProps, HttpTypes } from '@medusajs/framework/types'
import { CheckCircleSolid, ClockSolid } from '@medusajs/icons'
import { Badge, Button, Container, Heading, Text, toast, usePrompt } from '@medusajs/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { sdk } from '../lib/client'

/** Proveedor de pago manual de Medusa: es el que usa la transferencia. */
const MANUAL_PROVIDER = 'pp_system_default'
const BANK_TRANSFER_METHOD = 'bank_transfer'

type Payment = {
  id: string
  amount: number
  currency_code: string
  provider_id: string
  captured_at?: string | null
  canceled_at?: string | null
}

const money = (amount: number, currency: string) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: currency.toUpperCase() }).format(
    amount,
  )

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })

/**
 * Pedidos pagados por transferencia: deja claro arriba del pedido si el dinero
 * está pendiente o ya cobrado, y permite marcarlo como cobrado con un botón
 * (por debajo es el "Capturar pago" de Medusa sobre el pago manual).
 */
const OrderBankTransferWidget = ({ data: order }: DetailWidgetProps<HttpTypes.AdminOrder>) => {
  const queryClient = useQueryClient()
  const prompt = usePrompt()

  // Carga en mount: la metadata y los pagos no siempre vienen en `data`.
  const { data } = useQuery({
    queryKey: ['order-bank-transfer', order.id],
    queryFn: () =>
      sdk.admin.order.retrieve(order.id, {
        fields:
          'id,display_id,status,metadata,currency_code,*payment_collections,*payment_collections.payments',
      }),
  })

  const fetched = data?.order
  const payments = ((fetched?.payment_collections ?? []) as { payments?: Payment[] }[])
    .flatMap((c) => c.payments ?? [])
    .filter((p) => p.provider_id === MANUAL_PROVIDER && !p.canceled_at)

  const capture = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) await sdk.admin.payment.capture(id, {})
    },
    onSuccess: () => {
      toast.success('Pedido marcado como cobrado.')
      queryClient.invalidateQueries({ queryKey: ['order-bank-transfer', order.id] })
      // Refresca el detalle del pedido y los listados del panel.
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-orders'] })
    },
    onError: (err: Error) => {
      toast.error(`No se pudo marcar como cobrado. ${err.message ?? ''}`)
    },
  })

  if (!fetched) return null

  const isTransfer =
    (fetched.metadata as Record<string, unknown> | null)?.payment_method === BANK_TRANSFER_METHOD ||
    payments.length > 0
  if (!isTransfer || fetched.status === 'canceled' || payments.length === 0) return null

  const pending = payments.filter((p) => !p.captured_at)
  const pendingAmount = pending.reduce((sum, p) => sum + Number(p.amount), 0)
  const currency = payments[0]?.currency_code ?? fetched.currency_code
  const concept = `Pedido #${fetched.display_id}`

  if (pending.length === 0) {
    const last = payments
      .map((p) => p.captured_at)
      .filter((d): d is string => Boolean(d))
      .sort()
      .pop()
    return (
      <Container className="flex items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <CheckCircleSolid className="text-ui-tag-green-icon" />
          <div>
            <Heading level="h3">Transferencia cobrada</Heading>
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              {last ? `Marcada como cobrada el ${dateLabel(last)}. ` : ''}Ya puedes preparar y
              enviar el pedido.
            </Text>
          </div>
        </div>
        <Badge size="2xsmall" color="green">
          Cobrado
        </Badge>
      </Container>
    )
  }

  const confirm = async () => {
    const ok = await prompt({
      title: '¿Has recibido la transferencia?',
      description: `Confirma que en tu banco aparece un ingreso de ${money(pendingAmount, currency)} con el concepto «${concept}». El pedido pasará a pagado y no se puede deshacer desde aquí.`,
      confirmText: 'Sí, marcar como cobrado',
      cancelText: 'Todavía no',
      variant: 'confirmation',
    })
    if (ok) capture.mutate(pending.map((p) => p.id))
  }

  return (
    <Container className="flex flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-3">
        <ClockSolid className="text-ui-tag-orange-icon mt-0.5" />
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Heading level="h3">Transferencia pendiente de cobro</Heading>
            <Badge size="2xsmall" color="orange">
              Sin cobrar
            </Badge>
          </div>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Busca en tu banco un ingreso de{' '}
            <span className="text-ui-fg-base font-medium">{money(pendingAmount, currency)}</span>{' '}
            con el concepto <span className="text-ui-fg-base font-medium">«{concept}»</span>. No
            fabriques ni envíes hasta que llegue.
          </Text>
        </div>
      </div>
      <Button
        size="small"
        onClick={confirm}
        disabled={capture.isPending}
        isLoading={capture.isPending}
        className="shrink-0"
      >
        Marcar como cobrado
      </Button>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: 'order.details.before',
})

export default OrderBankTransferWidget
