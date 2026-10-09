import { defineWidgetConfig } from '@medusajs/admin-sdk'
import { Check, SquareTwoStack } from '@medusajs/icons'
import { DetailWidgetProps, HttpTypes } from '@medusajs/framework/types'
import { Badge, Button, Container, Heading, Text, toast } from '@medusajs/ui'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { sdk } from '../lib/client'
import { readLineItemChoices } from '../lib/custom-choices'

/**
 * "Textos personalizados" del pedido: lista cada línea cuyo comprador escribió
 * un texto (line_item.metadata.custom_text) o eligió alguna opción
 * (line_item.metadata.custom_choices, p. ej. la fuente), para que Nikita lo vea
 * de un vistazo y pueda copiarlo al fabricar.
 *
 * Si el pedido no tiene ninguna línea personalizada, el widget no se pinta.
 */

interface CustomTextLine {
  id: string
  product: string
  variant: string | null
  quantity: number
  thumbnail: string | null
  /** Texto escrito por el comprador (null si la línea solo lleva opciones). */
  text: string | null
  choices: { label: string; value: string }[]
}

function readCustomText(metadata: unknown): string | null {
  if (typeof metadata !== 'object' || metadata === null) return null
  const v = (metadata as Record<string, unknown>).custom_text
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t.length > 0 ? t : null
}

function toLines(items: HttpTypes.AdminOrderLineItem[] | null | undefined): CustomTextLine[] {
  const out: CustomTextLine[] = []
  for (const item of items ?? []) {
    const text = readCustomText(item.metadata)
    const choices = readLineItemChoices(item.metadata)
    if (!text && choices.length === 0) continue
    out.push({
      id: item.id,
      product: item.product_title ?? item.title ?? 'Producto',
      variant: item.variant_title && item.variant_title !== 'Default' ? item.variant_title : null,
      quantity: Number(item.quantity ?? 0),
      thumbnail: item.thumbnail ?? null,
      text,
      choices,
    })
  }
  return out
}

const OrderCustomTextsWidget = ({ data: order }: DetailWidgetProps<HttpTypes.AdminOrder>) => {
  // Display query en mount: el detalle del pedido puede no traer
  // items.metadata, así que lo pedimos explícitamente.
  const { data, isLoading } = useQuery({
    queryFn: () =>
      sdk.admin.order.retrieve(order.id, {
        fields:
          'id,items.id,items.title,items.product_title,items.variant_title,items.quantity,items.thumbnail,items.metadata',
      }),
    queryKey: ['order-custom-texts', order.id],
  })

  const lines = toLines(data?.order?.items ?? order.items)

  // Mientras carga, o si no hay textos, no ocupamos sitio en la ficha.
  if (isLoading || lines.length === 0) return null

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-x-2">
          <Heading level="h2">Textos personalizados</Heading>
          <Badge size="2xsmall" color="orange">
            {lines.length} {lines.length === 1 ? 'línea' : 'líneas'}
          </Badge>
        </div>
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          Escríbelo tal cual lo puso el cliente
        </Text>
      </div>

      {lines.map((line) => (
        <div key={line.id} className="flex items-start gap-x-4 px-6 py-4">
          {line.thumbnail ? (
            <img
              src={line.thumbnail}
              alt=""
              className="h-12 w-12 shrink-0 rounded-md border border-ui-border-base object-cover"
            />
          ) : (
            <div className="h-12 w-12 shrink-0 rounded-md border border-ui-border-base bg-ui-bg-subtle" />
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-y-2">
            <div className="flex flex-col gap-y-0.5">
              <Text size="small" leading="compact" weight="plus">
                {line.product}
              </Text>
              <Text size="small" leading="compact" className="text-ui-fg-subtle">
                {[line.variant, `${line.quantity} ud${line.quantity === 1 ? '' : 's'}.`]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </div>
            {line.text ? (
              <div className="flex items-center justify-between gap-x-3 rounded-lg border border-ui-border-base bg-ui-bg-subtle px-4 py-3">
                <span className="txt-compact-xlarge-plus min-w-0 break-all font-mono text-ui-fg-base">
                  {line.text}
                </span>
                <CopyTextButton text={line.text} />
              </div>
            ) : null}
            {line.choices.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {line.choices.map((c) => (
                  <Badge key={c.label} size="small" color="blue">
                    {c.label}: {c.value}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </Container>
  )
}

function CopyTextButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Texto copiado')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('No se pudo copiar. Selecciónalo y cópialo a mano.')
    }
  }

  return (
    <Button size="small" variant="secondary" onClick={onCopy} className="shrink-0">
      {copied ? <Check /> : <SquareTwoStack />}
      {copied ? 'Copiado' : 'Copiar'}
    </Button>
  )
}

export const config = defineWidgetConfig({
  zone: 'order.details.after',
})

export default OrderCustomTextsWidget
