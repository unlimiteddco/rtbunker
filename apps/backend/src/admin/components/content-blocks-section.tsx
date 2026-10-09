import { ArrowUpTray, DocumentText, PencilSquare, Plus, Spinner, Trash } from '@medusajs/icons'
import {
  Badge,
  Button,
  Drawer,
  FocusModal,
  IconButton,
  Input,
  Label,
  Switch,
  Text,
  Textarea,
  toast,
  usePrompt,
} from '@medusajs/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'

import { sdk } from '../lib/client'

// ─────────────────────────────────────────────────────────────────
// Tipos (contrato de /admin/content-blocks)
// ─────────────────────────────────────────────────────────────────

type FieldKey =
  | 'title'
  | 'subtitle'
  | 'description'
  | 'image'
  | 'value'
  | 'link_label'
  | 'link_href'

export interface ContentBlockField {
  key: FieldKey
  label: string
  kind?: 'text' | 'textarea' | 'image' | 'color'
  placeholder?: string
  hint?: string
  required?: boolean
}

export interface ContentBlocksSectionProps {
  /** Colección de `content_block` (marquee, product_type, color_swatch, showcase). */
  collection: string
  heading: string
  help: string
  /** Texto del botón de alta y del título del formulario, p. ej. "marca". */
  noun: string
  fields: ContentBlockField[]
}

interface ContentBlock {
  id: string
  collection: string
  key: string | null
  title: string | null
  subtitle: string | null
  description: string | null
  image: string | null
  value: string | null
  link_label: string | null
  link_href: string | null
  rank: number
  published: boolean
}

interface ListResponse {
  content_blocks: ContentBlock[]
  count: number
  fixed: boolean
}

type Form = Record<FieldKey, string> & { rank: number; published: boolean }

const MAX_IMAGE_BYTES = 20 * 1024 * 1024 // 20 MB

/** URL pública de la tienda: las fotos sembradas son rutas relativas a ella. */
const STOREFRONT_URL = (
  (import.meta.env.VITE_STOREFRONT_URL as string | undefined) ||
  'https://rtbunker.com'
).replace(/\/+$/, '')

const previewSrc = (src: string) => (src.startsWith('/') ? `${STOREFRONT_URL}${src}` : src)

const isHex = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v.trim())

const emptyForm = (rank: number): Form => ({
  title: '',
  subtitle: '',
  description: '',
  image: '',
  value: '',
  link_label: '',
  link_href: '',
  rank,
  published: true,
})

const toForm = (b: ContentBlock): Form => ({
  title: b.title ?? '',
  subtitle: b.subtitle ?? '',
  description: b.description ?? '',
  image: b.image ?? '',
  value: b.value ?? '',
  link_label: b.link_label ?? '',
  link_href: b.link_href ?? '',
  rank: b.rank,
  published: b.published,
})

/** Solo se envían los campos que esta colección usa; vacío → null. */
function toBody(form: Form, fields: ContentBlockField[]) {
  const body: Record<string, unknown> = { rank: form.rank, published: form.published }
  for (const f of fields) {
    const v = form[f.key].trim()
    body[f.key] = v === '' ? null : v
  }
  return body
}

const errorMessage = (err: unknown) =>
  err instanceof Error && err.message ? err.message : 'Inténtalo de nuevo.'

// ─────────────────────────────────────────────────────────────────
// Campos del formulario
// ─────────────────────────────────────────────────────────────────

function ImageField({
  field,
  value,
  onChange,
  disabled,
}: {
  field: ContentBlockField
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(`Demasiado pesada (máx. 20 MB): ${file.name}.`)
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    setUploading(true)
    try {
      const res = await sdk.admin.upload.create({ files: [file] })
      const url = (res.files ?? []).map((f) => f?.url).filter(Boolean)[0]
      if (!url) throw new Error('La subida no devolvió URL.')
      onChange(url)
      toast.success('Imagen subida.')
    } catch (err) {
      toast.error(`No se pudo subir la imagen. ${errorMessage(err)}`)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-y-2">
      <Label>{field.label}</Label>
      {field.hint ? (
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          {field.hint}
        </Text>
      ) : null}

      {value ? (
        <div className="border-ui-border-base flex items-center gap-3 rounded-md border p-2">
          <div className="bg-ui-bg-component size-20 shrink-0 overflow-hidden rounded">
            <img src={previewSrc(value)} alt="" className="size-full object-contain" />
          </div>
          <IconButton
            size="small"
            variant="transparent"
            type="button"
            disabled={disabled}
            onClick={() => onChange('')}
            aria-label="Quitar imagen"
          >
            <Trash />
          </IconButton>
        </div>
      ) : null}

      <input
        ref={inputRef}
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
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          isLoading={uploading}
        >
          <ArrowUpTray />
          {value ? 'Cambiar imagen' : 'Subir imagen'}
        </Button>
      </div>
    </div>
  )
}

function ColorField({
  field,
  value,
  onChange,
  disabled,
}: {
  field: ContentBlockField
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  const id = `cb-${field.key}`
  return (
    <div className="flex flex-col gap-y-2">
      <Label htmlFor={id}>{field.label}</Label>
      {field.hint ? (
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          {field.hint}
        </Text>
      ) : null}
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label="Elegir color"
          value={isHex(value) ? value.trim() : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="border-ui-border-base h-8 w-10 shrink-0 cursor-pointer rounded border bg-transparent p-0.5"
        />
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? '#000000'}
          disabled={disabled}
        />
      </div>
    </div>
  )
}

function FormFields({
  fields,
  form,
  setForm,
  disabled,
}: {
  fields: ContentBlockField[]
  form: Form
  setForm: (updater: (f: Form) => Form) => void
  disabled?: boolean
}) {
  const set = (key: FieldKey) => (v: string) => setForm((f) => ({ ...f, [key]: v }))

  return (
    <div className="flex flex-col gap-y-5">
      {fields.map((field) => {
        const value = form[field.key]
        if (field.kind === 'image') {
          return (
            <ImageField
              key={field.key}
              field={field}
              value={value}
              onChange={set(field.key)}
              disabled={disabled}
            />
          )
        }
        if (field.kind === 'color') {
          return (
            <ColorField
              key={field.key}
              field={field}
              value={value}
              onChange={set(field.key)}
              disabled={disabled}
            />
          )
        }
        const id = `cb-${field.key}`
        return (
          <div key={field.key} className="flex flex-col gap-y-2">
            <Label htmlFor={id}>
              {field.label}
              {field.required ? ' *' : ''}
            </Label>
            {field.hint ? (
              <Text size="small" leading="compact" className="text-ui-fg-subtle">
                {field.hint}
              </Text>
            ) : null}
            {field.kind === 'textarea' ? (
              <Textarea
                id={id}
                rows={4}
                value={value}
                onChange={(e) => set(field.key)(e.target.value)}
                placeholder={field.placeholder}
                disabled={disabled}
              />
            ) : (
              <Input
                id={id}
                value={value}
                onChange={(e) => set(field.key)(e.target.value)}
                placeholder={field.placeholder}
                disabled={disabled}
              />
            )}
          </div>
        )
      })}

      <div className="flex flex-col gap-y-2">
        <Label htmlFor="cb-rank">Orden</Label>
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          El número más bajo sale primero.
        </Text>
        <Input
          id="cb-rank"
          type="number"
          className="w-32"
          value={form.rank}
          onChange={(e) => setForm((f) => ({ ...f, rank: Math.max(0, Number(e.target.value) || 0) }))}
          disabled={disabled}
        />
      </div>

      <div className="border-ui-border-base flex items-center justify-between rounded-md border px-3 py-2.5">
        <div className="flex flex-col">
          <Text size="small" leading="compact" weight="plus">
            Publicado
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Solo lo publicado aparece en la web.
          </Text>
        </div>
        <Switch
          checked={form.published}
          onCheckedChange={(v) => setForm((f) => ({ ...f, published: v }))}
          disabled={disabled}
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Sección
// ─────────────────────────────────────────────────────────────────

/**
 * Pestaña genérica de "Contenido web" para una colección de piezas de
 * contenido (`content_block`): lista con vista previa, alta, edición y borrado.
 * Qué campos se ven y cómo se llaman lo decide quien la usa (`fields`).
 */
export function ContentBlocksSection({
  collection,
  heading,
  help,
  noun,
  fields,
}: ContentBlocksSectionProps) {
  const queryClient = useQueryClient()
  const prompt = usePrompt()
  const queryKey = ['content-blocks', collection]

  // Lista de la colección: carga en mount.
  const { data, isLoading, isError, error } = useQuery<ListResponse>({
    queryKey,
    queryFn: () => sdk.client.fetch('/admin/content-blocks', { query: { collection } }),
  })
  const blocks = data?.content_blocks ?? []
  const fixed = data?.fixed ?? false

  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<ContentBlock | null>(null)
  const [form, setForm] = useState<Form>(emptyForm(0))

  const requiredMissing = fields.some((f) => f.required && form[f.key].trim() === '')

  const invalidate = () => queryClient.invalidateQueries({ queryKey })

  const create = useMutation({
    mutationFn: () =>
      sdk.client.fetch('/admin/content-blocks', {
        method: 'POST',
        body: { collection, ...toBody(form, fields) },
      }),
    onSuccess: () => {
      invalidate()
      setCreateOpen(false)
      toast.success('Guardado. Se verá en la web en uno o dos minutos.')
    },
    onError: (err) => toast.error(`No se pudo guardar. ${errorMessage(err)}`),
  })

  const update = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/content-blocks/${id}`, {
        method: 'POST',
        body: toBody(form, fields),
      }),
    onSuccess: () => {
      invalidate()
      setEditing(null)
      toast.success('Guardado. Se verá en la web en uno o dos minutos.')
    },
    onError: (err) => toast.error(`No se pudo guardar. ${errorMessage(err)}`),
  })

  const remove = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/content-blocks/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidate()
      toast.success('Eliminado.')
    },
    onError: (err) => toast.error(`No se pudo eliminar. ${errorMessage(err)}`),
  })

  const openCreate = () => {
    const nextRank = blocks.reduce((max, b) => Math.max(max, b.rank), -1) + 1
    setForm(emptyForm(nextRank))
    setCreateOpen(true)
  }

  const openEdit = (block: ContentBlock) => {
    setForm(toForm(block))
    setEditing(block)
  }

  const confirmRemove = async (block: ContentBlock) => {
    const ok = await prompt({
      title: `¿Eliminar «${block.title ?? noun}»?`,
      description: 'Dejará de salir en la web. Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
    })
    if (ok) remove.mutate(block.id)
  }

  const hasColor = fields.some((f) => f.kind === 'color')
  const hasImage = fields.some((f) => f.kind === 'image')

  return (
    <div className="divide-y">
      <div className="flex items-start justify-between gap-4 px-6 py-4">
        <div>
          <Text size="small" leading="compact" weight="plus">
            {heading}
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {help}
          </Text>
        </div>
        {!fixed ? (
          <Button size="small" variant="secondary" onClick={openCreate} className="shrink-0">
            <Plus />
            Crear {noun}
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Spinner className="text-ui-fg-muted animate-spin" />
        </div>
      ) : isError ? (
        <div className="px-6 py-8">
          <Text size="small" leading="compact" className="text-ui-fg-error">
            No se pudo cargar. {errorMessage(error)}
          </Text>
        </div>
      ) : blocks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <DocumentText className="text-ui-fg-muted" />
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Todavía no hay nada aquí. Mientras esté vacío, la web enseña el contenido de siempre.
          </Text>
        </div>
      ) : (
        <ul className="divide-y">
          {blocks.map((block) => (
            <li key={block.id} className="flex items-center gap-4 px-6 py-3">
              {hasColor || hasImage ? (
                <div
                  className="border-ui-border-base bg-ui-bg-component size-12 shrink-0 overflow-hidden rounded-md border"
                  style={
                    hasColor && !block.image && block.value
                      ? { background: block.value }
                      : undefined
                  }
                >
                  {block.image ? (
                    <img
                      src={previewSrc(block.image)}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : null}
                </div>
              ) : null}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Text size="small" leading="compact" weight="plus" className="truncate">
                    {block.title ?? '(sin título)'}
                  </Text>
                  {!block.published ? (
                    <Badge size="2xsmall" color="grey">
                      Oculto
                    </Badge>
                  ) : null}
                </div>
                {block.description || block.subtitle ? (
                  <Text size="small" leading="compact" className="text-ui-fg-subtle truncate">
                    {block.description ?? block.subtitle}
                  </Text>
                ) : null}
              </div>

              <Text size="small" leading="compact" className="text-ui-fg-muted tabular-nums">
                #{block.rank + 1}
              </Text>
              <IconButton
                size="small"
                variant="transparent"
                onClick={() => openEdit(block)}
                aria-label={`Editar ${block.title ?? noun}`}
              >
                <PencilSquare />
              </IconButton>
              {!fixed ? (
                <IconButton
                  size="small"
                  variant="transparent"
                  onClick={() => confirmRemove(block)}
                  disabled={remove.isPending}
                  aria-label={`Eliminar ${block.title ?? noun}`}
                >
                  <Trash />
                </IconButton>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {/* ─── Alta ─────────────────────────────────────────────────── */}
      <FocusModal open={createOpen} onOpenChange={setCreateOpen}>
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
                onClick={() => create.mutate()}
                disabled={create.isPending || requiredMissing}
                isLoading={create.isPending}
              >
                Crear {noun}
              </Button>
            </div>
          </FocusModal.Header>
          <FocusModal.Body className="flex flex-1 flex-col items-center overflow-y-auto">
            <div className="flex w-full max-w-lg flex-col gap-y-6 px-6 py-16">
              <div>
                <FocusModal.Title>Crear {noun}</FocusModal.Title>
                <FocusModal.Description className="text-ui-fg-subtle">
                  {help}
                </FocusModal.Description>
              </div>
              <FormFields
                fields={fields}
                form={form}
                setForm={setForm}
                disabled={create.isPending}
              />
            </div>
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModal>

      {/* ─── Edición ──────────────────────────────────────────────── */}
      <Drawer open={editing !== null} onOpenChange={(open) => (open ? null : setEditing(null))}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Editar {noun}</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex-1 overflow-y-auto p-4">
            <FormFields
              fields={fields}
              form={form}
              setForm={setForm}
              disabled={update.isPending}
            />
          </Drawer.Body>
          <Drawer.Footer>
            <Drawer.Close asChild>
              <Button size="small" variant="secondary" disabled={update.isPending}>
                Cancelar
              </Button>
            </Drawer.Close>
            <Button
              size="small"
              onClick={() => editing && update.mutate(editing.id)}
              disabled={update.isPending || requiredMissing}
              isLoading={update.isPending}
            >
              Guardar
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </div>
  )
}
