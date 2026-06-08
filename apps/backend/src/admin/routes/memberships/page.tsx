import { defineRouteConfig } from '@medusajs/admin-sdk'
import { Star } from '@medusajs/icons'
import {
  Badge,
  Button,
  Container,
  DataTable,
  DataTablePaginationState,
  Drawer,
  Heading,
  Input,
  Label,
  Select,
  Text,
  createDataTableColumnHelper,
  toast,
  useDataTable,
} from '@medusajs/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { sdk } from '../../lib/client'

interface Membership {
  id: string
  customer_id: string
  customer_email: string | null
  customer_name: string | null
  tier: 'bronce' | 'plata' | 'gold'
  status: 'incomplete' | 'active' | 'past_due' | 'canceled'
  current_period_end: string | null
  cancel_at_period_end: boolean
  credits_balance: number
  credits_renews_at: string | null
  created_at: string
}

interface ListResponse {
  memberships: Membership[]
  count: number
  limit: number
  offset: number
}

const TIER_LABELS: Record<string, string> = { bronce: 'Bronce', plata: 'Plata', gold: 'Gold' }
const TIER_COLOR: Record<string, 'orange' | 'grey' | 'green'> = {
  bronce: 'orange',
  plata: 'grey',
  gold: 'green',
}
const STATUS_LABELS: Record<string, string> = {
  incomplete: 'Incompleta',
  active: 'Activa',
  past_due: 'Pago pendiente',
  canceled: 'Cancelada',
}
const STATUS_COLOR: Record<string, 'grey' | 'green' | 'orange' | 'red'> = {
  incomplete: 'grey',
  active: 'green',
  past_due: 'orange',
  canceled: 'red',
}
const STATUSES = ['incomplete', 'active', 'past_due', 'canceled'] as const

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

const columnHelper = createDataTableColumnHelper<Membership>()

const MembershipsPage = () => {
  const queryClient = useQueryClient()
  const [pagination, setPagination] = useState<DataTablePaginationState>({ pageIndex: 0, pageSize: 20 })
  const [editing, setEditing] = useState<Membership | null>(null)

  const limit = pagination.pageSize
  const offset = pagination.pageIndex * limit

  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ['memberships', limit, offset],
    queryFn: () => sdk.client.fetch('/admin/memberships', { query: { limit, offset } }),
  })

  const columns = [
    columnHelper.accessor('customer_email', {
      header: 'Cliente',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <Text size="small" leading="compact" weight="plus">
            {row.original.customer_name ?? row.original.customer_email ?? row.original.customer_id}
          </Text>
          {row.original.customer_name && row.original.customer_email ? (
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              {row.original.customer_email}
            </Text>
          ) : null}
        </div>
      ),
    }),
    columnHelper.accessor('tier', {
      header: 'Plan',
      cell: ({ getValue }) => (
        <Badge size="2xsmall" color={TIER_COLOR[getValue()] ?? 'grey'}>
          {TIER_LABELS[getValue()] ?? getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Estado',
      cell: ({ getValue }) => (
        <Badge size="2xsmall" color={STATUS_COLOR[getValue()] ?? 'grey'}>
          {STATUS_LABELS[getValue()] ?? getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor('credits_balance', {
      header: 'Créditos',
      cell: ({ getValue }) => (
        <Text size="small" leading="compact" weight="plus">
          {getValue()}
        </Text>
      ),
    }),
    columnHelper.accessor('current_period_end', {
      header: 'Renovación',
      cell: ({ row }) => (
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          {fmtDate(row.original.current_period_end)}
          {row.original.cancel_at_period_end ? ' · cancela' : ''}
        </Text>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button size="small" variant="secondary" onClick={() => setEditing(row.original)}>
            Ajustar
          </Button>
        </div>
      ),
    }),
  ]

  const table = useDataTable({
    data: data?.memberships ?? [],
    columns,
    rowCount: data?.count ?? 0,
    getRowId: (m) => m.id,
    isLoading,
    pagination: { state: pagination, onPaginationChange: setPagination },
  })

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">RT Bunker Club</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Suscripciones de socios · {data?.count ?? 0} en total
          </Text>
        </div>
      </div>
      <DataTable instance={table}>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>

      <EditDrawer
        membership={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          queryClient.invalidateQueries({ queryKey: ['memberships'] })
        }}
      />
    </Container>
  )
}

function EditDrawer({
  membership,
  onClose,
  onSaved,
}: {
  membership: Membership | null
  onClose: () => void
  onSaved: () => void
}) {
  const [credits, setCredits] = useState('')
  const [status, setStatus] = useState<string>('active')

  useEffect(() => {
    if (membership) {
      setCredits(String(membership.credits_balance))
      setStatus(membership.status)
    }
  }, [membership])

  const mutation = useMutation({
    mutationFn: (body: { credits_balance?: number; status?: string }) =>
      sdk.client.fetch(`/admin/memberships/${membership!.id}`, { method: 'POST', body }),
    onSuccess: () => {
      toast.success('Membresía actualizada')
      onSaved()
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar')
    },
  })

  return (
    <Drawer open={Boolean(membership)} onOpenChange={(o) => (o ? null : onClose())}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Ajustar membresía</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="flex flex-col gap-4">
          <Text size="small" className="text-ui-fg-subtle">
            {membership?.customer_email ?? membership?.customer_id} ·{' '}
            {TIER_LABELS[membership?.tier ?? ''] ?? membership?.tier}
          </Text>

          <div className="flex flex-col gap-1">
            <Label size="small" weight="plus">
              Créditos disponibles
            </Label>
            <Input
              type="number"
              min={0}
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label size="small" weight="plus">
              Estado
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                {STATUSES.map((s) => (
                  <Select.Item key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
        </Drawer.Body>
        <Drawer.Footer>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              const n = parseInt(credits, 10)
              mutation.mutate({
                credits_balance: Number.isFinite(n) ? n : undefined,
                status,
              })
            }}
            isLoading={mutation.isPending}
          >
            Guardar
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}

export const config = defineRouteConfig({
  label: 'RT Bunker Club',
  icon: Star,
})

export default MembershipsPage
