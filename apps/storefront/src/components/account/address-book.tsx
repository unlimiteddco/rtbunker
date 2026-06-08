'use client'

import type { HttpTypes } from '@medusajs/types'
import { Loader2, MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { EmptyState } from '@/components/commerce/empty-state'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { COUNTRIES } from '@/lib/countries'
import { cn } from '@/lib/cn'
import { sdk } from '@/lib/medusa'

type Address = HttpTypes.StoreCustomerAddress

interface FormValues {
  address_name: string
  first_name: string
  last_name: string
  phone: string
  company: string
  address_1: string
  address_2: string
  postal_code: string
  city: string
  province: string
  country_code: string
  is_default_shipping: boolean
}

const EMPTY: FormValues = {
  address_name: '',
  first_name: '',
  last_name: '',
  phone: '',
  company: '',
  address_1: '',
  address_2: '',
  postal_code: '',
  city: '',
  province: '',
  country_code: 'es',
  is_default_shipping: false,
}

const FIELDS = 'id,addresses.*' as const

export function AddressBook() {
  const [addresses, setAddresses] = useState<Address[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Address | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function refresh() {
    const { customer } = await sdk.store.customer.retrieve({ fields: FIELDS })
    setAddresses(customer.addresses ?? [])
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof Error ? err.message : 'Error'))
  }, [])

  function openCreate() {
    setEditing(null)
    setOpen(true)
  }

  function openEdit(addr: Address) {
    setEditing(addr)
    setOpen(true)
  }

  async function handleDelete(addr: Address) {
    if (!addr.id) return
    if (!window.confirm('¿Eliminar esta dirección?')) return
    setDeletingId(addr.id)
    try {
      await sdk.store.customer.deleteAddress(addr.id)
      await refresh()
      toast.success('Dirección eliminada')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo eliminar')
    } finally {
      setDeletingId(null)
    }
  }

  if (error) {
    return (
      <p className="text-sm text-rt-danger">
        No hemos podido cargar tus direcciones. Inicia sesión de nuevo e inténtalo otra vez.
      </p>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-rt-black">Mis direcciones</h2>
          <p className="text-sm text-rt-ink-500">Gestiona las direcciones de envío de tus pedidos.</p>
        </div>
        <Button type="button" variant="primary" size="sm" onClick={openCreate} className="shrink-0">
          <Plus className="h-4 w-4" />
          Añadir
        </Button>
      </div>

      {addresses === null ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Aún no hay direcciones"
          description="Añade una dirección para que el checkout sea más rápido la próxima vez."
          action={
            <Button type="button" variant="primary" size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Añadir dirección
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {addresses.map((a) => (
            <AddressCard
              key={a.id}
              address={a}
              deleting={deletingId === a.id}
              onEdit={() => openEdit(a)}
              onDelete={() => handleDelete(a)}
            />
          ))}
        </div>
      )}

      <AddressDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        onSaved={async () => {
          setOpen(false)
          await refresh()
        }}
      />
    </div>
  )
}

function AddressCard({
  address,
  deleting,
  onEdit,
  onDelete,
}: {
  address: Address
  deleting: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const isDefault = Boolean((address as { is_default_shipping?: boolean }).is_default_shipping)
  const label = (address as { address_name?: string | null }).address_name
  return (
    <div className="relative flex flex-col rounded-[16px] border border-rt-ink-100 bg-rt-white p-5">
      <div className="mb-2 flex items-center gap-2">
        {label ? (
          <span className="font-[family-name:var(--font-heading)] text-[12px] font-bold uppercase tracking-[0.1em] text-rt-ink-700">
            {label}
          </span>
        ) : null}
        {isDefault ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-rt-yellow/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-rt-yellow-deep">
            <Star className="h-3 w-3 fill-current" />
            Predet.
          </span>
        ) : null}
      </div>

      <div className="space-y-0.5 text-sm">
        <p className="font-medium text-rt-black">
          {address.first_name} {address.last_name}
        </p>
        {address.company ? <p className="text-rt-ink-500">{address.company}</p> : null}
        <p className="text-rt-ink-500">{address.address_1}</p>
        {address.address_2 ? <p className="text-rt-ink-500">{address.address_2}</p> : null}
        <p className="text-rt-ink-500">
          {address.postal_code} {address.city}
          {address.province ? `, ${address.province}` : ''}
        </p>
        <p className="text-rt-ink-500">{address.country_code?.toUpperCase()}</p>
        {address.phone ? <p className="pt-1 text-xs text-rt-ink-500">📞 {address.phone}</p> : null}
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-rt-ink-100 pt-3">
        <Button type="button" variant="subtle" size="sm" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={deleting}
          className="text-rt-danger hover:bg-rt-danger/10 hover:text-rt-danger"
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Eliminar
        </Button>
      </div>
    </div>
  )
}

function AddressDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: Address | null
  onSaved: () => void | Promise<void>
}) {
  const [values, setValues] = useState<FormValues>(EMPTY)
  const [submitting, setSubmitting] = useState(false)

  // Rellena el formulario al abrir (crear = vacío, editar = datos existentes).
  useEffect(() => {
    if (!open) return
    if (editing) {
      setValues({
        address_name: (editing as { address_name?: string | null }).address_name ?? '',
        first_name: editing.first_name ?? '',
        last_name: editing.last_name ?? '',
        phone: editing.phone ?? '',
        company: editing.company ?? '',
        address_1: editing.address_1 ?? '',
        address_2: editing.address_2 ?? '',
        postal_code: editing.postal_code ?? '',
        city: editing.city ?? '',
        province: editing.province ?? '',
        country_code: editing.country_code ?? 'es',
        is_default_shipping: Boolean(
          (editing as { is_default_shipping?: boolean }).is_default_shipping,
        ),
      })
    } else {
      setValues(EMPTY)
    }
  }, [open, editing])

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const payload = {
      address_name: values.address_name || undefined,
      first_name: values.first_name,
      last_name: values.last_name,
      phone: values.phone || undefined,
      company: values.company || undefined,
      address_1: values.address_1,
      address_2: values.address_2 || undefined,
      postal_code: values.postal_code,
      city: values.city,
      province: values.province || undefined,
      country_code: values.country_code,
      is_default_shipping: values.is_default_shipping,
    }
    try {
      if (editing?.id) {
        await sdk.store.customer.updateAddress(
          editing.id,
          payload as HttpTypes.StoreUpdateCustomerAddress,
        )
        toast.success('Dirección actualizada')
      } else {
        await sdk.store.customer.createAddress(payload as HttpTypes.StoreCreateCustomerAddress)
        toast.success('Dirección guardada')
      }
      await onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar la dirección')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar dirección' : 'Nueva dirección'}</DialogTitle>
          <DialogDescription>
            Estos datos se usarán para el envío de tus pedidos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-3">
          <FormField label="Etiqueta" hint="opcional">
            <input
              className={inputCls}
              placeholder="Casa, Trabajo…"
              value={values.address_name}
              onChange={(e) => set('address_name', e.target.value)}
            />
          </FormField>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Nombre">
              <input
                className={inputCls}
                required
                autoComplete="given-name"
                value={values.first_name}
                onChange={(e) => set('first_name', e.target.value)}
              />
            </FormField>
            <FormField label="Apellidos">
              <input
                className={inputCls}
                required
                autoComplete="family-name"
                value={values.last_name}
                onChange={(e) => set('last_name', e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Dirección">
            <input
              className={inputCls}
              required
              autoComplete="address-line1"
              placeholder="Calle, número, piso"
              value={values.address_1}
              onChange={(e) => set('address_1', e.target.value)}
            />
          </FormField>
          <FormField label="Dirección 2" hint="opcional">
            <input
              className={inputCls}
              autoComplete="address-line2"
              placeholder="Bloque, escalera, puerta…"
              value={values.address_2}
              onChange={(e) => set('address_2', e.target.value)}
            />
          </FormField>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Código postal">
              <input
                className={inputCls}
                required
                autoComplete="postal-code"
                value={values.postal_code}
                onChange={(e) => set('postal_code', e.target.value)}
              />
            </FormField>
            <FormField label="Ciudad">
              <input
                className={inputCls}
                required
                autoComplete="address-level2"
                value={values.city}
                onChange={(e) => set('city', e.target.value)}
              />
            </FormField>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Provincia" hint="opcional">
              <input
                className={inputCls}
                autoComplete="address-level1"
                value={values.province}
                onChange={(e) => set('province', e.target.value)}
              />
            </FormField>
            <FormField label="País">
              <select
                className={inputCls}
                required
                value={values.country_code}
                onChange={(e) => set('country_code', e.target.value)}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Teléfono" hint="opcional">
            <input
              className={inputCls}
              type="tel"
              autoComplete="tel"
              value={values.phone}
              onChange={(e) => set('phone', e.target.value)}
            />
          </FormField>

          <label className="flex cursor-pointer items-center gap-2 pt-1 text-sm text-rt-ink-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-rt-ink-100 accent-rt-yellow"
              checked={values.is_default_shipping}
              onChange={(e) => set('is_default_shipping', e.target.checked)}
            />
            Usar como dirección de envío predeterminada
          </label>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="subtle"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando…
                </>
              ) : editing ? (
                'Guardar cambios'
              ) : (
                'Guardar dirección'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const inputCls = cn(
  'h-10 w-full rounded-[10px] border border-rt-ink-100 bg-rt-white px-3 text-[14px] text-rt-black outline-none transition-colors',
  'placeholder:text-rt-ink-500 focus:border-rt-yellow/60 focus:ring-2 focus:ring-rt-yellow/55',
)

function FormField({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.08em] text-rt-ink-700">
        {label}
        {hint ? <span className="text-[10px] font-medium normal-case text-rt-ink-500">({hint})</span> : null}
      </span>
      {children}
    </label>
  )
}
