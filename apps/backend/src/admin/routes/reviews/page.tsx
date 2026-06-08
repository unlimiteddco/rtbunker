import { defineRouteConfig } from '@medusajs/admin-sdk'
import { StarSolid, ChatBubbleLeftRight, Check, XMark } from '@medusajs/icons'
import {
  Badge,
  Button,
  Container,
  DataTable,
  DataTablePaginationState,
  createDataTableColumnHelper,
  Drawer,
  Heading,
  Select,
  Text,
  Textarea,
  toast,
  useDataTable,
} from '@medusajs/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { sdk } from '../../lib/client'

type ReviewStatus = 'pending' | 'approved' | 'rejected'

interface Review {
  id: string
  product_id: string
  product_title: string | null
  product_handle: string | null
  product_thumbnail: string | null
  customer_id: string | null
  order_id: string | null
  email: string
  name: string | null
  rating: number
  title: string | null
  content: string | null
  status: ReviewStatus
  verified_purchase: boolean
  admin_response: string | null
  created_at: string
}

interface ListResponse {
  reviews: Review[]
  count: number
  limit: number
  offset: number
}

const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: 'Pendiente',
  approved: 'Publicada',
  rejected: 'Rechazada',
}
const STATUS_COLOR: Record<ReviewStatus, 'orange' | 'green' | 'red'> = {
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
}
const REVIEW_STATUSES: ReviewStatus[] = ['pending', 'approved', 'rejected']

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <StarSolid
          key={n}
          className={n <= value ? 'text-ui-tag-orange-icon' : 'text-ui-fg-disabled'}
        />
      ))}
    </div>
  )
}

const columnHelper = createDataTableColumnHelper<Review>()

const columns = [
  columnHelper.accessor('product_title', {
    header: 'Producto',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.product_thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.original.product_thumbnail}
            alt=""
            className="h-8 w-8 shrink-0 rounded object-cover"
          />
        ) : (
          <div className="bg-ui-bg-component h-8 w-8 shrink-0 rounded" />
        )}
        <Text size="small" leading="compact" weight="plus" className="line-clamp-1">
          {row.original.product_title ?? row.original.product_id}
        </Text>
      </div>
    ),
  }),
  columnHelper.accessor('rating', {
    header: 'Nota',
    cell: ({ getValue }) => <Stars value={getValue()} />,
  }),
  columnHelper.accessor('name', {
    header: 'Autor',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <Text size="small" leading="compact" weight="plus">
            {row.original.name ?? row.original.email}
          </Text>
          {row.original.verified_purchase ? (
            <Badge size="2xsmall" color="green">
              Verificada
            </Badge>
          ) : null}
        </div>
        {row.original.name ? (
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {row.original.email}
          </Text>
        ) : null}
      </div>
    ),
  }),
  columnHelper.accessor('content', {
    header: 'Reseña',
    cell: ({ row }) => (
      <div className="flex flex-col">
        {row.original.title ? (
          <Text size="small" leading="compact" weight="plus" className="line-clamp-1">
            {row.original.title}
          </Text>
        ) : null}
        <Text size="small" leading="compact" className="text-ui-fg-subtle line-clamp-1">
          {row.original.content ?? '—'}
        </Text>
      </div>
    ),
  }),
  columnHelper.accessor('status', {
    header: 'Estado',
    cell: ({ getValue }) => {
      const s = getValue()
      return (
        <Badge size="2xsmall" color={STATUS_COLOR[s]}>
          {STATUS_LABELS[s]}
        </Badge>
      )
    },
  }),
  columnHelper.accessor('created_at', {
    header: 'Recibida',
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
]

const ReviewsPage = () => {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('pending')
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })
  const [selected, setSelected] = useState<Review | null>(null)
  const [response, setResponse] = useState('')

  const limit = pagination.pageSize
  const offset = pagination.pageIndex * limit

  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ['reviews', limit, offset, statusFilter],
    queryFn: () => {
      const params: Record<string, string | number> = {
        limit,
        offset,
        order: '-created_at',
      }
      if (statusFilter !== 'all') params.status = statusFilter
      return sdk.client.fetch('/admin/reviews', { query: params })
    },
  })

  const moderate = useMutation({
    mutationFn: (vars: { id: string; status: ReviewStatus; admin_response?: string | null }) =>
      sdk.client.fetch(`/admin/reviews/${vars.id}/status`, {
        method: 'POST',
        body: { status: vars.status, admin_response: vars.admin_response ?? null },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      toast.success('Reseña actualizada')
      setSelected(null)
      setResponse('')
    },
    onError: (err: any) => {
      toast.error(err?.message ?? 'No se pudo actualizar la reseña')
    },
  })

  const openDrawer = (review: Review) => {
    setSelected(review)
    setResponse(review.admin_response ?? '')
  }

  const table = useDataTable({
    data: data?.reviews ?? [],
    columns,
    rowCount: data?.count ?? 0,
    getRowId: (r) => r.id,
    isLoading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
    onRowClick: (_e, row) => openDrawer(row),
  })

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Reseñas</Heading>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Modera las valoraciones de producto antes de publicarlas en la tienda.
          </Text>
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as ReviewStatus | 'all')
            setPagination((p) => ({ ...p, pageIndex: 0 }))
          }}
        >
          <Select.Trigger className="min-w-48">
            <Select.Value placeholder="Filtrar estado" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">Todas</Select.Item>
            {REVIEW_STATUSES.map((s) => (
              <Select.Item key={s} value={s}>
                {STATUS_LABELS[s]}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>

      <DataTable instance={table}>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>

      {!isLoading && (data?.reviews ?? []).length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
          <ChatBubbleLeftRight className="text-ui-fg-muted" />
          <Heading level="h3">Sin reseñas {statusFilter !== 'all' ? 'en este estado' : ''}</Heading>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Las reseñas aparecen aquí cuando los clientes valoran productos en la tienda.
          </Text>
        </div>
      ) : null}

      <Drawer open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Moderar reseña</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex-1 overflow-auto">
            {selected ? (
              <div className="flex flex-col gap-y-5">
                <div className="flex items-center gap-3">
                  {selected.product_thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selected.product_thumbnail}
                      alt=""
                      className="h-12 w-12 rounded object-cover"
                    />
                  ) : null}
                  <div className="flex flex-col">
                    <Text size="small" weight="plus">
                      {selected.product_title ?? selected.product_id}
                    </Text>
                    <Text size="small" className="text-ui-fg-subtle">
                      {selected.name ?? selected.email}
                      {selected.verified_purchase ? ' · compra verificada' : ''}
                    </Text>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Stars value={selected.rating} />
                  <Badge size="2xsmall" color={STATUS_COLOR[selected.status]}>
                    {STATUS_LABELS[selected.status]}
                  </Badge>
                </div>

                {selected.title ? (
                  <Text size="base" weight="plus">
                    {selected.title}
                  </Text>
                ) : null}
                <Text size="small" className="text-ui-fg-subtle whitespace-pre-wrap">
                  {selected.content ?? 'Sin comentario.'}
                </Text>

                <div className="flex flex-col gap-y-2">
                  <Text size="small" weight="plus">
                    Respuesta de la tienda (opcional)
                  </Text>
                  <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Responde públicamente a esta reseña…"
                    rows={3}
                  />
                </div>
              </div>
            ) : null}
          </Drawer.Body>
          <Drawer.Footer>
            <div className="flex w-full items-center justify-between gap-2">
              <Button
                size="small"
                variant="danger"
                disabled={moderate.isPending}
                onClick={() =>
                  selected &&
                  moderate.mutate({
                    id: selected.id,
                    status: 'rejected',
                    admin_response: response || null,
                  })
                }
              >
                <XMark />
                Rechazar
              </Button>
              <Button
                size="small"
                isLoading={moderate.isPending}
                onClick={() =>
                  selected &&
                  moderate.mutate({
                    id: selected.id,
                    status: 'approved',
                    admin_response: response || null,
                  })
                }
              >
                <Check />
                Aprobar y publicar
              </Button>
            </div>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: 'Reseñas',
  icon: StarSolid,
})

export default ReviewsPage
