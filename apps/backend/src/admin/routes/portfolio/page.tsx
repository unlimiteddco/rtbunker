import { defineRouteConfig } from '@medusajs/admin-sdk'
import {
  ArrowUpTray,
  Photo,
  PencilSquare,
  Plus,
  Trash,
  XMark,
} from '@medusajs/icons'
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
  Text,
  Textarea,
  toast,
  useDataTable,
} from '@medusajs/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

import { sdk } from '../../lib/client'

// ─────────────────────────────────────────────────────────────────
// Tipos + constantes
// ─────────────────────────────────────────────────────────────────

type ServiceType =
  | 'wrapping'
  | 'car-design'
  | 'chrome-delete'
  | 'ahumado'
  | 'rotulacion'

const SERVICE_TYPES: ServiceType[] = [
  'wrapping',
  'car-design',
  'chrome-delete',
  'ahumado',
  'rotulacion',
]

const SERVICE_LABELS: Record<ServiceType, string> = {
  wrapping: 'Full Wrap',
  'car-design': 'Car Design',
  'chrome-delete': 'Chrome Delete',
  ahumado: 'Ahumado',
  rotulacion: 'Rotulación',
}

interface PortfolioWork {
  id: string
  service_type: ServiceType
  title: string
  description: string | null
  car: string | null
  materials: string | null
  date_label: string | null
  thumbnail: string | null
  images: string[] | null
  rank: number
  published: boolean
  created_at: string
  updated_at: string
}

interface ListResponse {
  portfolio_works: PortfolioWork[]
  count: number
  limit: number
  offset: number
}

const MAX_IMAGE_BYTES = 20 * 1024 * 1024 // 20 MB por imagen

interface FormState {
  service_type: ServiceType
  title: string
  description: string
  car: string
  materials: string
  date_label: string
  rank: number
  published: boolean
  images: string[]
}

const EMPTY_FORM: FormState = {
  service_type: 'wrapping',
  title: '',
  description: '',
  car: '',
  materials: '',
  date_label: '',
  rank: 0,
  published: true,
  images: [],
}

function workToForm(w: PortfolioWork): FormState {
  return {
    service_type: w.service_type,
    title: w.title,
    description: w.description ?? '',
    car: w.car ?? '',
    materials: w.materials ?? '',
    date_label: w.date_label ?? '',
    rank: w.rank ?? 0,
    published: w.published,
    images: Array.isArray(w.images) ? w.images : [],
  }
}

/**
 * Construye el body para POST. La primera imagen del array es la portada
 * (thumbnail). Campos vacíos se mandan como null.
 */
function formToBody(form: FormState) {
  return {
    service_type: form.service_type,
    title: form.title.trim(),
    description: form.description.trim() || null,
    car: form.car.trim() || null,
    materials: form.materials.trim() || null,
    date_label: form.date_label.trim() || null,
    rank: form.rank,
    published: form.published,
    images: form.images,
    thumbnail: form.images[0] ?? null,
  }
}

// ─────────────────────────────────────────────────────────────────
// Uploader de imágenes (multiple · miniaturas · quitar · reordenar)
// ─────────────────────────────────────────────────────────────────

function ImageUploader({
  images,
  onChange,
  disabled,
}: {
  images: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFiles = async (fileList: FileList | null) => {
    const incoming = fileList ? Array.from(fileList) : []
    if (incoming.length === 0) return

    const accepted: File[] = []
    const rejected: string[] = []
    for (const f of incoming) {
      if (f.size > MAX_IMAGE_BYTES) rejected.push(f.name)
      else accepted.push(f)
    }
    if (rejected.length > 0) {
      toast.error(`Demasiado pesado (máx. 20 MB): ${rejected.join(', ')}.`)
    }
    if (accepted.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setUploading(true)
    try {
      const res = await sdk.admin.upload.create({ files: accepted })
      const urls = (res.files ?? [])
        .map((f) => f?.url)
        .filter((u): u is string => Boolean(u))
      if (urls.length === 0) throw new Error('La subida no devolvió URLs.')
      onChange([...images, ...urls])
      toast.success(
        urls.length === 1 ? 'Imagen subida.' : `${urls.length} imágenes subidas.`,
      )
    } catch (err: any) {
      toast.error(err?.message ?? 'No se pudieron subir las imágenes.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeAt = (index: number) => {
    onChange(images.filter((_, i) => i !== index))
  }

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= images.length) return
    const next = [...images]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-y-2">
      <Label>Fotos del trabajo</Label>
      <Text size="small" leading="compact" className="text-ui-fg-subtle">
        La primera imagen es la portada (thumbnail). Puedes subir varias, quitar y
        reordenar (máx. 20 MB cada una).
      </Text>

      {images.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {images.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className="border-ui-border-base relative flex flex-col gap-1 rounded-md border p-1.5"
            >
              <div className="bg-ui-bg-subtle size-24 overflow-hidden rounded">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Foto ${i + 1}`} className="size-full object-cover" />
              </div>
              {i === 0 ? (
                <Badge size="2xsmall" color="green" className="absolute left-1 top-1">
                  Portada
                </Badge>
              ) : null}
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-0.5">
                  <IconButton
                    size="2xsmall"
                    variant="transparent"
                    type="button"
                    disabled={disabled || i === 0}
                    onClick={() => move(i, -1)}
                    aria-label="Mover antes"
                  >
                    ←
                  </IconButton>
                  <IconButton
                    size="2xsmall"
                    variant="transparent"
                    type="button"
                    disabled={disabled || i === images.length - 1}
                    onClick={() => move(i, 1)}
                    aria-label="Mover después"
                  >
                    →
                  </IconButton>
                </div>
                <IconButton
                  size="2xsmall"
                  variant="transparent"
                  type="button"
                  disabled={disabled}
                  onClick={() => removeAt(i)}
                  aria-label={`Quitar foto ${i + 1}`}
                >
                  <Trash />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/avif"
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
          Subir imágenes
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Campos compartidos del formulario (crear + editar)
// ─────────────────────────────────────────────────────────────────

function WorkFormFields({
  form,
  setForm,
  disabled,
}: {
  form: FormState
  setForm: (next: FormState) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex flex-col gap-y-2">
        <Label>Servicio *</Label>
        <Select
          value={form.service_type}
          onValueChange={(v) => setForm({ ...form, service_type: v as ServiceType })}
          disabled={disabled}
        >
          <Select.Trigger>
            <Select.Value placeholder="Selecciona el servicio" />
          </Select.Trigger>
          <Select.Content>
            {SERVICE_TYPES.map((s) => (
              <Select.Item key={s} value={s}>
                {SERVICE_LABELS[s]}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>

      <div className="flex flex-col gap-y-2">
        <Label>Título *</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Ej: BMW M4 Full Wrap mate"
          disabled={disabled}
        />
      </div>

      <div className="flex flex-col gap-y-2">
        <Label>Descripción</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Detalle del trabajo realizado…"
          rows={3}
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-y-2">
          <Label>Coche</Label>
          <Input
            value={form.car}
            onChange={(e) => setForm({ ...form, car: e.target.value })}
            placeholder="Ej: BMW M4 Competition"
            disabled={disabled}
          />
        </div>
        <div className="flex flex-col gap-y-2">
          <Label>Materiales</Label>
          <Input
            value={form.materials}
            onChange={(e) => setForm({ ...form, materials: e.target.value })}
            placeholder="Ej: Vinilo 3M 2080 mate"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-y-2">
          <Label>Fecha (etiqueta)</Label>
          <Input
            value={form.date_label}
            onChange={(e) => setForm({ ...form, date_label: e.target.value })}
            placeholder="Ej: Marzo 2024"
            disabled={disabled}
          />
        </div>
        <div className="flex flex-col gap-y-2">
          <Label>Orden (rank)</Label>
          <Input
            type="number"
            value={form.rank}
            onChange={(e) => setForm({ ...form, rank: Number(e.target.value) || 0 })}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-md border border-ui-border-base px-3 py-2.5">
        <div className="flex flex-col">
          <Text size="small" leading="compact" weight="plus">
            Publicado
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Solo los trabajos publicados aparecen en la web.
          </Text>
        </div>
        <Switch
          checked={form.published}
          onCheckedChange={(checked) => setForm({ ...form, published: checked })}
          disabled={disabled}
        />
      </div>

      <ImageUploader
        images={form.images}
        onChange={(images) => setForm({ ...form, images })}
        disabled={disabled}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Crear → FocusModal
// ─────────────────────────────────────────────────────────────────

function CreateWorkModal() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const create = useMutation({
    mutationFn: () =>
      sdk.client.fetch('/admin/portfolio', {
        method: 'POST',
        body: formToBody(form),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
      toast.success('Trabajo creado.')
      setForm(EMPTY_FORM)
      setOpen(false)
    },
    onError: (err: any) => {
      toast.error(err?.message ?? 'No se pudo crear el trabajo.')
    },
  })

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error('El título es obligatorio.')
      return
    }
    create.mutate()
  }

  return (
    <FocusModal
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setForm(EMPTY_FORM)
      }}
    >
      <FocusModal.Trigger asChild>
        <Button size="small">
          <Plus />
          Crear trabajo
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
              onClick={handleSubmit}
              disabled={create.isPending}
              isLoading={create.isPending}
            >
              Guardar
            </Button>
          </div>
        </FocusModal.Header>
        <FocusModal.Body className="flex-1 overflow-auto">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-y-4 px-2 py-6">
            <Heading level="h2">Nuevo trabajo de portafolio</Heading>
            <WorkFormFields form={form} setForm={setForm} disabled={create.isPending} />
          </div>
        </FocusModal.Body>
      </FocusModal.Content>
    </FocusModal>
  )
}

// ─────────────────────────────────────────────────────────────────
// Editar → Drawer
// ─────────────────────────────────────────────────────────────────

function EditWorkDrawer({
  work,
  open,
  onOpenChange,
}: {
  work: PortfolioWork | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  useEffect(() => {
    if (work) setForm(workToForm(work))
  }, [work])

  const update = useMutation({
    mutationFn: () => {
      if (!work) throw new Error('Sin trabajo seleccionado.')
      return sdk.client.fetch(`/admin/portfolio/${work.id}`, {
        method: 'POST',
        body: formToBody(form),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
      toast.success('Trabajo actualizado.')
      onOpenChange(false)
    },
    onError: (err: any) => {
      toast.error(err?.message ?? 'No se pudo actualizar el trabajo.')
    },
  })

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error('El título es obligatorio.')
      return
    }
    update.mutate()
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Editar trabajo</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="flex-1 overflow-auto">
          {work ? (
            <WorkFormFields form={form} setForm={setForm} disabled={update.isPending} />
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
              onClick={handleSubmit}
              disabled={update.isPending}
              isLoading={update.isPending}
            >
              Guardar cambios
            </Button>
          </div>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}

// ─────────────────────────────────────────────────────────────────
// Tabla
// ─────────────────────────────────────────────────────────────────

const columnHelper = createDataTableColumnHelper<PortfolioWork>()

const PortfolioPage = () => {
  const queryClient = useQueryClient()
  const [serviceFilter, setServiceFilter] = useState<ServiceType | 'all'>('all')
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })
  const [editing, setEditing] = useState<PortfolioWork | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const limit = pagination.pageSize
  const offset = pagination.pageIndex * limit

  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ['portfolio', limit, offset, serviceFilter],
    queryFn: () => {
      const params: Record<string, string | number> = { limit, offset }
      if (serviceFilter !== 'all') params.service_type = serviceFilter
      return sdk.client.fetch('/admin/portfolio', { query: params })
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/portfolio/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
      toast.success('Trabajo borrado.')
    },
    onError: (err: any) => {
      toast.error(err?.message ?? 'No se pudo borrar el trabajo.')
    },
  })

  const openEdit = (work: PortfolioWork) => {
    setEditing(work)
    setDrawerOpen(true)
  }

  const handleDelete = (work: PortfolioWork) => {
    if (
      window.confirm(
        `¿Borrar «${work.title}»? Esta acción no se puede deshacer.`,
      )
    ) {
      remove.mutate(work.id)
    }
  }

  const columns = [
    columnHelper.accessor('title', {
      header: 'Título',
      cell: ({ row }) => {
        const w = row.original
        const cover = w.thumbnail ?? w.images?.[0] ?? null
        return (
          <div className="flex items-center gap-2">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover}
                alt=""
                className="h-9 w-9 shrink-0 rounded object-cover"
              />
            ) : (
              <div className="bg-ui-bg-component flex h-9 w-9 shrink-0 items-center justify-center rounded">
                <Photo className="text-ui-fg-muted" />
              </div>
            )}
            <div className="flex flex-col">
              <Text size="small" leading="compact" weight="plus" className="line-clamp-1">
                {w.title}
              </Text>
              {w.car ? (
                <Text size="small" leading="compact" className="text-ui-fg-subtle line-clamp-1">
                  {w.car}
                </Text>
              ) : null}
            </div>
          </div>
        )
      },
    }),
    columnHelper.accessor('service_type', {
      header: 'Servicio',
      cell: ({ getValue }) => {
        const s = getValue()
        return (
          <Badge size="2xsmall">{SERVICE_LABELS[s] ?? s}</Badge>
        )
      },
    }),
    columnHelper.accessor('images', {
      header: 'Fotos',
      cell: ({ getValue }) => {
        const imgs = getValue()
        return (
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {Array.isArray(imgs) ? imgs.length : 0}
          </Text>
        )
      },
    }),
    columnHelper.accessor('rank', {
      header: 'Orden',
      cell: ({ getValue }) => (
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          {getValue()}
        </Text>
      ),
    }),
    columnHelper.accessor('published', {
      header: 'Publicado',
      cell: ({ getValue }) => (
        <Badge size="2xsmall" color={getValue() ? 'green' : 'grey'}>
          {getValue() ? 'Publicado' : 'Borrador'}
        </Badge>
      ),
    }),
    columnHelper.display({
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
              handleDelete(row.original)
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
    data: data?.portfolio_works ?? [],
    columns,
    rowCount: data?.count ?? 0,
    getRowId: (w) => w.id,
    isLoading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
    onRowClick: (_e, row) => openEdit(row),
  })

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Portafolio</Heading>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Gestiona los trabajos del portafolio que se muestran en la web.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={serviceFilter}
            onValueChange={(v) => {
              setServiceFilter(v as ServiceType | 'all')
              setPagination((p) => ({ ...p, pageIndex: 0 }))
            }}
          >
            <Select.Trigger className="min-w-44">
              <Select.Value placeholder="Filtrar servicio" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="all">Todos los servicios</Select.Item>
              {SERVICE_TYPES.map((s) => (
                <Select.Item key={s} value={s}>
                  {SERVICE_LABELS[s]}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
          <CreateWorkModal />
        </div>
      </div>

      <DataTable instance={table}>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>

      {!isLoading && (data?.portfolio_works ?? []).length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
          <Photo className="text-ui-fg-muted" />
          <Heading level="h3">
            Aún no hay trabajos {serviceFilter !== 'all' ? 'de este servicio' : ''}
          </Heading>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Crea el primero con el botón «Crear trabajo».
          </Text>
        </div>
      ) : null}

      <EditWorkDrawer
        work={editing}
        open={drawerOpen}
        onOpenChange={(o) => {
          setDrawerOpen(o)
          if (!o) setEditing(null)
        }}
      />
    </Container>
  )
}

export const config = defineRouteConfig({
  label: 'Portafolio',
  icon: Photo,
})

export default PortfolioPage
