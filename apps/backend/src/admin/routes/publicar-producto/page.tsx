import { defineRouteConfig } from '@medusajs/admin-sdk'
import {
  ArrowLeftMini,
  ArrowRightMini,
  ArrowUpRightOnBox,
  ArrowUpTray,
  CheckCircleSolid,
  MagnifyingGlass,
  PencilSquare,
  Plus,
  RocketLaunch,
  Trash,
  XMarkMini,
} from '@medusajs/icons'
import {
  Badge,
  Button,
  Checkbox,
  Container,
  Heading,
  IconButton,
  Input,
  Label,
  Switch,
  Text,
  Textarea,
  toast,
} from '@medusajs/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { sdk } from '../../lib/client'

// ─────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────

/** URL pública de la tienda (para el enlace "Ver en la tienda"). */
const STOREFRONT_URL = (
  (import.meta.env.VITE_STOREFRONT_URL as string | undefined) ||
  'https://rtbunker.com'
).replace(/\/+$/, '')

const productUrl = (handle: string) => `${STOREFRONT_URL}/es/producto/${handle}`

// Nombres de opción que el storefront reconoce (selector de tamaño / muestras
// de color): ver apps/storefront/src/components/product/variant-selector.tsx.
const SIZE_OPTION_TITLE = 'Tamaño'
const COLOR_OPTION_TITLE = 'Color'

// Valores habituales del catálogo (mismos textos que los productos actuales,
// así el storefront pinta la muestra de color correcta).
const SIZE_SUGGESTIONS = ['8cm', '10cm', '12cm', '15cm', '20cm', '25cm', '30cm', '50cm', '100cm']
const COLOR_SUGGESTIONS = [
  'Negro brillo',
  'Negro mate',
  'Blanco',
  'Amarillo',
  'Dorado',
  'Rojo',
  'Rosa',
  'Lila',
  'Morado',
  'Azul turquesa',
  'Azul claro',
  'Azul oscuro',
  'Verde pistacho',
  'Verde oscuro',
  'Gris',
  'Plata',
  'Holografico',
  'Cobre/Bronce',
  'Amarillo fluor',
]

const MAX_VARIANTS = 300
const MAX_IMAGE_BYTES = 20 * 1024 * 1024 // 20 MB por imagen

const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })

// ─────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────

interface CategoryOption {
  id: string
  name: string
  handle: string
  parent: { id: string; name: string } | null
}

interface ContextResponse {
  categories: CategoryOption[]
}

interface CreatedProduct {
  id: string
  title: string
  handle: string
  status: 'published' | 'draft'
  variants_count: number
}

interface FormState {
  images: string[]
  title: string
  description: string
  categoryIds: string[]
  price: string
  hasSizes: boolean
  sizes: string[]
  sizePrices: Record<string, string>
  hasColors: boolean
  colors: string[]
  hasCustomText: boolean
  customTextLabel: string
  customTextPlaceholder: string
  customTextMax: string
  customTextRequired: boolean
}

const EMPTY_FORM: FormState = {
  images: [],
  title: '',
  description: '',
  categoryIds: [],
  price: '',
  hasSizes: false,
  sizes: [],
  sizePrices: {},
  hasColors: false,
  colors: [],
  hasCustomText: false,
  customTextLabel: '',
  customTextPlaceholder: '',
  customTextMax: '30',
  customTextRequired: true,
}

// ─────────────────────────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────────────────────────

/** "6,99" / "6.99" / " 7 " → 6.99 / 7. Devuelve null si no es un precio válido. */
function parsePrice(raw: string): number | null {
  const s = raw.replace(/€/g, '').replace(/\s/g, '').replace(',', '.')
  if (!s) return null
  const n = Number(s)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n * 100) / 100
}

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

function validate(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {}
  if (form.images.length === 0) errors.images = 'Sube al menos una foto.'
  if (!form.title.trim()) errors.title = 'Escribe el nombre del producto.'
  if (parsePrice(form.price) === null) errors.price = 'Escribe un precio válido (ej. 5,99).'
  if (form.hasSizes) {
    if (form.sizes.length === 0) errors.sizes = 'Añade al menos un tamaño o desactiva la opción.'
    const bad = form.sizes.filter(
      (s) => (form.sizePrices[s] ?? '').trim() && parsePrice(form.sizePrices[s]) === null,
    )
    if (bad.length > 0) errors.sizes = `Revisa el precio de: ${bad.join(', ')}.`
  }
  if (form.hasColors && form.colors.length === 0) {
    errors.colors = 'Añade al menos un color o desactiva la opción.'
  }
  if (form.hasCustomText && !form.customTextLabel.trim()) {
    errors.customText = 'Escribe qué le preguntamos al cliente (ej. «Tu usuario de Instagram»).'
  }
  return errors
}

function buildBody(form: FormState, status: 'published' | 'draft') {
  const options: { title: string; values: string[]; prices?: Record<string, number> }[] = []
  if (form.hasSizes && form.sizes.length > 0) {
    const prices: Record<string, number> = {}
    for (const s of form.sizes) {
      const p = parsePrice(form.sizePrices[s] ?? '')
      if (p !== null) prices[s] = p
    }
    options.push({ title: SIZE_OPTION_TITLE, values: form.sizes, prices })
  }
  if (form.hasColors && form.colors.length > 0) {
    options.push({ title: COLOR_OPTION_TITLE, values: form.colors })
  }
  const max = Number(form.customTextMax)
  return {
    title: form.title.trim(),
    description: form.description.trim() || null,
    category_ids: form.categoryIds,
    images: form.images,
    thumbnail: form.images[0] ?? null,
    price: parsePrice(form.price) ?? 0,
    options,
    status,
    custom_text: form.hasCustomText
      ? {
          enabled: true,
          label: form.customTextLabel.trim(),
          placeholder: form.customTextPlaceholder.trim(),
          max: Number.isFinite(max) && max > 0 ? Math.min(Math.floor(max), 200) : 30,
          required: form.customTextRequired,
        }
      : null,
  }
}

// ─────────────────────────────────────────────────────────────────
// Piezas de UI
// ─────────────────────────────────────────────────────────────────

function Section({
  step,
  title,
  description,
  children,
}: {
  step: number
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-y-3 px-6 py-5">
      <div className="flex items-start gap-3">
        <div className="bg-ui-bg-subtle text-ui-fg-subtle border-ui-border-base flex size-6 shrink-0 items-center justify-center rounded-full border">
          <Text size="xsmall" leading="compact" weight="plus">
            {step}
          </Text>
        </div>
        <div className="flex flex-col gap-0.5">
          <Text size="base" leading="compact" weight="plus">
            {title}
          </Text>
          {description ? (
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              {description}
            </Text>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-y-3 pl-9">{children}</div>
    </div>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <Text size="small" leading="compact" className="text-ui-fg-error">
      {message}
    </Text>
  )
}

/** Caja "arrastra aquí" + miniaturas (quitar, reordenar, hacer portada). */
function PhotosField({
  images,
  onChange,
  onUploadingChange,
  error,
  disabled,
}: {
  images: string[]
  onChange: (next: string[]) => void
  onUploadingChange: (uploading: boolean) => void
  error?: string
  disabled?: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  // Evita perder fotos si se suben dos tandas seguidas.
  const imagesRef = useRef(images)
  imagesRef.current = images

  const handleFiles = async (fileList: FileList | null) => {
    const incoming = fileList ? Array.from(fileList) : []
    if (incoming.length === 0) return

    const accepted = incoming.filter((f) => f.type.startsWith('image/') && f.size <= MAX_IMAGE_BYTES)
    const rejected = incoming.filter((f) => !accepted.includes(f)).map((f) => f.name)
    if (rejected.length > 0) {
      toast.error(`No se pueden subir (solo imágenes de hasta 20 MB): ${rejected.join(', ')}`)
    }
    if (accepted.length === 0) return

    setUploading(true)
    onUploadingChange(true)
    try {
      const res = await sdk.admin.upload.create({ files: accepted })
      const urls = (res.files ?? []).map((f) => f?.url).filter((u): u is string => Boolean(u))
      if (urls.length === 0) throw new Error('La subida no devolvió ninguna foto.')
      onChange([...imagesRef.current, ...urls])
      toast.success(urls.length === 1 ? 'Foto subida.' : `${urls.length} fotos subidas.`)
    } catch (err: any) {
      toast.error(err?.message ?? 'No se pudieron subir las fotos.')
    } finally {
      setUploading(false)
      onUploadingChange(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const move = (index: number, target: number) => {
    if (target < 0 || target >= images.length) return
    const next = [...images]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    onChange(next)
  }

  const isDisabled = disabled || uploading

  return (
    <div className="flex flex-col gap-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!isDisabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (!isDisabled) handleFiles(e.dataTransfer.files)
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-8 text-center transition-colors ${
          dragging
            ? 'border-ui-border-interactive bg-ui-bg-highlight'
            : error
              ? 'border-ui-border-error bg-ui-bg-subtle'
              : 'border-ui-border-strong bg-ui-bg-subtle'
        }`}
      >
        <ArrowUpTray className="text-ui-fg-subtle" />
        <Text size="small" leading="compact" weight="plus">
          {uploading ? 'Subiendo fotos…' : 'Arrastra aquí las fotos'}
        </Text>
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          o bien
        </Text>
        <Button
          size="small"
          variant="secondary"
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isDisabled}
          isLoading={uploading}
        >
          Elegir fotos del ordenador
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/avif"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={isDisabled}
        />
      </div>

      {images.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {images.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className={`relative flex flex-col gap-1 rounded-lg border p-1.5 ${
                i === 0 ? 'border-ui-border-interactive' : 'border-ui-border-base'
              }`}
            >
              <div className="bg-ui-bg-subtle size-28 overflow-hidden rounded-md">
                <img src={url} alt={`Foto ${i + 1}`} className="size-full object-cover" />
              </div>
              {i === 0 ? (
                <Badge size="2xsmall" color="blue" className="absolute left-2.5 top-2.5">
                  Portada
                </Badge>
              ) : null}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <IconButton
                    size="2xsmall"
                    variant="transparent"
                    type="button"
                    disabled={disabled || i === 0}
                    onClick={() => move(i, i - 1)}
                    aria-label="Mover a la izquierda"
                  >
                    <ArrowLeftMini />
                  </IconButton>
                  <IconButton
                    size="2xsmall"
                    variant="transparent"
                    type="button"
                    disabled={disabled || i === images.length - 1}
                    onClick={() => move(i, i + 1)}
                    aria-label="Mover a la derecha"
                  >
                    <ArrowRightMini />
                  </IconButton>
                </div>
                <IconButton
                  size="2xsmall"
                  variant="transparent"
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(images.filter((_, j) => j !== i))}
                  aria-label={`Quitar foto ${i + 1}`}
                >
                  <Trash />
                </IconButton>
              </div>
              {i !== 0 ? (
                <Button
                  size="small"
                  variant="transparent"
                  type="button"
                  disabled={disabled}
                  onClick={() => move(i, 0)}
                  className="h-6 px-1"
                >
                  <Text size="xsmall" leading="compact">
                    Usar de portada
                  </Text>
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <FieldError message={error} />
    </div>
  )
}

/** Caja de texto + "Añadir" + sugerencias rápidas. Admite "a, b, c". */
function AddValues({
  values,
  onAdd,
  placeholder,
  suggestions,
  onAddAll,
  disabled,
}: {
  values: string[]
  onAdd: (vals: string[]) => void
  placeholder: string
  suggestions: string[]
  onAddAll?: () => void
  disabled?: boolean
}) {
  const [draft, setDraft] = useState('')
  const lower = new Set(values.map((v) => v.toLowerCase()))
  const pending = suggestions.filter((s) => !lower.has(s.toLowerCase()))

  const commit = () => {
    const parts = draft
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
    if (parts.length === 0) return
    onAdd(parts)
    setDraft('')
  }

  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            value={draft}
            placeholder={placeholder}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault()
                commit()
              }
            }}
            disabled={disabled}
          />
        </div>
        <Button size="small" variant="secondary" type="button" onClick={commit} disabled={disabled || !draft.trim()}>
          <Plus />
          Añadir
        </Button>
      </div>
      {pending.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <Text size="xsmall" leading="compact" className="text-ui-fg-subtle mr-1">
            Rápido:
          </Text>
          {pending.map((s) => (
            <Button
              key={s}
              size="small"
              variant="secondary"
              type="button"
              className="h-6 px-2"
              onClick={() => onAdd([s])}
              disabled={disabled}
            >
              <Text size="xsmall" leading="compact">
                + {s}
              </Text>
            </Button>
          ))}
          {onAddAll && pending.length > 1 ? (
            <Button
              size="small"
              variant="transparent"
              type="button"
              className="h-6 px-2"
              onClick={onAddAll}
              disabled={disabled}
            >
              <Text size="xsmall" leading="compact" weight="plus">
                Añadir todos
              </Text>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

/** Añade valores evitando repetidos (sin distinguir mayúsculas). */
function mergeValues(current: string[], incoming: string[]): string[] {
  const seen = new Set(current.map((v) => v.toLowerCase()))
  const next = [...current]
  for (const v of incoming) {
    const t = v.trim().slice(0, 60)
    if (t && !seen.has(t.toLowerCase())) {
      seen.add(t.toLowerCase())
      next.push(t)
    }
  }
  return next
}

function CategoriesField({
  selected,
  onChange,
  disabled,
}: {
  selected: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
}) {
  const [search, setSearch] = useState('')
  const { data, isLoading, isError } = useQuery<ContextResponse>({
    queryKey: ['quick-product-context'],
    queryFn: () => sdk.client.fetch('/admin/quick-product/context'),
  })
  const categories = data?.categories ?? []
  const byId = new Map(categories.map((c) => [c.id, c]))

  const label = (c: CategoryOption) => (c.parent ? `${c.parent.name} › ${c.name}` : c.name)
  const q = normalize(search.trim())
  const visible = q ? categories.filter((c) => normalize(label(c)).includes(q)) : categories

  const toggle = (id: string, checked: boolean) =>
    onChange(checked ? [...selected, id] : selected.filter((x) => x !== id))

  return (
    <div className="flex flex-col gap-y-2">
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((id) => {
            const c = byId.get(id)
            return (
              <Badge key={id} size="small" color="blue" className="gap-1 pr-1">
                {c ? label(c) : '…'}
                <IconButton
                  size="2xsmall"
                  variant="transparent"
                  type="button"
                  onClick={() => toggle(id, false)}
                  disabled={disabled}
                  aria-label="Quitar categoría"
                >
                  <XMarkMini />
                </IconButton>
              </Badge>
            )
          })}
        </div>
      ) : null}

      <div className="relative">
        <MagnifyingGlass className="text-ui-fg-muted pointer-events-none absolute left-2 top-1/2 -translate-y-1/2" />
        <Input
          className="pl-8"
          placeholder="Buscar categoría (ej. BMW, parasoles…)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="border-ui-border-base max-h-64 overflow-y-auto rounded-md border">
        {isLoading ? (
          <div className="px-3 py-3">
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              Cargando categorías…
            </Text>
          </div>
        ) : isError ? (
          <div className="px-3 py-3">
            <Text size="small" leading="compact" className="text-ui-fg-error">
              No se pudieron cargar las categorías. Recarga la página.
            </Text>
          </div>
        ) : visible.length === 0 ? (
          <div className="px-3 py-3">
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              Ninguna categoría coincide con «{search}».
            </Text>
          </div>
        ) : (
          visible.map((c) => {
            const id = `cat-${c.id}`
            return (
              <div
                key={c.id}
                className={`hover:bg-ui-bg-base-hover flex items-center gap-2 py-2 pr-3 ${
                  c.parent && !q ? 'pl-8' : 'pl-3'
                }`}
              >
                <Checkbox
                  id={id}
                  checked={selected.includes(c.id)}
                  onCheckedChange={(v) => toggle(c.id, v === true)}
                  disabled={disabled}
                />
                <Label htmlFor={id} className="flex-1 cursor-pointer">
                  <Text size="small" leading="compact" weight={c.parent ? 'regular' : 'plus'}>
                    {q ? label(c) : c.name}
                  </Text>
                </Label>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="border-ui-border-base flex items-center justify-between gap-4 rounded-md border px-3 py-2.5">
      <div className="flex flex-col">
        <Text size="small" leading="compact" weight="plus">
          {title}
        </Text>
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          {description}
        </Text>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Pantalla de éxito
// ─────────────────────────────────────────────────────────────────

function SuccessPanel({ product, onReset }: { product: CreatedProduct; onReset: () => void }) {
  const published = product.status === 'published'
  return (
    <Container className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <CheckCircleSolid className="text-ui-fg-interactive size-8" />
      <div className="flex flex-col gap-1">
        <Heading level="h2">
          {published ? '¡Producto publicado!' : 'Borrador guardado'}
        </Heading>
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          «{product.title}» · {product.variants_count}{' '}
          {product.variants_count === 1 ? 'variante' : 'variantes'}
        </Text>
        {!published ? (
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Aún no se ve en la tienda. Para publicarlo, ábrelo en «Editar en detalle» y cambia
            el estado a Publicado.
          </Text>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {published ? (
          <Button size="small" variant="secondary" asChild>
            <a href={productUrl(product.handle)} target="_blank" rel="noopener">
              <ArrowUpRightOnBox />
              Ver en la tienda
            </a>
          </Button>
        ) : null}
        <Button size="small" variant="secondary" asChild>
          <Link to={`/products/${product.id}`}>
            <PencilSquare />
            Editar en detalle
          </Link>
        </Button>
        <Button size="small" onClick={onReset}>
          <Plus />
          Publicar otro producto
        </Button>
      </div>
    </Container>
  )
}

// ─────────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────────

const PublishProductPage = () => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [uploading, setUploading] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [created, setCreated] = useState<CreatedProduct | null>(null)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const errors = useMemo(() => validate(form), [form])
  const visibleErrors = showErrors ? errors : {}

  const basePrice = parsePrice(form.price)
  const sizes = form.hasSizes ? form.sizes : []
  const colors = form.hasColors ? form.colors : []
  const variantCount = Math.max(sizes.length, 1) * Math.max(colors.length, 1)
  const tooMany = variantCount > MAX_VARIANTS

  const priceList = sizes.length
    ? sizes.map((s) => parsePrice(form.sizePrices[s] ?? '') ?? basePrice).filter((p): p is number => p !== null)
    : basePrice !== null
      ? [basePrice]
      : []
  const minPrice = priceList.length ? Math.min(...priceList) : null
  const maxPrice = priceList.length ? Math.max(...priceList) : null

  const create = useMutation({
    mutationFn: (status: 'published' | 'draft') =>
      sdk.client.fetch<{ product: CreatedProduct }>('/admin/quick-product', {
        method: 'POST',
        body: buildBody(form, status),
      }),
    onSuccess: ({ product }) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success(
        product.status === 'published'
          ? `«${product.title}» ya está en la tienda.`
          : `Borrador «${product.title}» guardado.`,
      )
      setCreated(product)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    onError: (err: any) => {
      toast.error(err?.message ?? 'No se pudo guardar el producto. Inténtalo de nuevo.')
    },
  })

  const submit = (status: 'published' | 'draft') => {
    setShowErrors(true)
    if (Object.keys(errors).length > 0) {
      toast.error('Faltan datos: revisa los campos marcados en rojo.')
      return
    }
    if (tooMany) {
      toast.error(`Demasiadas combinaciones (${variantCount}). Máximo ${MAX_VARIANTS}.`)
      return
    }
    create.mutate(status)
  }

  const reset = () => {
    setForm(EMPTY_FORM)
    setShowErrors(false)
    setCreated(null)
    create.reset()
  }

  if (created) {
    return <SuccessPanel product={created} onReset={reset} />
  }

  const busy = create.isPending

  return (
    <Container className="divide-y p-0">
      {/* Cabecera */}
      <div className="flex flex-col gap-1 px-6 py-4">
        <Heading>Publicar producto</Heading>
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          Rellena los pasos y pulsa «Publicar». Lo técnico (variantes, precios, canal de venta,
          envío…) se hace solo.
        </Text>
      </div>

      {/* 1. Fotos */}
      <Section
        step={1}
        title="Fotos"
        description="La primera foto es la portada. Puedes subir varias, cambiar el orden o quitarlas."
      >
        <PhotosField
          images={form.images}
          onChange={(images) => set('images', images)}
          onUploadingChange={setUploading}
          error={visibleErrors.images}
          disabled={busy}
        />
      </Section>

      {/* 2. Nombre y descripción */}
      <Section step={2} title="Nombre y descripción">
        <div className="flex flex-col gap-y-2">
          <Label htmlFor="qp-title">Nombre del producto *</Label>
          <Input
            id="qp-title"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Ej: Pegatina Instagram personalizada"
            aria-invalid={Boolean(visibleErrors.title)}
            disabled={busy}
          />
          <FieldError message={visibleErrors.title} />
        </div>
        <div className="flex flex-col gap-y-2">
          <Label htmlFor="qp-desc">Descripción</Label>
          <Textarea
            id="qp-desc"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Cuenta cómo es el producto: material, acabado, para qué sirve… Deja una línea en blanco para separar párrafos."
            rows={5}
            disabled={busy}
          />
        </div>
      </Section>

      {/* 3. Categorías */}
      <Section
        step={3}
        title="Categorías"
        description="Dónde aparecerá en la tienda. Puedes marcar varias."
      >
        <CategoriesField
          selected={form.categoryIds}
          onChange={(ids) => set('categoryIds', ids)}
          disabled={busy}
        />
      </Section>

      {/* 4. Precio */}
      <Section
        step={4}
        title="Precio"
        description="En euros, con el mismo criterio que el resto de productos de la tienda: el IVA (21 %) se suma en el carrito."
      >
        <div className="flex max-w-xs flex-col gap-y-2">
          <Label htmlFor="qp-price">Precio (€) *</Label>
          <div className="flex items-center gap-2">
            <Input
              id="qp-price"
              inputMode="decimal"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              placeholder="Ej: 5,99"
              aria-invalid={Boolean(visibleErrors.price)}
              disabled={busy}
            />
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              €
            </Text>
          </div>
          <FieldError message={visibleErrors.price} />
        </div>
      </Section>

      {/* 5. Tamaños */}
      <Section step={5} title="Tamaños">
        <ToggleRow
          title="¿Tiene tamaños?"
          description="Actívalo si el cliente elige entre varios tamaños (8cm, 12cm…)."
          checked={form.hasSizes}
          onChange={(v) => set('hasSizes', v)}
          disabled={busy}
        />
        {form.hasSizes ? (
          <>
            <AddValues
              values={form.sizes}
              onAdd={(vals) => set('sizes', mergeValues(form.sizes, vals))}
              placeholder="Escribe un tamaño y pulsa Intro (ej. 12cm)"
              suggestions={SIZE_SUGGESTIONS}
              disabled={busy}
            />
            {form.sizes.length > 0 ? (
              <div className="border-ui-border-base divide-y rounded-md border">
                <div className="bg-ui-bg-subtle grid grid-cols-[1fr_180px_32px] items-center gap-3 px-3 py-2">
                  <Text size="xsmall" leading="compact" weight="plus" className="text-ui-fg-subtle">
                    Tamaño
                  </Text>
                  <Text size="xsmall" leading="compact" weight="plus" className="text-ui-fg-subtle">
                    Precio (opcional)
                  </Text>
                  <span />
                </div>
                {form.sizes.map((s) => (
                  <div key={s} className="grid grid-cols-[1fr_180px_32px] items-center gap-3 px-3 py-2">
                    <Text size="small" leading="compact" weight="plus">
                      {s}
                    </Text>
                    <Input
                      size="small"
                      inputMode="decimal"
                      value={form.sizePrices[s] ?? ''}
                      onChange={(e) =>
                        set('sizePrices', { ...form.sizePrices, [s]: e.target.value })
                      }
                      placeholder={basePrice !== null ? `${eur.format(basePrice)} (general)` : 'Precio general'}
                      disabled={busy}
                    />
                    <IconButton
                      size="small"
                      variant="transparent"
                      type="button"
                      onClick={() => {
                        const { [s]: _omit, ...rest } = form.sizePrices
                        setForm((f) => ({
                          ...f,
                          sizes: f.sizes.filter((x) => x !== s),
                          sizePrices: rest,
                        }))
                      }}
                      disabled={busy}
                      aria-label={`Quitar ${s}`}
                    >
                      <XMarkMini />
                    </IconButton>
                  </div>
                ))}
              </div>
            ) : null}
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              Si un tamaño cuesta distinto, pon su precio. Si lo dejas vacío usa el precio general.
            </Text>
            <FieldError message={visibleErrors.sizes} />
          </>
        ) : null}
      </Section>

      {/* 6. Colores */}
      <Section step={6} title="Colores">
        <ToggleRow
          title="¿Tiene colores?"
          description="Actívalo si el cliente elige el color del vinilo."
          checked={form.hasColors}
          onChange={(v) => set('hasColors', v)}
          disabled={busy}
        />
        {form.hasColors ? (
          <>
            <AddValues
              values={form.colors}
              onAdd={(vals) => set('colors', mergeValues(form.colors, vals))}
              onAddAll={() => set('colors', mergeValues(form.colors, COLOR_SUGGESTIONS))}
              placeholder="Escribe un color y pulsa Intro (ej. Negro mate)"
              suggestions={COLOR_SUGGESTIONS}
              disabled={busy}
            />
            {form.colors.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {form.colors.map((c) => (
                  <Badge key={c} size="small" className="gap-1 pr-1">
                    {c}
                    <IconButton
                      size="2xsmall"
                      variant="transparent"
                      type="button"
                      onClick={() => set('colors', form.colors.filter((x) => x !== c))}
                      disabled={busy}
                      aria-label={`Quitar ${c}`}
                    >
                      <XMarkMini />
                    </IconButton>
                  </Badge>
                ))}
              </div>
            ) : null}
            <FieldError message={visibleErrors.colors} />
          </>
        ) : null}
      </Section>

      {/* 7. Texto personalizado */}
      <Section step={7} title="Texto del cliente">
        <ToggleRow
          title="¿El cliente escribe un texto?"
          description="Por ejemplo su usuario de Instagram o un nombre para la pegatina."
          checked={form.hasCustomText}
          onChange={(v) => set('hasCustomText', v)}
          disabled={busy}
        />
        {form.hasCustomText ? (
          <div className="flex flex-col gap-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-y-2">
                <Label htmlFor="qp-ct-label">Qué le preguntamos *</Label>
                <Input
                  id="qp-ct-label"
                  value={form.customTextLabel}
                  onChange={(e) => set('customTextLabel', e.target.value)}
                  placeholder="Ej: Tu usuario de Instagram"
                  disabled={busy}
                />
              </div>
              <div className="flex flex-col gap-y-2">
                <Label htmlFor="qp-ct-ph">Ejemplo dentro de la caja</Label>
                <Input
                  id="qp-ct-ph"
                  value={form.customTextPlaceholder}
                  onChange={(e) => set('customTextPlaceholder', e.target.value)}
                  placeholder="Ej: @tuusuario"
                  disabled={busy}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Label htmlFor="qp-ct-max">Máximo de letras</Label>
                <div className="w-20">
                  <Input
                    id="qp-ct-max"
                    size="small"
                    type="number"
                    min={1}
                    max={200}
                    value={form.customTextMax}
                    onChange={(e) => set('customTextMax', e.target.value)}
                    disabled={busy}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="qp-ct-req"
                  checked={form.customTextRequired}
                  onCheckedChange={(v) => set('customTextRequired', v === true)}
                  disabled={busy}
                />
                <Label htmlFor="qp-ct-req">Obligatorio para comprar</Label>
              </div>
            </div>
            <FieldError message={visibleErrors.customText} />
          </div>
        ) : null}
      </Section>

      {/* Resumen + acciones */}
      <div className="bg-ui-bg-subtle flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <Text size="small" leading="compact" weight="plus">
            {variantCount === 1
              ? 'Se creará 1 variante'
              : `Se crearán ${variantCount} variantes`}
            {sizes.length > 0 && colors.length > 0
              ? ` (${sizes.length} tamaños × ${colors.length} colores)`
              : sizes.length > 0
                ? ` (${sizes.length} tamaños)`
                : colors.length > 0
                  ? ` (${colors.length} colores)`
                  : ' (producto sin opciones)'}
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {minPrice === null
              ? 'Falta el precio.'
              : minPrice === maxPrice
                ? `Precio: ${eur.format(minPrice)}`
                : `Precio: de ${eur.format(minPrice)} a ${eur.format(maxPrice!)}`}
            {form.images.length > 0
              ? ` · ${form.images.length} ${form.images.length === 1 ? 'foto' : 'fotos'}`
              : ''}
            {form.categoryIds.length > 0
              ? ` · ${form.categoryIds.length} ${form.categoryIds.length === 1 ? 'categoría' : 'categorías'}`
              : ' · sin categoría'}
            {form.hasCustomText ? ' · con texto del cliente' : ''}
          </Text>
          {tooMany ? (
            <Text size="small" leading="compact" className="text-ui-fg-error">
              Demasiadas combinaciones: el máximo es {MAX_VARIANTS}.
            </Text>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="small"
            variant="secondary"
            onClick={() => submit('draft')}
            disabled={busy || uploading}
            isLoading={busy && create.variables === 'draft'}
          >
            Guardar borrador
          </Button>
          <Button
            size="small"
            onClick={() => submit('published')}
            disabled={busy || uploading}
            isLoading={busy && create.variables === 'published'}
          >
            <RocketLaunch />
            Publicar
          </Button>
        </div>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: 'Publicar producto',
  icon: RocketLaunch,
})

export default PublishProductPage
