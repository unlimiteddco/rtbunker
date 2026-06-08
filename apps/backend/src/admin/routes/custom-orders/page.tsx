import { defineRouteConfig } from '@medusajs/admin-sdk'
import { ArrowUpRightOnBox, Sparkles } from '@medusajs/icons'
import {
  Badge,
  Container,
  DataTable,
  DataTablePaginationState,
  createDataTableColumnHelper,
  Heading,
  IconButton,
  Select,
  Text,
  useDataTable,
} from '@medusajs/ui'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { sdk } from '../../lib/client'
import {
  CUSTOM_ORDER_STATUSES,
  type CustomOrder,
  type CustomOrderStatus,
  STATUS_COLOR,
  STATUS_LABELS,
  SHAPE_LABELS,
  formatMoney,
  formatSize,
} from '../../lib/custom-orders'

interface ListResponse {
  custom_orders: CustomOrder[]
  count: number
  limit: number
  offset: number
}

const columnHelper = createDataTableColumnHelper<CustomOrder>()

const TIER_LABELS: Record<string, string> = { bronce: 'Bronce', plata: 'Plata', gold: 'Gold' }

const columns = [
  columnHelper.accessor('priority', {
    header: 'Cola',
    cell: ({ row }) => {
      const o = row.original
      if (!o.priority && !o.paid_with_credits) {
        return (
          <Text size="small" leading="compact" className="text-ui-fg-muted">
            —
          </Text>
        )
      }
      return (
        <div className="flex flex-col items-start gap-1">
          {o.priority ? (
            <Badge size="2xsmall" color="red">
              ⚡ Prioritario{o.membership_tier ? ` · ${TIER_LABELS[o.membership_tier] ?? o.membership_tier}` : ''}
            </Badge>
          ) : null}
          {o.paid_with_credits ? (
            <Badge size="2xsmall" color="purple">
              Créditos
            </Badge>
          ) : null}
        </div>
      )
    },
  }),
  columnHelper.accessor('customer_email', {
    header: 'Cliente',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <Text size="small" leading="compact" weight="plus">
          {row.original.customer_name ?? row.original.customer_email}
        </Text>
        {row.original.customer_name ? (
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {row.original.customer_email}
          </Text>
        ) : null}
      </div>
    ),
  }),
  columnHelper.accessor('shape', {
    header: 'Config',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <Text size="small" leading="compact" weight="plus">
          {SHAPE_LABELS[row.original.shape] ?? row.original.shape}
        </Text>
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          {formatSize(row.original)} · {row.original.units} uds
        </Text>
      </div>
    ),
  }),
  columnHelper.accessor('total_price', {
    header: 'Total',
    cell: ({ getValue }) => (
      <Text size="small" leading="compact" weight="plus">
        {formatMoney(getValue())}
      </Text>
    ),
  }),
  columnHelper.accessor('status', {
    header: 'Estado',
    cell: ({ getValue }) => {
      const status = getValue() as CustomOrderStatus
      return (
        <Badge size="2xsmall" color={STATUS_COLOR[status]}>
          {STATUS_LABELS[status]}
        </Badge>
      )
    },
  }),
  columnHelper.accessor('proofs', {
    header: 'Mockups',
    cell: ({ getValue }) => {
      const proofs = getValue() ?? []
      return (
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          {Array.isArray(proofs) ? proofs.length : 0}
        </Text>
      )
    },
  }),
  columnHelper.accessor('created_at', {
    header: 'Recibido',
    cell: ({ getValue }) => (
      <Text size="small" leading="compact" className="text-ui-fg-subtle">
        {new Date(getValue()).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      </Text>
    ),
  }),
  columnHelper.display({
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <div className="flex justify-end">
        <IconButton size="small" variant="transparent" asChild>
          <Link
            to={`/custom-orders/${row.original.id}`}
            aria-label="Abrir pedido"
            onClick={(e) => e.stopPropagation()}
          >
            <ArrowUpRightOnBox />
          </Link>
        </IconButton>
      </div>
    ),
  }),
]

const CustomOrdersPage = () => {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<CustomOrderStatus | 'all'>('all')
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })

  const limit = pagination.pageSize
  const offset = pagination.pageIndex * limit

  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ['custom-orders', limit, offset, statusFilter],
    queryFn: () => {
      const params: Record<string, string | number> = {
        limit,
        offset,
      }
      if (statusFilter !== 'all') params.status = statusFilter
      return sdk.client.fetch('/admin/custom-orders', { query: params })
    },
  })

  const table = useDataTable({
    data: data?.custom_orders ?? [],
    columns,
    rowCount: data?.count ?? 0,
    getRowId: (o) => o.id,
    isLoading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
    onRowClick: (_e, row) => navigate(`/custom-orders/${row.id}`),
  })

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Personalizadas</Heading>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Gestión de pedidos custom · mockups antes de enviar a producción.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as CustomOrderStatus | 'all')
              setPagination((p) => ({ ...p, pageIndex: 0 }))
            }}
          >
            <Select.Trigger className="min-w-48">
              <Select.Value placeholder="Filtrar estado" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="all">Todos los estados</Select.Item>
              {CUSTOM_ORDER_STATUSES.map((s) => (
                <Select.Item key={s} value={s}>
                  {STATUS_LABELS[s]}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
      </div>

      <DataTable instance={table}>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>

      {!isLoading && (data?.custom_orders ?? []).length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
          <Sparkles className="text-ui-fg-muted" />
          <Heading level="h3">Aún no hay pedidos custom</Heading>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Aparecerán aquí cuando lleguen desde el storefront o se registren vía API.
          </Text>
        </div>
      ) : null}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: 'Personalizadas',
  icon: Sparkles,
})

export default CustomOrdersPage
