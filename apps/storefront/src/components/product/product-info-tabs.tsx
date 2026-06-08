'use client'

import { Package, RotateCcw, Truck } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { htmlToText } from '@/lib/html'

interface ProductInfoTabsProps {
  description?: string | null
  details?: { label: string; value: string }[]
}

export function ProductInfoTabs({ description, details = [] }: ProductInfoTabsProps) {
  const t = useTranslations('product')
  const cleanDescription = htmlToText(description)

  return (
    <Tabs defaultValue="description" className="w-full">
      <TabsList>
        <TabsTrigger value="description">{t('description')}</TabsTrigger>
        <TabsTrigger value="details">{t('details')}</TabsTrigger>
        <TabsTrigger value="shipping">Envíos y devoluciones</TabsTrigger>
      </TabsList>

      <TabsContent value="description">
        {cleanDescription ? (
          <div className="prose prose-sm max-w-none whitespace-pre-line text-foreground/80">
            {cleanDescription}
          </div>
        ) : (
          <p className="text-muted-foreground">Sin descripción.</p>
        )}
      </TabsContent>

      <TabsContent value="details">
        {details.length > 0 ? (
          <dl className="divide-y divide-border rounded-md border border-border">
            {details.map((d) => (
              <div key={d.label} className="grid grid-cols-2 gap-2 px-4 py-3 text-sm">
                <dt className="text-muted-foreground">{d.label}</dt>
                <dd className="font-medium">{d.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-muted-foreground">Sin detalles adicionales.</p>
        )}
      </TabsContent>

      <TabsContent value="shipping" className="space-y-3">
        <div className="flex gap-3 rounded-md border border-border p-4">
          <Truck className="h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="font-medium">Envío en 24-48h</p>
            <p className="text-sm text-muted-foreground">
              Para pedidos en península. Tarifa calculada en checkout según destino.
            </p>
          </div>
        </div>
        <div className="flex gap-3 rounded-md border border-border p-4">
          <RotateCcw className="h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="font-medium">14 días para devolver</p>
            <p className="text-sm text-muted-foreground">
              Sin preguntas. Reembolso al método de pago original.
            </p>
          </div>
        </div>
        <div className="flex gap-3 rounded-md border border-border p-4">
          <Package className="h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="font-medium">Embalaje cuidado</p>
            <p className="text-sm text-muted-foreground">
              Materiales reciclables siempre que es posible.
            </p>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
