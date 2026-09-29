import { defineWidgetConfig } from '@medusajs/admin-sdk'
import { PencilSquare } from '@medusajs/icons'
import { DetailWidgetProps, HttpTypes } from '@medusajs/framework/types'
import {
  Badge,
  Button,
  Container,
  Drawer,
  Heading,
  Input,
  Label,
  Switch,
  Text,
  Textarea,
  toast,
} from '@medusajs/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'

import { sdk } from '../lib/client'

/**
 * "Texto personalizado" — permite que el cliente escriba un texto al comprar
 * (p.ej. su @usuario de Instagram en la "Pegatina Instagram").
 *
 * Se guarda en `product.metadata`:
 *   custom_text_enabled, custom_text_label, custom_text_placeholder,
 *   custom_text_max, custom_text_required, custom_text_help
 *
 * El texto que escribe el comprador llega en cada línea del pedido como
 * `line_item.metadata.custom_text` (ver widget "Textos personalizados" del
 * pedido).
 */

const DEFAULT_MAX = 30

interface CustomTextForm {
  enabled: boolean
  label: string
  placeholder: string
  max: string
  required: boolean
  help: string
}

type Metadata = Record<string, unknown> | null | undefined

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function bool(v: unknown, fallback: boolean): boolean {
  if (typeof v === 'boolean') return v
  if (v === 'true') return true
  if (v === 'false') return false
  return fallback
}

function readForm(metadata: Metadata): CustomTextForm {
  const m = metadata ?? {}
  const max = Number(m.custom_text_max)
  return {
    enabled: bool(m.custom_text_enabled, false),
    label: str(m.custom_text_label),
    placeholder: str(m.custom_text_placeholder),
    max: String(Number.isFinite(max) && max > 0 ? max : DEFAULT_MAX),
    required: bool(m.custom_text_required, true),
    help: str(m.custom_text_help),
  }
}

const ProductCustomTextWidget = ({ data: product }: DetailWidgetProps<HttpTypes.AdminProduct>) => {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CustomTextForm>(() => readForm(product.metadata))
  const [errors, setErrors] = useState<{ label?: string; max?: string }>({})

  // Display query: siempre en mount (la metadata más reciente del producto).
  const { data, isLoading } = useQuery({
    queryFn: () => sdk.admin.product.retrieve(product.id, { fields: 'id,metadata' }),
    queryKey: ['product-custom-text', product.id],
  })
  const metadata: Metadata = data?.product?.metadata ?? product.metadata
  const current = readForm(metadata)

  const save = useMutation({
    mutationFn: async (values: CustomTextForm) => {
      // Releemos la metadata justo antes de guardar para no pisar cambios
      // hechos desde otro sitio (Medusa sustituye el objeto metadata entero).
      const fresh = await sdk.admin.product.retrieve(product.id, { fields: 'id,metadata' })
      const base = (fresh.product.metadata ?? {}) as Record<string, unknown>
      const max = parseInt(values.max, 10)
      return sdk.admin.product.update(product.id, {
        metadata: {
          ...base,
          custom_text_enabled: values.enabled,
          custom_text_label: values.label.trim(),
          custom_text_placeholder: values.placeholder.trim(),
          custom_text_max: Number.isFinite(max) && max > 0 ? max : DEFAULT_MAX,
          custom_text_required: values.required,
          custom_text_help: values.help.trim(),
        },
      })
    },
    onSuccess: (_res, values) => {
      queryClient.invalidateQueries({ queryKey: ['product-custom-text', product.id] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success(
        values.enabled
          ? 'Texto personalizado activado. La web lo mostrará en 1 minuto.'
          : 'Texto personalizado desactivado.',
      )
      setOpen(false)
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar')
    },
  })

  function openDrawer(enable = false) {
    const next = readForm(metadata)
    if (enable) next.enabled = true
    setForm(next)
    setErrors({})
    setOpen(true)
  }

  function onSubmit() {
    const nextErrors: { label?: string; max?: string } = {}
    if (form.enabled) {
      if (!form.label.trim()) nextErrors.label = 'Escribe qué debe poner el cliente (la pregunta).'
      const max = parseInt(form.max, 10)
      if (!Number.isFinite(max) || max < 1 || max > 200) {
        nextErrors.max = 'Pon un número entre 1 y 200.'
      }
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    save.mutate(form)
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-x-2">
          <Heading level="h2">Texto personalizado</Heading>
          {!isLoading ? (
            current.enabled ? (
              <Badge size="2xsmall" color="green">
                Activado
              </Badge>
            ) : (
              <Badge size="2xsmall" color="grey">
                Desactivado
              </Badge>
            )
          ) : null}
        </div>
        <Button size="small" variant="secondary" onClick={() => openDrawer()}>
          <PencilSquare />
          Editar
        </Button>
      </div>

      {isLoading ? (
        <div className="px-6 py-4">
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Cargando…
          </Text>
        </div>
      ) : current.enabled ? (
        <div className="flex flex-col gap-y-3 px-6 py-4">
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            En la web, antes del botón «Añadir al carrito», el cliente verá este campo:
          </Text>
          <SummaryRow label="Pregunta" value={current.label || '—'} />
          <SummaryRow label="Ejemplo en gris" value={current.placeholder || '—'} />
          <SummaryRow label="Máximo de letras" value={current.max} />
          <SummaryRow
            label="¿Obligatorio?"
            value={current.required ? 'Sí, no se puede comprar sin escribirlo' : 'No, es opcional'}
          />
          {current.help ? <SummaryRow label="Ayuda" value={current.help} /> : null}
        </div>
      ) : (
        <div className="flex flex-col items-start gap-y-3 px-6 py-4">
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Actívalo si el cliente tiene que escribir algo al comprar este producto (su
            @usuario, un nombre, una frase…). Lo que escriba te aparecerá en el pedido.
          </Text>
          <Button size="small" variant="secondary" onClick={() => openDrawer(true)}>
            Activar texto personalizado
          </Button>
        </div>
      )}

      <Drawer open={open} onOpenChange={(o) => (save.isPending ? null : setOpen(o))}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Texto personalizado</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex flex-1 flex-col gap-y-6 overflow-auto p-4">
            <div className="flex items-start justify-between gap-x-4 rounded-lg border border-ui-border-base bg-ui-bg-subtle p-4">
              <div className="flex flex-col gap-y-1">
                <Label htmlFor="ct-enabled" size="small" weight="plus">
                  Pedir un texto al cliente
                </Label>
                <Text size="small" leading="compact" className="text-ui-fg-subtle">
                  Si lo activas, la ficha del producto mostrará un campo para que el cliente
                  escriba su texto antes de añadirlo al carrito.
                </Text>
              </div>
              <Switch
                id="ct-enabled"
                checked={form.enabled}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, enabled: checked }))}
              />
            </div>

            <fieldset
              disabled={!form.enabled}
              className={form.enabled ? 'flex flex-col gap-y-5' : 'flex flex-col gap-y-5 opacity-50'}
            >
              <Field
                id="ct-label"
                label="Pregunta que verá el cliente *"
                hint="Ej.: «Tu usuario de Instagram», «Nombre que quieres en la pegatina»."
                error={errors.label}
              >
                <Input
                  id="ct-label"
                  value={form.label}
                  placeholder="Tu usuario de Instagram"
                  onChange={(e) => {
                    setForm((f) => ({ ...f, label: e.target.value }))
                    setErrors((er) => ({ ...er, label: undefined }))
                  }}
                />
              </Field>

              <Field
                id="ct-placeholder"
                label="Ejemplo en gris dentro del campo"
                hint="Texto de ejemplo que desaparece al escribir. Ej.: «@tuusuario»."
              >
                <Input
                  id="ct-placeholder"
                  value={form.placeholder}
                  placeholder="@tuusuario"
                  onChange={(e) => setForm((f) => ({ ...f, placeholder: e.target.value }))}
                />
              </Field>

              <Field
                id="ct-max"
                label="Máximo de letras"
                hint="Incluye espacios y símbolos. Recomendado: 30."
                error={errors.max}
              >
                <Input
                  id="ct-max"
                  type="number"
                  min={1}
                  max={200}
                  value={form.max}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, max: e.target.value }))
                    setErrors((er) => ({ ...er, max: undefined }))
                  }}
                />
              </Field>

              <div className="flex items-start justify-between gap-x-4">
                <div className="flex flex-col gap-y-1">
                  <Label htmlFor="ct-required" size="small" weight="plus">
                    Obligatorio
                  </Label>
                  <Text size="small" leading="compact" className="text-ui-fg-subtle">
                    Si está activado, el cliente no podrá añadir el producto al carrito sin
                    escribir el texto.
                  </Text>
                </div>
                <Switch
                  id="ct-required"
                  checked={form.required}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, required: checked }))}
                />
              </div>

              <Field
                id="ct-help"
                label="Ayuda (opcional)"
                hint="Una frase corta bajo el campo. Ej.: «Escríbelo tal cual quieres que se imprima»."
              >
                <Textarea
                  id="ct-help"
                  rows={2}
                  value={form.help}
                  onChange={(e) => setForm((f) => ({ ...f, help: e.target.value }))}
                />
              </Field>
            </fieldset>
          </Drawer.Body>
          <Drawer.Footer>
            <div className="flex items-center justify-end gap-x-2">
              <Drawer.Close asChild>
                <Button size="small" variant="secondary" disabled={save.isPending}>
                  Cancelar
                </Button>
              </Drawer.Close>
              <Button size="small" onClick={onSubmit} isLoading={save.isPending}>
                Guardar
              </Button>
            </div>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </Container>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-2 items-start gap-x-4">
      <Text size="small" leading="compact" weight="plus">
        {label}
      </Text>
      <Text size="small" leading="compact" className="text-ui-fg-subtle break-words">
        {value}
      </Text>
    </div>
  )
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string | undefined
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-y-2">
      <Label htmlFor={id} size="small" weight="plus">
        {label}
      </Label>
      {children}
      {error ? (
        <Text size="small" leading="compact" className="text-ui-fg-error">
          {error}
        </Text>
      ) : hint ? (
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          {hint}
        </Text>
      ) : null}
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: 'product.details.after',
})

export default ProductCustomTextWidget
