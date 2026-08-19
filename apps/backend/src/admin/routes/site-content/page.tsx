import { defineRouteConfig } from '@medusajs/admin-sdk'
import { ArrowUpTray, DocumentText, PencilSquare, Photo, Plus, Trash } from '@medusajs/icons'
import {
  Badge,
  Button,
  Container,
  DataTable,
  DataTablePaginationState,
  createDataTableColumnHelper,
  Drawer,
  FocusModal,
  Heading,
  IconButton,
  Input,
  Label,
  Select,
  Switch,
  Tabs,
  Text,
  Textarea,
  toast,
  useDataTable,
} from '@medusajs/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

import { sdk } from '../../lib/client'

// ─────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────

interface ServiceItem {
  id: string
  eyebrow: string | null
  title: string
  description: string | null
  bullets: string[] | null
  cta_label: string | null
  cta_href: string | null
  icon: string | null
  image: string | null
  featured: boolean
  rank: number
  published: boolean
  created_at: string
  updated_at: string
}

interface ProcessStep {
  id: string
  title: string
  description: string | null
  badge: string | null
  icon: string | null
  rank: number
  published: boolean
  created_at: string
  updated_at: string
}

interface FeaturedCategory {
  id: string
  category_handle: string
  label: string | null
  image: string | null
  rank: number
  published: boolean
  created_at: string
  updated_at: string
}

interface ServiceItemsResponse {
  service_items: ServiceItem[]
  count: number
}
interface ProcessStepsResponse {
  process_steps: ProcessStep[]
  count: number
}
interface FeaturedCategoriesResponse {
  featured_categories: FeaturedCategory[]
  count: number
}

const MAX_IMAGE_BYTES = 20 * 1024 * 1024 // 20 MB

// Iconos de lucide-react que el storefront sabe pintar. Si añades uno nuevo
// aquí, añade también el mapeo string → componente en el storefront.
const SERVICE_ICONS = [
  'Layers',
  'Paintbrush2',
  'Sparkles',
  'Lightbulb',
  'Type',
  'Car',
  'Shield',
  'Wrench',
] as const

const PROCESS_ICONS = [
  'MessageSquare',
  'CalendarCheck',
  'Hammer',
  'Sparkles',
  'Truck',
  'ShieldCheck',
] as const

// ─────────────────────────────────────────────────────────────────
// Uploader de UNA imagen (subida a R2/local vía sdk.admin.upload.create)
// ─────────────────────────────────────────────────────────────────

function SingleImageUploader({
  value,
  onChange,
  disabled,
  label,
  hint,
}: {
  value: string | null
  onChange: (next: string | null) => void
  disabled?: boolean
  label: string
  hint?: string
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFiles = async (fileList: FileList | null) => {
    const file = fileList?.[0]
    if (!file) return

    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(`Demasiado pesado (máx. 20 MB): ${file.name}.`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setUploading(true)
    try {
      const res = await sdk.admin.upload.create({ files: [file] })
      const url = (res.files ?? []).map((f) => f?.url).filter(Boolean)[0]
      if (!url) throw new Error('La subida no devolvió URL.')
      onChange(url)
      toast.success('Imagen subida.')
    } catch (err: any) {
      toast.error(err?.message ?? 'No se pudo subir la imagen.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-y-2">
      <Label>{label}</Label>
      {hint ? (
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          {hint}
        </Text>
      ) : null}

      {value ? (
        <div className="border-ui-border-base flex items-center gap-3 rounded-md border p-2">
          <div className="bg-ui-bg-subtle size-20 shrink-0 overflow-hidden rounded">
            <img src={value} alt="" className="size-full object-cover" />
          </div>
          <IconButton
            size="small"
            variant="transparent"
            type="button"
            disabled={disabled}
            onClick={() => onChange(null)}
            aria-label="Quitar imagen"
          >
            <Trash />
          </IconButton>
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
        disabled={disabled || uploading}
      />
      <div>
        <Button
          size="small"
          variant="secondary"
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          isLoading={uploading}
        >
          <ArrowUpTray />
          {value ? 'Reemplazar imagen' : 'Subir imagen'}
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Bloques reutilizables
// ─────────────────────────────────────────────────────────────────

function PublishedField({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="border-ui-border-base flex items-center justify-between rounded-md border px-3 py-2.5">
      <div className="flex flex-col">
        <Text size="small" leading="compact" weight="plus">
          Publicado
        </Text>
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          Solo lo publicado aparece en la web.
        </Text>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  )
}

function IconSelect({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  options: readonly string[]
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-y-2">
      <Label>Icono</Label>
      <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
        <Select.Trigger>
          <Select.Value placeholder="Selecciona un icono" />
        </Select.Trigger>
        <Select.Content>
          {options.map((i) => (
            <Select.Item key={i} value={i}>
              {i}
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
    </div>
  )
}

function RankField({
  value,
  onChange,
  disabled,
}: {
  value: number
  onChange: (v: number) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-y-2">
      <Label>Orden (rank)</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        disabled={disabled}
      />
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <DocumentText className="text-ui-fg-muted" />
      <Text size="small" leading="compact" className="text-ui-fg-subtle">
        {text}
      </Text>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// 1 · SERVICIOS
// ═════════════════════════════════════════════════════════════════

interface ServiceForm {
  eyebrow: string
  title: string
  description: string
  bullets: string
  cta_label: string
  cta_href: string
  icon: string
  image: string | null
  featured: boolean
  rank: number
  published: boolean
}

const EMPTY_SERVICE_FORM: ServiceForm = {
  eyebrow: '',
  title: '',
  description: '',
  bullets: '',
  cta_label: '',
  cta_href: '',
  icon: 'Layers',
  image: null,
  featured: false,
  rank: 0,
  published: true,
}

function serviceToForm(s: ServiceItem): ServiceForm {
  return {
    eyebrow: s.eyebrow ?? '',
    title: s.title,
    description: s.description ?? '',
    bullets: Array.isArray(s.bullets) ? s.bullets.join('\n') : '',
    cta_label: s.cta_label ?? '',
    cta_href: s.cta_href ?? '',
    icon: s.icon ?? '',
    image: s.image ?? null,
    featured: !!s.featured,
    rank: s.rank ?? 0,
    published: s.published,
  }
}

function serviceFormToBody(f: ServiceForm) {
  const bullets = f.bullets
    .split('\n')
    .map((b) => b.trim())
    .filter(Boolean)

  return {
    eyebrow: f.eyebrow.trim() || null,
    title: f.title.trim(),
    description: f.description.trim() || null,
    bullets,
    cta_label: f.cta_label.trim() || null,
    cta_href: f.cta_href.trim() || null,
    icon: f.icon.trim() || null,
    image: f.image,
    featured: f.featured,
    rank: f.rank,
    published: f.published,
  }
}

function ServiceFormFields({
  form,
  setForm,
  disabled,
}: {
  form: ServiceForm
  setForm: (next: ServiceForm) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex flex-col gap-y-2">
        <Label>Título *</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Ej: Car Wrapping"
          disabled={disabled}
        />
      </div>

      <div className="flex flex-col gap-y-2">
        <Label>Línea superior (eyebrow)</Label>
        <Input
          value={form.eyebrow}
          onChange={(e) => setForm({ ...form, eyebrow: e.target.value })}
          placeholder="Ej: Superficial · Full Wrap"
          disabled={disabled}
        />
      </div>

      <div className="flex flex-col gap-y-2">
        <Label>Descripción</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Explica el servicio en dos o tres líneas…"
          rows={3}
          disabled={disabled}
        />
      </div>

      <div className="flex flex-col gap-y-2">
        <Label>Puntos (uno por línea)</Label>
        <Textarea
          value={form.bullets}
          onChange={(e) => setForm({ ...form, bullets: e.target.value })}
          placeholder={'Materiales 3M / Hexis / KPMF\nGarantía 2 años\nDesmontaje incluido'}
          rows={4}
          disabled={disabled}
        />
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          Cada línea es un punto de la lista de la tarjeta.
        </Text>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-y-2">
          <Label>Texto del botón</Label>
          <Input
            value={form.cta_label}
            onChange={(e) => setForm({ ...form, cta_label: e.target.value })}
            placeholder="Ej: Solicitar presupuesto · Gratis"
            disabled={disabled}
          />
        </div>
        <div className="flex flex-col gap-y-2">
          <Label>Enlace del botón</Label>
          <Input
            value={form.cta_href}
            onChange={(e) => setForm({ ...form, cta_href: e.target.value })}
            placeholder="Ej: /contacto"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <IconSelect
          value={form.icon}
          onChange={(v) => setForm({ ...form, icon: v })}
          options={SERVICE_ICONS}
          disabled={disabled}
        />
        <RankField
          value={form.rank}
          onChange={(v) => setForm({ ...form, rank: v })}
          disabled={disabled}
        />
      </div>

      <div className="border-ui-border-base flex items-center justify-between rounded-md border px-3 py-2.5">
        <div className="flex flex-col">
          <Text size="small" leading="compact" weight="plus">
            Tarjeta destacada
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Se pinta con fondo oscuro para resaltar sobre las demás.
          </Text>
        </div>
        <Switch
          checked={form.featured}
          onCheckedChange={(v) => setForm({ ...form, featured: v })}
          disabled={disabled}
        />
      </div>

      <PublishedField
        checked={form.published}
        onChange={(v) => setForm({ ...form, published: v })}
        disabled={disabled}
      />

      <SingleImageUploader
        label="Imagen (opcional)"
        hint="Foto de apoyo para la tarjeta. Si la dejas vacía se usa solo el icono."
        value={form.image}
        onChange={(image) => setForm({ ...form, image })}
        disabled={disabled}
      />
    </div>
  )
}

const serviceColumnHelper = createDataTableColumnHelper<ServiceItem>()

function ServicesSection() {
  const queryClient = useQueryClient()
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<ServiceForm>(EMPTY_SERVICE_FORM)
  const [editing, setEditing] = useState<ServiceItem | null>(null)
  const [editForm, setEditForm] = useState<ServiceForm>(EMPTY_SERVICE_FORM)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const limit = pagination.pageSize
  const offset = pagination.pageIndex * limit

  const { data, isLoading } = useQuery<ServiceItemsResponse>({
    queryKey: ['site-content', 'service-items', limit, offset],
    queryFn: () => sdk.client.fetch('/admin/service-items', { query: { limit, offset } }),
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['site-content', 'service-items'] })

  const create = useMutation({
    mutationFn: () =>
      sdk.client.fetch('/admin/service-items', {
        method: 'POST',
        body: serviceFormToBody(createForm),
      }),
    onSuccess: () => {
      invalidate()
      toast.success('Servicio creado.')
      setCreateForm(EMPTY_SERVICE_FORM)
      setCreateOpen(false)
    },
    onError: (err: any) => toast.error(err?.message ?? 'No se pudo crear el servicio.'),
  })

  const update = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error('Sin servicio seleccionado.')
      return sdk.client.fetch(`/admin/service-items/${editing.id}`, {
        method: 'POST',
        body: serviceFormToBody(editForm),
      })
    },
    onSuccess: () => {
      invalidate()
      toast.success('Servicio actualizado.')
      setDrawerOpen(false)
    },
    onError: (err: any) => toast.error(err?.message ?? 'No se pudo actualizar el servicio.'),
  })

  const remove = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/service-items/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidate()
      toast.success('Servicio borrado.')
    },
    onError: (err: any) => toast.error(err?.message ?? 'No se pudo borrar el servicio.'),
  })

  useEffect(() => {
    if (editing) setEditForm(serviceToForm(editing))
  }, [editing])

  const openEdit = (item: ServiceItem) => {
    setEditing(item)
    setDrawerOpen(true)
  }

  const columns = [
    serviceColumnHelper.accessor('title', {
      header: 'Servicio',
      cell: ({ row }) => {
        const s = row.original
        return (
          <div className="flex items-center gap-2">
            {s.image ? (
              <img src={s.image} alt="" className="h-9 w-9 shrink-0 rounded object-cover" />
            ) : (
              <div className="bg-ui-bg-component flex h-9 w-9 shrink-0 items-center justify-center rounded">
                <Photo className="text-ui-fg-muted" />
              </div>
            )}
            <div className="flex flex-col">
              <Text size="small" leading="compact" weight="plus" className="line-clamp-1">
                {s.title}
              </Text>
              {s.eyebrow ? (
                <Text
                  size="small"
                  leading="compact"
                  className="text-ui-fg-subtle line-clamp-1"
                >
                  {s.eyebrow}
                </Text>
              ) : null}
            </div>
          </div>
        )
      },
    }),
    serviceColumnHelper.accessor('bullets', {
      header: 'Puntos',
      cell: ({ getValue }) => (
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          {Array.isArray(getValue()) ? getValue()!.length : 0}
        </Text>
      ),
    }),
    serviceColumnHelper.accessor('featured', {
      header: 'Destacada',
      cell: ({ getValue }) =>
        getValue() ? (
          <Badge size="2xsmall" color="orange">
            Destacada
          </Badge>
        ) : (
          <Text size="small" leading="compact" className="text-ui-fg-muted">
            —
          </Text>
        ),
    }),
    serviceColumnHelper.accessor('rank', {
      header: 'Orden',
      cell: ({ getValue }) => (
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          {getValue()}
        </Text>
      ),
    }),
    serviceColumnHelper.accessor('published', {
      header: 'Estado',
      cell: ({ getValue }) => (
        <Badge size="2xsmall" color={getValue() ? 'green' : 'grey'}>
          {getValue() ? 'Publicado' : 'Borrador'}
        </Badge>
      ),
    }),
    serviceColumnHelper.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            size="small"
            variant="transparent"
            onClick={(e) => {
              e.stopPropagation()
              openEdit(row.original)
            }}
            aria-label="Editar"
          >
            <PencilSquare />
          </IconButton>
          <IconButton
            size="small"
            variant="transparent"
            onClick={(e) => {
              e.stopPropagation()
              if (window.confirm(`¿Borrar «${row.original.title}»?`)) {
                remove.mutate(row.original.id)
              }
            }}
            disabled={remove.isPending}
            aria-label="Borrar"
          >
            <Trash />
          </IconButton>
        </div>
      ),
    }),
  ]

  const table = useDataTable({
    data: data?.service_items ?? [],
    columns,
    rowCount: data?.count ?? 0,
    getRowId: (s) => s.id,
    isLoading,
    pagination: { state: pagination, onPaginationChange: setPagination },
    onRowClick: (_e, row) => openEdit(row),
  })

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Text size="small" leading="compact" weight="plus">
            Tarjetas de la página de Servicios
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Cada tarjeta es un servicio que ofrecéis. El orden lo marca el campo «Orden».
          </Text>
        </div>
        <FocusModal
          open={createOpen}
          onOpenChange={(o) => {
            setCreateOpen(o)
            if (!o) setCreateForm(EMPTY_SERVICE_FORM)
          }}
        >
          <FocusModal.Trigger asChild>
            <Button size="small">
              <Plus />
              Crear servicio
            </Button>
          </FocusModal.Trigger>
          <FocusModal.Content>
            <FocusModal.Header>
              <div className="flex items-center justify-end gap-x-2">
                <FocusModal.Close asChild>
                  <Button size="small" variant="secondary" disabled={create.isPending}>
                    Cancelar
                  </Button>
                </FocusModal.Close>
                <Button
                  size="small"
                  onClick={() => {
                    if (!createForm.title.trim()) {
                      toast.error('El título es obligatorio.')
                      return
                    }
                    create.mutate()
                  }}
                  disabled={create.isPending}
                  isLoading={create.isPending}
                >
                  Guardar
                </Button>
              </div>
            </FocusModal.Header>
            <FocusModal.Body className="flex-1 overflow-auto">
              <div className="mx-auto flex w-full max-w-2xl flex-col gap-y-4 px-2 py-6">
                <Heading level="h2">Nuevo servicio</Heading>
                <ServiceFormFields
                  form={createForm}
                  setForm={setCreateForm}
                  disabled={create.isPending}
                />
              </div>
            </FocusModal.Body>
          </FocusModal.Content>
        </FocusModal>
      </div>

      <DataTable instance={table}>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>

      {!isLoading && (data?.service_items ?? []).length === 0 ? (
        <EmptyState text="Aún no hay servicios. Crea el primero con «Crear servicio»." />
      ) : null}

      <Drawer
        open={drawerOpen}
        onOpenChange={(o) => {
          setDrawerOpen(o)
          if (!o) setEditing(null)
        }}
      >
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Editar servicio</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex-1 overflow-auto">
            {editing ? (
              <ServiceFormFields
                form={editForm}
                setForm={setEditForm}
                disabled={update.isPending}
              />
            ) : null}
          </Drawer.Body>
          <Drawer.Footer>
            <div className="flex items-center justify-end gap-x-2">
              <Drawer.Close asChild>
                <Button size="small" variant="secondary" disabled={update.isPending}>
                  Cancelar
                </Button>
              </Drawer.Close>
              <Button
                size="small"
                onClick={() => {
                  if (!editForm.title.trim()) {
                    toast.error('El título es obligatorio.')
                    return
                  }
                  update.mutate()
                }}
                disabled={update.isPending}
                isLoading={update.isPending}
              >
                Guardar cambios
              </Button>
            </div>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// 2 · PROCESO
// ═════════════════════════════════════════════════════════════════

interface StepForm {
  title: string
  description: string
  badge: string
  icon: string
  rank: number
  published: boolean
}

const EMPTY_STEP_FORM: StepForm = {
  title: '',
  description: '',
  badge: '',
  icon: 'MessageSquare',
  rank: 0,
  published: true,
}

function stepToForm(s: ProcessStep): StepForm {
  return {
    title: s.title,
    description: s.description ?? '',
    badge: s.badge ?? '',
    icon: s.icon ?? '',
    rank: s.rank ?? 0,
    published: s.published,
  }
}

function stepFormToBody(f: StepForm) {
  return {
    title: f.title.trim(),
    description: f.description.trim() || null,
    badge: f.badge.trim() || null,
    icon: f.icon.trim() || null,
    rank: f.rank,
    published: f.published,
  }
}

function StepFormFields({
  form,
  setForm,
  disabled,
}: {
  form: StepForm
  setForm: (next: StepForm) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex flex-col gap-y-2">
        <Label>Título *</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Ej: Briefing"
          disabled={disabled}
        />
      </div>

      <div className="flex flex-col gap-y-2">
        <Label>Descripción</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Qué pasa en este paso…"
          rows={3}
          disabled={disabled}
        />
      </div>

      <div className="flex flex-col gap-y-2">
        <Label>Píldora (badge)</Label>
        <Input
          value={form.badge}
          onChange={(e) => setForm({ ...form, badge: e.target.value })}
          placeholder="Ej: < 24 h · Sin compromiso · Garantía 2 años"
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <IconSelect
          value={form.icon}
          onChange={(v) => setForm({ ...form, icon: v })}
          options={PROCESS_ICONS}
          disabled={disabled}
        />
        <RankField
          value={form.rank}
          onChange={(v) => setForm({ ...form, rank: v })}
          disabled={disabled}
        />
      </div>

      <PublishedField
        checked={form.published}
        onChange={(v) => setForm({ ...form, published: v })}
        disabled={disabled}
      />
    </div>
  )
}

const stepColumnHelper = createDataTableColumnHelper<ProcessStep>()

function ProcessSection() {
  const queryClient = useQueryClient()
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<StepForm>(EMPTY_STEP_FORM)
  const [editing, setEditing] = useState<ProcessStep | null>(null)
  const [editForm, setEditForm] = useState<StepForm>(EMPTY_STEP_FORM)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const limit = pagination.pageSize
  const offset = pagination.pageIndex * limit

  const { data, isLoading } = useQuery<ProcessStepsResponse>({
    queryKey: ['site-content', 'process-steps', limit, offset],
    queryFn: () => sdk.client.fetch('/admin/process-steps', { query: { limit, offset } }),
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['site-content', 'process-steps'] })

  const create = useMutation({
    mutationFn: () =>
      sdk.client.fetch('/admin/process-steps', {
        method: 'POST',
        body: stepFormToBody(createForm),
      }),
    onSuccess: () => {
      invalidate()
      toast.success('Paso creado.')
      setCreateForm(EMPTY_STEP_FORM)
      setCreateOpen(false)
    },
    onError: (err: any) => toast.error(err?.message ?? 'No se pudo crear el paso.'),
  })

  const update = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error('Sin paso seleccionado.')
      return sdk.client.fetch(`/admin/process-steps/${editing.id}`, {
        method: 'POST',
        body: stepFormToBody(editForm),
      })
    },
    onSuccess: () => {
      invalidate()
      toast.success('Paso actualizado.')
      setDrawerOpen(false)
    },
    onError: (err: any) => toast.error(err?.message ?? 'No se pudo actualizar el paso.'),
  })

  const remove = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/process-steps/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidate()
      toast.success('Paso borrado.')
    },
    onError: (err: any) => toast.error(err?.message ?? 'No se pudo borrar el paso.'),
  })

  useEffect(() => {
    if (editing) setEditForm(stepToForm(editing))
  }, [editing])

  const openEdit = (item: ProcessStep) => {
    setEditing(item)
    setDrawerOpen(true)
  }

  const columns = [
    stepColumnHelper.accessor('title', {
      header: 'Paso',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <Text size="small" leading="compact" weight="plus" className="line-clamp-1">
            {row.original.title}
          </Text>
          {row.original.description ? (
            <Text size="small" leading="compact" className="text-ui-fg-subtle line-clamp-1">
              {row.original.description}
            </Text>
          ) : null}
        </div>
      ),
    }),
    stepColumnHelper.accessor('badge', {
      header: 'Píldora',
      cell: ({ getValue }) =>
        getValue() ? (
          <Badge size="2xsmall">{getValue()}</Badge>
        ) : (
          <Text size="small" leading="compact" className="text-ui-fg-muted">
            —
          </Text>
        ),
    }),
    stepColumnHelper.accessor('rank', {
      header: 'Orden',
      cell: ({ getValue }) => (
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          {getValue()}
        </Text>
      ),
    }),
    stepColumnHelper.accessor('published', {
      header: 'Estado',
      cell: ({ getValue }) => (
        <Badge size="2xsmall" color={getValue() ? 'green' : 'grey'}>
          {getValue() ? 'Publicado' : 'Borrador'}
        </Badge>
      ),
    }),
    stepColumnHelper.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            size="small"
            variant="transparent"
            onClick={(e) => {
              e.stopPropagation()
              openEdit(row.original)
            }}
            aria-label="Editar"
          >
            <PencilSquare />
          </IconButton>
          <IconButton
            size="small"
            variant="transparent"
            onClick={(e) => {
              e.stopPropagation()
              if (window.confirm(`¿Borrar «${row.original.title}»?`)) {
                remove.mutate(row.original.id)
              }
            }}
            disabled={remove.isPending}
            aria-label="Borrar"
          >
            <Trash />
          </IconButton>
        </div>
      ),
    }),
  ]

  const table = useDataTable({
    data: data?.process_steps ?? [],
    columns,
    rowCount: data?.count ?? 0,
    getRowId: (s) => s.id,
    isLoading,
    pagination: { state: pagination, onPaginationChange: setPagination },
    onRowClick: (_e, row) => openEdit(row),
  })

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Text size="small" leading="compact" weight="plus">
            Línea del tiempo «Cómo trabajamos»
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Los pasos del proceso que se muestran en la página de Servicios.
          </Text>
        </div>
        <FocusModal
          open={createOpen}
          onOpenChange={(o) => {
            setCreateOpen(o)
            if (!o) setCreateForm(EMPTY_STEP_FORM)
          }}
        >
          <FocusModal.Trigger asChild>
            <Button size="small">
              <Plus />
              Crear paso
            </Button>
          </FocusModal.Trigger>
          <FocusModal.Content>
            <FocusModal.Header>
              <div className="flex items-center justify-end gap-x-2">
                <FocusModal.Close asChild>
                  <Button size="small" variant="secondary" disabled={create.isPending}>
                    Cancelar
                  </Button>
                </FocusModal.Close>
                <Button
                  size="small"
                  onClick={() => {
                    if (!createForm.title.trim()) {
                      toast.error('El título es obligatorio.')
                      return
                    }
                    create.mutate()
                  }}
                  disabled={create.isPending}
                  isLoading={create.isPending}
                >
                  Guardar
                </Button>
              </div>
            </FocusModal.Header>
            <FocusModal.Body className="flex-1 overflow-auto">
              <div className="mx-auto flex w-full max-w-2xl flex-col gap-y-4 px-2 py-6">
                <Heading level="h2">Nuevo paso del proceso</Heading>
                <StepFormFields
                  form={createForm}
                  setForm={setCreateForm}
                  disabled={create.isPending}
                />
              </div>
            </FocusModal.Body>
          </FocusModal.Content>
        </FocusModal>
      </div>

      <DataTable instance={table}>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>

      {!isLoading && (data?.process_steps ?? []).length === 0 ? (
        <EmptyState text="Aún no hay pasos. Crea el primero con «Crear paso»." />
      ) : null}

      <Drawer
        open={drawerOpen}
        onOpenChange={(o) => {
          setDrawerOpen(o)
          if (!o) setEditing(null)
        }}
      >
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Editar paso</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex-1 overflow-auto">
            {editing ? (
              <StepFormFields
                form={editForm}
                setForm={setEditForm}
                disabled={update.isPending}
              />
            ) : null}
          </Drawer.Body>
          <Drawer.Footer>
            <div className="flex items-center justify-end gap-x-2">
              <Drawer.Close asChild>
                <Button size="small" variant="secondary" disabled={update.isPending}>
                  Cancelar
                </Button>
              </Drawer.Close>
              <Button
                size="small"
                onClick={() => {
                  if (!editForm.title.trim()) {
                    toast.error('El título es obligatorio.')
                    return
                  }
                  update.mutate()
                }}
                disabled={update.isPending}
                isLoading={update.isPending}
              >
                Guardar cambios
              </Button>
            </div>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// 3 · SHOP STICKERS (categorías destacadas de la home)
// ═════════════════════════════════════════════════════════════════

interface CategoryForm {
  category_handle: string
  label: string
  image: string | null
  rank: number
  published: boolean
}

const EMPTY_CATEGORY_FORM: CategoryForm = {
  category_handle: '',
  label: '',
  image: null,
  rank: 0,
  published: true,
}

function categoryToForm(c: FeaturedCategory): CategoryForm {
  return {
    category_handle: c.category_handle,
    label: c.label ?? '',
    image: c.image ?? null,
    rank: c.rank ?? 0,
    published: c.published,
  }
}

function categoryFormToBody(f: CategoryForm) {
  return {
    category_handle: f.category_handle.trim(),
    label: f.label.trim() || null,
    image: f.image,
    rank: f.rank,
    published: f.published,
  }
}

interface AdminCategoryOption {
  id: string
  name: string
  handle: string
}

function CategoryFormFields({
  form,
  setForm,
  options,
  disabled,
}: {
  form: CategoryForm
  setForm: (next: CategoryForm) => void
  options: AdminCategoryOption[]
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex flex-col gap-y-2">
        <Label>Categoría *</Label>
        {options.length > 0 ? (
          <Select
            value={form.category_handle || undefined}
            onValueChange={(v) => setForm({ ...form, category_handle: v })}
            disabled={disabled}
          >
            <Select.Trigger>
              <Select.Value placeholder="Selecciona una categoría" />
            </Select.Trigger>
            <Select.Content>
              {options.map((c) => (
                <Select.Item key={c.id} value={c.handle}>
                  {c.name} ({c.handle})
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        ) : (
          <Input
            value={form.category_handle}
            onChange={(e) => setForm({ ...form, category_handle: e.target.value })}
            placeholder="handle de la categoría, ej: pegatinas-economicas"
            disabled={disabled}
          />
        )}
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          Es la categoría de productos que enlaza esta tarjeta de la home.
        </Text>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-y-2">
          <Label>Título a mostrar</Label>
          <Input
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Vacío = nombre real de la categoría"
            disabled={disabled}
          />
        </div>
        <RankField
          value={form.rank}
          onChange={(v) => setForm({ ...form, rank: v })}
          disabled={disabled}
        />
      </div>

      <PublishedField
        checked={form.published}
        onChange={(v) => setForm({ ...form, published: v })}
        disabled={disabled}
      />

      <SingleImageUploader
        label="Foto de la tarjeta"
        hint="Si la dejas vacía, la web usa la foto del primer producto de la categoría."
        value={form.image}
        onChange={(image) => setForm({ ...form, image })}
        disabled={disabled}
      />
    </div>
  )
}

const categoryColumnHelper = createDataTableColumnHelper<FeaturedCategory>()

function FeaturedCategoriesSection() {
  const queryClient = useQueryClient()
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CategoryForm>(EMPTY_CATEGORY_FORM)
  const [editing, setEditing] = useState<FeaturedCategory | null>(null)
  const [editForm, setEditForm] = useState<CategoryForm>(EMPTY_CATEGORY_FORM)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const limit = pagination.pageSize
  const offset = pagination.pageIndex * limit

  const { data, isLoading } = useQuery<FeaturedCategoriesResponse>({
    queryKey: ['site-content', 'featured-categories', limit, offset],
    queryFn: () =>
      sdk.client.fetch('/admin/featured-categories', { query: { limit, offset } }),
  })

  // Categorías reales de Medusa: alimentan el Select del formulario y el nombre
  // que se muestra en la tabla. Se cargan al montar (no dependen del modal).
  const { data: categoriesData } = useQuery({
    queryKey: ['site-content', 'product-categories'],
    queryFn: () => sdk.admin.productCategory.list({ limit: 200, fields: 'id,name,handle' }),
  })

  const categoryOptions: AdminCategoryOption[] = (
    (categoriesData?.product_categories ?? []) as any[]
  ).map((c) => ({ id: c.id, name: c.name, handle: c.handle }))

  const nameByHandle = new Map(categoryOptions.map((c) => [c.handle, c.name]))

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['site-content', 'featured-categories'] })

  const create = useMutation({
    mutationFn: () =>
      sdk.client.fetch('/admin/featured-categories', {
        method: 'POST',
        body: categoryFormToBody(createForm),
      }),
    onSuccess: () => {
      invalidate()
      toast.success('Categoría destacada creada.')
      setCreateForm(EMPTY_CATEGORY_FORM)
      setCreateOpen(false)
    },
    onError: (err: any) => toast.error(err?.message ?? 'No se pudo crear la categoría.'),
  })

  const update = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error('Sin categoría seleccionada.')
      return sdk.client.fetch(`/admin/featured-categories/${editing.id}`, {
        method: 'POST',
        body: categoryFormToBody(editForm),
      })
    },
    onSuccess: () => {
      invalidate()
      toast.success('Categoría destacada actualizada.')
      setDrawerOpen(false)
    },
    onError: (err: any) => toast.error(err?.message ?? 'No se pudo actualizar la categoría.'),
  })

  const remove = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/featured-categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidate()
      toast.success('Categoría destacada borrada.')
    },
    onError: (err: any) => toast.error(err?.message ?? 'No se pudo borrar la categoría.'),
  })

  useEffect(() => {
    if (editing) setEditForm(categoryToForm(editing))
  }, [editing])

  const openEdit = (item: FeaturedCategory) => {
    setEditing(item)
    setDrawerOpen(true)
  }

  const columns = [
    categoryColumnHelper.accessor('category_handle', {
      header: 'Categoría',
      cell: ({ row }) => {
        const c = row.original
        const realName = nameByHandle.get(c.category_handle)
        return (
          <div className="flex items-center gap-2">
            {c.image ? (
              <img src={c.image} alt="" className="h-9 w-9 shrink-0 rounded object-cover" />
            ) : (
              <div className="bg-ui-bg-component flex h-9 w-9 shrink-0 items-center justify-center rounded">
                <Photo className="text-ui-fg-muted" />
              </div>
            )}
            <div className="flex flex-col">
              <Text size="small" leading="compact" weight="plus" className="line-clamp-1">
                {c.label || realName || c.category_handle}
              </Text>
              <Text size="small" leading="compact" className="text-ui-fg-subtle line-clamp-1">
                {c.category_handle}
                {realName ? '' : ' · no encontrada'}
              </Text>
            </div>
          </div>
        )
      },
    }),
    categoryColumnHelper.accessor('image', {
      header: 'Foto',
      cell: ({ getValue }) => (
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          {getValue() ? 'Personalizada' : 'Automática'}
        </Text>
      ),
    }),
    categoryColumnHelper.accessor('rank', {
      header: 'Orden',
      cell: ({ getValue }) => (
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          {getValue()}
        </Text>
      ),
    }),
    categoryColumnHelper.accessor('published', {
      header: 'Estado',
      cell: ({ getValue }) => (
        <Badge size="2xsmall" color={getValue() ? 'green' : 'grey'}>
          {getValue() ? 'Publicado' : 'Borrador'}
        </Badge>
      ),
    }),
    categoryColumnHelper.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            size="small"
            variant="transparent"
            onClick={(e) => {
              e.stopPropagation()
              openEdit(row.original)
            }}
            aria-label="Editar"
          >
            <PencilSquare />
          </IconButton>
          <IconButton
            size="small"
            variant="transparent"
            onClick={(e) => {
              e.stopPropagation()
              if (
                window.confirm(
                  `¿Quitar «${row.original.label || row.original.category_handle}» de la home?`,
                )
              ) {
                remove.mutate(row.original.id)
              }
            }}
            disabled={remove.isPending}
            aria-label="Borrar"
          >
            <Trash />
          </IconButton>
        </div>
      ),
    }),
  ]

  const table = useDataTable({
    data: data?.featured_categories ?? [],
    columns,
    rowCount: data?.count ?? 0,
    getRowId: (c) => c.id,
    isLoading,
    pagination: { state: pagination, onPaginationChange: setPagination },
    onRowClick: (_e, row) => openEdit(row),
  })

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Text size="small" leading="compact" weight="plus">
            Bloque «Shop stickers» de la home
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Elige qué categorías salen en la portada, en qué orden y con qué foto.
          </Text>
        </div>
        <FocusModal
          open={createOpen}
          onOpenChange={(o) => {
            setCreateOpen(o)
            if (!o) setCreateForm(EMPTY_CATEGORY_FORM)
          }}
        >
          <FocusModal.Trigger asChild>
            <Button size="small">
              <Plus />
              Añadir categoría
            </Button>
          </FocusModal.Trigger>
          <FocusModal.Content>
            <FocusModal.Header>
              <div className="flex items-center justify-end gap-x-2">
                <FocusModal.Close asChild>
                  <Button size="small" variant="secondary" disabled={create.isPending}>
                    Cancelar
                  </Button>
                </FocusModal.Close>
                <Button
                  size="small"
                  onClick={() => {
                    if (!createForm.category_handle.trim()) {
                      toast.error('Selecciona una categoría.')
                      return
                    }
                    create.mutate()
                  }}
                  disabled={create.isPending}
                  isLoading={create.isPending}
                >
                  Guardar
                </Button>
              </div>
            </FocusModal.Header>
            <FocusModal.Body className="flex-1 overflow-auto">
              <div className="mx-auto flex w-full max-w-2xl flex-col gap-y-4 px-2 py-6">
                <Heading level="h2">Añadir categoría a la home</Heading>
                <CategoryFormFields
                  form={createForm}
                  setForm={setCreateForm}
                  options={categoryOptions}
                  disabled={create.isPending}
                />
              </div>
            </FocusModal.Body>
          </FocusModal.Content>
        </FocusModal>
      </div>

      <DataTable instance={table}>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>

      {!isLoading && (data?.featured_categories ?? []).length === 0 ? (
        <EmptyState text="Sin categorías destacadas: la home usa las 4 primeras automáticamente." />
      ) : null}

      <Drawer
        open={drawerOpen}
        onOpenChange={(o) => {
          setDrawerOpen(o)
          if (!o) setEditing(null)
        }}
      >
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Editar categoría destacada</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex-1 overflow-auto">
            {editing ? (
              <CategoryFormFields
                form={editForm}
                setForm={setEditForm}
                options={categoryOptions}
                disabled={update.isPending}
              />
            ) : null}
          </Drawer.Body>
          <Drawer.Footer>
            <div className="flex items-center justify-end gap-x-2">
              <Drawer.Close asChild>
                <Button size="small" variant="secondary" disabled={update.isPending}>
                  Cancelar
                </Button>
              </Drawer.Close>
              <Button
                size="small"
                onClick={() => {
                  if (!editForm.category_handle.trim()) {
                    toast.error('Selecciona una categoría.')
                    return
                  }
                  update.mutate()
                }}
                disabled={update.isPending}
                isLoading={update.isPending}
              >
                Guardar cambios
              </Button>
            </div>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// Página
// ═════════════════════════════════════════════════════════════════

const SiteContentPage = () => {
  const [tab, setTab] = useState('services')

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading>Contenido web</Heading>
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          Edita los textos y las fotos de la web sin tocar código.
        </Text>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="px-6 py-3">
          <Tabs.List>
            <Tabs.Trigger value="services">Servicios</Tabs.Trigger>
            <Tabs.Trigger value="process">Proceso</Tabs.Trigger>
            <Tabs.Trigger value="categories">Shop stickers</Tabs.Trigger>
          </Tabs.List>
        </div>

        <Tabs.Content value="services">
          <ServicesSection />
        </Tabs.Content>
        <Tabs.Content value="process">
          <ProcessSection />
        </Tabs.Content>
        <Tabs.Content value="categories">
          <FeaturedCategoriesSection />
        </Tabs.Content>
      </Tabs>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: 'Contenido web',
  icon: DocumentText,
})

export default SiteContentPage
