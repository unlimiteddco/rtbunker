import { defineWidgetConfig } from '@medusajs/admin-sdk'
import { PencilSquare } from '@medusajs/icons'
import { DetailWidgetProps, HttpTypes } from '@medusajs/framework/types'
import { Badge, Button, Container, Drawer, Heading, Text, toast } from '@medusajs/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { ChoicesEditor } from '../components/choices-editor'
import { sdk } from '../lib/client'
import {
  choicesToDrafts,
  CUSTOM_CHOICES_KEY,
  draftsToChoices,
  emptyChoiceDraft,
  readCustomChoices,
  validateChoiceDrafts,
  type CustomChoiceDraft,
} from '../lib/custom-choices'

/**
 * "Opciones a elegir" — cosas que el cliente elige al comprar este producto y
 * que NO cambian el precio ni crean variantes (la fuente de la pegatina de
 * Instagram, la orientación…). Se guarda en `product.metadata.custom_choices`.
 *
 * Lo que elija el comprador llega en cada línea del pedido como
 * `line_item.metadata.custom_choices` (ver widget "Textos personalizados").
 */
const ProductCustomChoicesWidget = ({
  data: product,
}: DetailWidgetProps<HttpTypes.AdminProduct>) => {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [drafts, setDrafts] = useState<CustomChoiceDraft[]>([])
  const [error, setError] = useState<string | null>(null)

  // Display query: siempre en mount (la metadata más reciente del producto).
  const { data, isLoading } = useQuery({
    queryFn: () => sdk.admin.product.retrieve(product.id, { fields: 'id,metadata' }),
    queryKey: ['product-custom-choices', product.id],
  })
  const current = readCustomChoices(data?.product?.metadata ?? product.metadata)

  const save = useMutation({
    mutationFn: async (next: CustomChoiceDraft[]) => {
      // Releemos la metadata justo antes de guardar para no pisar cambios
      // hechos desde otro sitio (Medusa sustituye el objeto metadata entero).
      const fresh = await sdk.admin.product.retrieve(product.id, { fields: 'id,metadata' })
      const base = (fresh.product.metadata ?? {}) as Record<string, unknown>
      return sdk.admin.product.update(product.id, {
        metadata: { ...base, [CUSTOM_CHOICES_KEY]: draftsToChoices(next) },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-custom-choices', product.id] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Opciones guardadas. La web las mostrará en 1 minuto.')
      setOpen(false)
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar')
    },
  })

  function openDrawer() {
    setDrafts(current.length > 0 ? choicesToDrafts(current) : [emptyChoiceDraft()])
    setError(null)
    setOpen(true)
  }

  function onSubmit() {
    const problem = validateChoiceDrafts(drafts)
    if (problem) {
      setError(problem)
      return
    }
    save.mutate(drafts)
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-x-2">
          <Heading level="h2">Opciones a elegir</Heading>
          {!isLoading ? (
            <Badge size="2xsmall" color={current.length > 0 ? 'green' : 'grey'}>
              {current.length > 0 ? `${current.length} activa${current.length === 1 ? '' : 's'}` : 'Ninguna'}
            </Badge>
          ) : null}
        </div>
        <Button size="small" variant="secondary" onClick={openDrawer}>
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
      ) : current.length === 0 ? (
        <div className="px-6 py-4">
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Úsalo cuando el cliente tenga que elegir algo que no cambia el precio, como la fuente
            o la orientación. No crea variantes nuevas: aparece en la web como un selector y lo
            que elija te llega en el pedido.
          </Text>
        </div>
      ) : (
        <div className="flex flex-col gap-y-3 px-6 py-4">
          {current.map((c) => (
            <div key={c.label} className="grid grid-cols-[140px_1fr] items-start gap-x-4">
              <Text size="small" leading="compact" weight="plus">
                {c.label}
                {c.required ? '' : ' (opcional)'}
              </Text>
              <Text size="small" leading="compact" className="text-ui-fg-subtle">
                {c.options.join(' · ')}
              </Text>
            </div>
          ))}
        </div>
      )}

      <Drawer open={open} onOpenChange={(o) => (save.isPending ? null : setOpen(o))}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Opciones a elegir</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex flex-1 flex-col gap-y-4 overflow-y-auto p-4">
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              Cada bloque es algo que el cliente elige antes de añadir al carrito. No cambia el
              precio. Para quitarlas todas, borra los bloques y guarda.
            </Text>
            <ChoicesEditor value={drafts} onChange={setDrafts} disabled={save.isPending} />
            {error ? (
              <Text size="small" leading="compact" className="text-ui-fg-error">
                {error}
              </Text>
            ) : null}
          </Drawer.Body>
          <Drawer.Footer>
            <Drawer.Close asChild>
              <Button size="small" variant="secondary" disabled={save.isPending}>
                Cancelar
              </Button>
            </Drawer.Close>
            <Button
              size="small"
              onClick={onSubmit}
              disabled={save.isPending}
              isLoading={save.isPending}
            >
              Guardar
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: 'product.details.after',
})

export default ProductCustomChoicesWidget
