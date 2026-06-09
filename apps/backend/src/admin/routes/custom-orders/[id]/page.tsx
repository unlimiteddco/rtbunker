import {
  ArrowDownTray,
  ArrowUpTray,
  ArrowUturnLeft,
  CheckCircle,
  Eye,
  XMark,
} from '@medusajs/icons'
import {
  Badge,
  Button,
  Container,
  Heading,
  IconButton,
  Input,
  Select,
  Text,
  Textarea,
  toast,
} from '@medusajs/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { sdk } from '../../../lib/client'
import {
  CUSTOM_ORDER_STATUSES,
  type CustomOrder,
  type CustomOrderStatus,
  MATERIAL_LABELS,
  SHAPE_LABELS,
  STATUS_COLOR,
  STATUS_LABELS,
  formatMoney,
  formatSize,
} from '../../../lib/custom-orders'

interface DetailResponse {
  custom_order: CustomOrder
}

const CustomOrderDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<DetailResponse>({
    queryKey: ['custom-order', id],
    queryFn: () => sdk.client.fetch(`/admin/custom-orders/${id}`),
    enabled: !!id,
  })

  if (isLoading || !data?.custom_order) {
    return (
      <Container>
        <Text>Cargando…</Text>
      </Container>
    )
  }

  const order = data.custom_order

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['custom-order', id] })
    queryClient.invalidateQueries({ queryKey: ['custom-orders'] })
  }

  return (
    <div className="flex flex-col gap-y-3">
      <Header order={order} />

      <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-y-3">
          <ConfigCard order={order} />
          <ProofsCard order={order} onChange={invalidate} />
        </div>
        <div className="flex flex-col gap-y-3">
          <StatusCard order={order} onChange={invalidate} />
          <CustomerCard order={order} />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────────

function Header({ order }: { order: CustomOrder }) {
  return (
    <Container className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-3">
        <IconButton variant="transparent" size="small" asChild>
          <Link to="/custom-orders" aria-label="Volver">
            <ArrowUturnLeft />
          </Link>
        </IconButton>
        <div>
          <div className="flex items-center gap-2">
            <Heading>#{order.id.slice(-8).toUpperCase()}</Heading>
            <Badge size="2xsmall" color={STATUS_COLOR[order.status]}>
              {STATUS_LABELS[order.status]}
            </Badge>
            {order.priority ? (
              <Badge size="2xsmall" color="red">
                ⚡ Prioritario{order.membership_tier ? ` · ${order.membership_tier}` : ''}
              </Badge>
            ) : null}
            {order.paid_with_credits ? (
              <Badge size="2xsmall" color="purple">
                Créditos
              </Badge>
            ) : null}
          </div>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {order.customer_email} ·{' '}
            {new Date(order.created_at).toLocaleString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </div>
      </div>
      <div className="text-right">
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          Total
        </Text>
        <Heading level="h2">{formatMoney(order.total_price)}</Heading>
      </div>
    </Container>
  )
}

// ─────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────

function ConfigCard({ order }: { order: CustomOrder }) {
  const rows: { label: string; value: string }[] = [
    { label: 'Forma', value: SHAPE_LABELS[order.shape] ?? order.shape },
    { label: 'Material', value: MATERIAL_LABELS[order.material] ?? order.material },
    { label: 'Tamaño', value: formatSize(order) },
    { label: 'Unidades', value: `${order.units}` },
    { label: 'Precio unitario', value: formatMoney(order.unit_price) },
    { label: 'Total', value: formatMoney(order.total_price) },
  ]

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Configuración</Heading>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 px-6 py-4">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col">
            <dt>
              <Text size="small" leading="compact" className="text-ui-fg-subtle">
                {r.label}
              </Text>
            </dt>
            <dd>
              <Text size="small" leading="compact" weight="plus">
                {r.value}
              </Text>
            </dd>
          </div>
        ))}
      </dl>

      <div className="px-6 py-4">
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          Archivo del cliente
        </Text>
        {order.design_file_url ? (
          <div className="mt-1 flex flex-col gap-y-2">
            <a
              href={order.design_file_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-ui-fg-interactive hover:underline"
            >
              <Eye />
              <Text size="small" leading="compact" weight="plus">
                {order.design_file_name ?? 'Abrir archivo'}
              </Text>
            </a>
            <div>
              <DownloadButton
                url={order.design_file_url}
                fileName={order.design_file_name}
              />
            </div>
          </div>
        ) : (
          <Text size="small" leading="compact" weight="plus">
            — sin archivo —
          </Text>
        )}
      </div>

      {order.customer_notes ? (
        <div className="px-6 py-4">
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Notas del cliente
          </Text>
          <Text size="small" leading="compact" className="mt-1 whitespace-pre-wrap">
            {order.customer_notes}
          </Text>
        </div>
      ) : null}
    </Container>
  )
}

/**
 * Descarga en 1 clic el archivo del cliente. Intenta fetch → blob → enlace
 * `download` programático (fuerza la descarga en vez de abrir en el navegador).
 * Si el fetch falla (típicamente CORS desde R2/otro origen), cae a
 * `window.open` para que al menos se abra el archivo.
 */
function DownloadButton({ url, fileName }: { url: string; fileName: string | null }) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = fileName ?? 'archivo-cliente'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objectUrl)
    } catch {
      // Fallback CORS: abrir en una pestaña nueva.
      window.open(url, '_blank', 'noopener,noreferrer')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button
      size="small"
      variant="secondary"
      onClick={handleDownload}
      isLoading={isDownloading}
    >
      <ArrowDownTray />
      Descargar
    </Button>
  )
}

// ─────────────────────────────────────────────────────────────────
// Mockups (proofs)
// ─────────────────────────────────────────────────────────────────

const MAX_PROOF_BYTES = 20 * 1024 * 1024 // 20 MB por archivo

function ProofsCard({ order, onChange }: { order: CustomOrder; onChange: () => void }) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])

  // Filtra archivos por límite de peso (20 MB) antes de aceptarlos en el estado.
  const onSelectFiles = (fileList: FileList | null) => {
    const incoming = fileList ? Array.from(fileList) : []
    const accepted: File[] = []
    const rejected: string[] = []

    for (const f of incoming) {
      if (f.size > MAX_PROOF_BYTES) rejected.push(f.name)
      else accepted.push(f)
    }

    if (rejected.length > 0) {
      toast.error(
        `Demasiado pesado (máx. 20 MB): ${rejected.join(', ')}. ${
          rejected.length === 1 ? 'No se subirá.' : 'No se subirán.'
        }`,
      )
    }

    setPendingFiles(accepted)
  }

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
    // No reseteamos el input nativo: si quedan archivos seleccionados, el
    // estado manda; el input se limpia al éxito o al volver a elegir.
  }

  const uploadAndAttach = useMutation({
    mutationFn: async () => {
      if (pendingFiles.length === 0) throw new Error('Elige al menos un archivo.')

      // Defensa extra: re-validamos el peso justo antes de subir.
      const tooBig = pendingFiles.filter((f) => f.size > MAX_PROOF_BYTES)
      if (tooBig.length > 0) {
        throw new Error(
          `Archivos demasiado pesados (máx. 20 MB): ${tooBig
            .map((f) => f.name)
            .join(', ')}.`,
        )
      }

      // 1. Sube TODAS las imágenes en una sola llamada vía SDK (gestiona el
      //    multipart/form-data internamente y devuelve { files: [...] }).
      const uploadRes = await sdk.admin.upload.create({ files: pendingFiles })
      const uploaded = uploadRes.files ?? []
      if (uploaded.length === 0) throw new Error('La subida no devolvió archivos.')

      const proofs = uploaded.map((file, i) => {
        if (!file?.url) throw new Error('La subida no devolvió URL.')
        return {
          url: file.url,
          file_name: pendingFiles[i]?.name ?? null,
        }
      })

      // 2. Adjunta TODOS los proofs al CustomOrder en un único POST batch
      //    (emite un solo evento → un solo email al cliente con el lote).
      return sdk.client.fetch(`/admin/custom-orders/${order.id}/proofs`, {
        method: 'POST',
        body: {
          proofs,
          admin_notes: adminNotes || null,
        },
      })
    },
    onSuccess: (_data, _vars) => {
      toast.success(
        pendingFiles.length === 1
          ? 'Mockup subido y cliente notificable.'
          : `${pendingFiles.length} mockups subidos y cliente notificable.`,
      )
      setPendingFiles([])
      setAdminNotes('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      queryClient.invalidateQueries({ queryKey: ['custom-order', order.id] })
      onChange()
    },
    onError: (err: any) => {
      toast.error(err?.message ?? 'No se pudieron subir los mockups.')
    },
  })

  const proofs = order.proofs ?? []

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Mockups enviados</Heading>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {proofs.length === 0
              ? 'Sube el primer mockup para enviárselo al cliente.'
              : `${proofs.length} versión${proofs.length === 1 ? '' : 'es'} subida${proofs.length === 1 ? '' : 's'}.`}
          </Text>
        </div>
      </div>

      {proofs.length > 0 ? (
        <ul className="divide-y">
          {[...proofs].reverse().map((p) => (
            <li key={p.id} className="flex items-start gap-4 px-6 py-4">
              <div className="bg-ui-bg-subtle shadow-elevation-card-rest size-20 shrink-0 overflow-hidden rounded-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`v${p.version}`} className="size-full object-cover" />
              </div>
              <div className="flex flex-1 flex-col gap-y-1">
                <div className="flex items-center gap-2">
                  <Badge size="2xsmall" color="blue">
                    v{p.version}
                  </Badge>
                  <Text size="small" leading="compact" className="text-ui-fg-subtle">
                    {new Date(p.sent_at).toLocaleString('es-ES')}
                  </Text>
                  {p.customer_response === 'approved' ? (
                    <Badge size="2xsmall" color="green">
                      Aprobado
                    </Badge>
                  ) : p.customer_response === 'changes_requested' ? (
                    <Badge size="2xsmall" color="orange">
                      Cambios pedidos
                    </Badge>
                  ) : null}
                </div>
                <Text size="small" leading="compact" weight="plus">
                  {p.file_name ?? 'mockup'}
                </Text>
                {p.admin_notes ? (
                  <Text
                    size="small"
                    leading="compact"
                    className="text-ui-fg-subtle whitespace-pre-wrap"
                  >
                    {p.admin_notes}
                  </Text>
                ) : null}
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ui-fg-interactive text-xs hover:underline"
                >
                  Abrir en nueva pestaña →
                </a>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-col gap-y-3 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Subir nueva versión
        </Text>
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          Puedes seleccionar varias imágenes a la vez (máx. 20 MB cada una).
        </Text>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,application/pdf"
          onChange={(e) => onSelectFiles(e.target.files)}
          className="text-ui-fg-subtle text-sm"
        />

        {pendingFiles.length > 0 ? (
          <ul className="flex flex-col gap-y-1">
            {pendingFiles.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center justify-between gap-2 rounded-md bg-ui-bg-subtle px-3 py-1.5"
              >
                <Text size="small" leading="compact" className="truncate">
                  {f.name}{' '}
                  <span className="text-ui-fg-muted">
                    ({(f.size / (1024 * 1024)).toFixed(1)} MB)
                  </span>
                </Text>
                <IconButton
                  size="small"
                  variant="transparent"
                  onClick={() => removePendingFile(i)}
                  aria-label={`Quitar ${f.name}`}
                  disabled={uploadAndAttach.isPending}
                >
                  <XMark />
                </IconButton>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-col gap-y-1">
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Notas del mockup (se envían al cliente en el email)
          </Text>
          <Textarea
            placeholder="Ej: «Ajustado el grosor del borde según tu feedback» (opcional)"
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={3}
          />
        </div>
        <div className="flex justify-end">
          <Button
            size="small"
            onClick={() => uploadAndAttach.mutate()}
            disabled={pendingFiles.length === 0 || uploadAndAttach.isPending}
            isLoading={uploadAndAttach.isPending}
          >
            <ArrowUpTray />
            {pendingFiles.length > 1
              ? `Subir ${pendingFiles.length} mockups`
              : 'Subir mockup'}
          </Button>
        </div>
      </div>
    </Container>
  )
}

// ─────────────────────────────────────────────────────────────────
// Status changer + admin notes
// ─────────────────────────────────────────────────────────────────

function StatusCard({ order, onChange }: { order: CustomOrder; onChange: () => void }) {
  const [status, setStatus] = useState<CustomOrderStatus>(order.status)
  const [notes, setNotes] = useState(order.admin_notes ?? '')
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number ?? '')
  const [trackingUrl, setTrackingUrl] = useState(order.tracking_url ?? '')
  const [shippingCarrier, setShippingCarrier] = useState(order.shipping_carrier ?? '')

  const showTracking = status === 'shipped' || status === 'delivered'

  const mutate = useMutation({
    mutationFn: () =>
      sdk.client.fetch(`/admin/custom-orders/${order.id}/status`, {
        method: 'POST',
        body: {
          status,
          admin_notes: notes || null,
          ...(showTracking
            ? {
                tracking_number: trackingNumber || null,
                tracking_url: trackingUrl || null,
                shipping_carrier: shippingCarrier || null,
              }
            : {}),
        },
      }),
    onSuccess: () => {
      toast.success('Estado actualizado. Cliente notificado por email.')
      onChange()
    },
    onError: (err: any) => toast.error(err?.message ?? 'No se pudo actualizar.'),
  })

  const isDirty =
    status !== order.status ||
    notes !== (order.admin_notes ?? '') ||
    (showTracking &&
      (trackingNumber !== (order.tracking_number ?? '') ||
        trackingUrl !== (order.tracking_url ?? '') ||
        shippingCarrier !== (order.shipping_carrier ?? '')))

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Estado del pedido</Heading>
      </div>
      <div className="flex flex-col gap-y-3 px-6 py-4">
        <div className="flex flex-col gap-y-1">
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Estado
          </Text>
          <Select value={status} onValueChange={(v) => setStatus(v as CustomOrderStatus)}>
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              {CUSTOM_ORDER_STATUSES.map((s) => (
                <Select.Item key={s} value={s}>
                  {STATUS_LABELS[s]}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>

        {showTracking ? (
          <div className="flex flex-col gap-y-3 rounded-md border border-dashed border-ui-border-base p-3">
            <Text size="small" leading="compact" weight="plus">
              Envío
            </Text>
            <div className="flex flex-col gap-y-1">
              <Text size="small" leading="compact" className="text-ui-fg-subtle">
                Transportista
              </Text>
              <Input
                value={shippingCarrier}
                onChange={(e) => setShippingCarrier(e.target.value)}
                placeholder="GLS, SEUR, Correos…"
              />
            </div>
            <div className="flex flex-col gap-y-1">
              <Text size="small" leading="compact" className="text-ui-fg-subtle">
                Nº de seguimiento
              </Text>
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Ej: 1234567890"
              />
            </div>
            <div className="flex flex-col gap-y-1">
              <Text size="small" leading="compact" className="text-ui-fg-subtle">
                URL de seguimiento (opcional)
              </Text>
              <Input
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-y-1">
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Notas internas
          </Text>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Apuntes solo visibles para el equipo…"
          />
        </div>

        <div className="flex justify-end">
          <Button
            size="small"
            onClick={() => mutate.mutate()}
            disabled={!isDirty || mutate.isPending}
            isLoading={mutate.isPending}
          >
            <CheckCircle />
            Guardar cambios
          </Button>
        </div>
      </div>
    </Container>
  )
}

// ─────────────────────────────────────────────────────────────────
// Customer info
// ─────────────────────────────────────────────────────────────────

function CustomerCard({ order }: { order: CustomOrder }) {
  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Cliente</Heading>
      </div>
      <dl className="flex flex-col gap-y-3 px-6 py-4">
        <Row label="Nombre" value={order.customer_name ?? '—'} />
        <Row label="Email" value={order.customer_email} mono />
        <Row label="Teléfono" value={order.customer_phone ?? '—'} mono />
      </dl>
    </Container>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col">
      <dt>
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          {label}
        </Text>
      </dt>
      <dd>
        <Text
          size="small"
          leading="compact"
          weight="plus"
          className={mono ? 'font-mono' : ''}
        >
          {value}
        </Text>
      </dd>
    </div>
  )
}

export default CustomOrderDetailPage
