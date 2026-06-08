'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import type { HttpTypes } from '@medusajs/types'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { addressSchema, type AddressFormValues } from '@/lib/checkout-schema'
import { COUNTRIES, type CountryCode } from '@/lib/countries'
import { sdk } from '@/lib/medusa'

interface AddressStepProps {
  cart: HttpTypes.StoreCart
  onContinue: (cart: HttpTypes.StoreCart) => void
  /** DNI guardado en la cuenta del customer (metadata.dni) para precargar. */
  defaultDni?: string | null
}

export function AddressStep({ cart, onContinue, defaultDni }: AddressStepProps) {
  const [pending, startTransition] = useTransition()

  // Resolución del DNI inicial: prioridad → metadata del cart > customer > vacío.
  const cartDni =
    (cart.metadata as { dni?: string } | null | undefined)?.dni ?? ''
  const initialDni = cartDni || defaultDni || ''

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      email: cart.email ?? '',
      phone: cart.shipping_address?.phone ?? '',
      first_name: cart.shipping_address?.first_name ?? '',
      last_name: cart.shipping_address?.last_name ?? '',
      dni: initialDni,
      address_1: cart.shipping_address?.address_1 ?? '',
      address_2: cart.shipping_address?.address_2 ?? '',
      city: cart.shipping_address?.city ?? '',
      postal_code: cart.shipping_address?.postal_code ?? '',
      country_code: ((cart.shipping_address?.country_code as CountryCode) ?? 'es') as CountryCode,
    },
  })

  function onSubmit(values: AddressFormValues) {
    startTransition(async () => {
      try {
        const { cart: updated } = await sdk.store.cart.update(cart.id, {
          email: values.email,
          shipping_address: {
            first_name: values.first_name,
            last_name: values.last_name,
            address_1: values.address_1,
            address_2: values.address_2 || undefined,
            city: values.city,
            postal_code: values.postal_code,
            country_code: values.country_code,
            phone: values.phone || undefined,
          },
          billing_address: {
            first_name: values.first_name,
            last_name: values.last_name,
            address_1: values.address_1,
            address_2: values.address_2 || undefined,
            city: values.city,
            postal_code: values.postal_code,
            country_code: values.country_code,
            phone: values.phone || undefined,
          },
          metadata: {
            ...((cart.metadata as Record<string, unknown> | null | undefined) ?? {}),
            dni: values.dni, // viene normalizado (uppercase, sin espacios) del transform del schema
          },
        })
        onContinue(updated)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error guardando la dirección')
      }
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
        {form.formState.errors.email ? (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="first_name">Nombre</Label>
          <Input id="first_name" autoComplete="given-name" {...form.register('first_name')} />
          {form.formState.errors.first_name ? (
            <p className="text-xs text-destructive">{form.formState.errors.first_name.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Apellidos</Label>
          <Input id="last_name" autoComplete="family-name" {...form.register('last_name')} />
          {form.formState.errors.last_name ? (
            <p className="text-xs text-destructive">{form.formState.errors.last_name.message}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dni">DNI / NIE / CIF</Label>
        <Input
          id="dni"
          autoComplete="off"
          placeholder="12345678A"
          className="uppercase"
          {...form.register('dni')}
        />
        {form.formState.errors.dni ? (
          <p className="text-xs text-destructive">{form.formState.errors.dni.message}</p>
        ) : (
          <p className="text-xs text-muted-foreground">Imprescindible para emitir factura.</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address_1">Dirección</Label>
        <Input
          id="address_1"
          autoComplete="address-line1"
          placeholder="Calle, número"
          {...form.register('address_1')}
        />
        {form.formState.errors.address_1 ? (
          <p className="text-xs text-destructive">{form.formState.errors.address_1.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address_2">Dirección 2 (opcional)</Label>
        <Input
          id="address_2"
          autoComplete="address-line2"
          placeholder="Piso, puerta, escalera"
          {...form.register('address_2')}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="postal_code">Código postal</Label>
          <Input
            id="postal_code"
            autoComplete="postal-code"
            inputMode="numeric"
            {...form.register('postal_code')}
          />
          {form.formState.errors.postal_code ? (
            <p className="text-xs text-destructive">{form.formState.errors.postal_code.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Ciudad</Label>
          <Input id="city" autoComplete="address-level2" {...form.register('city')} />
          {form.formState.errors.city ? (
            <p className="text-xs text-destructive">{form.formState.errors.city.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="country_code">País</Label>
          <Select id="country_code" {...form.register('country_code')}>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono (opcional)</Label>
          <Input id="phone" type="tel" autoComplete="tel" {...form.register('phone')} />
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? 'Guardando…' : 'Continuar a envío'}
      </Button>
    </form>
  )
}
