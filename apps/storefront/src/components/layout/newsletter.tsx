'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'

import { subscribeNewsletterAction } from '@/app/actions/newsletter'
import { Button } from '@/components/ui/button'

/**
 * Banda amarilla con el pitch "10% descuento" y un input píldora blanco
 * con CTA "Unirme". El sistema de diseño la coloca entre el final del
 * contenido principal y el footer carbón.
 */
export function Newsletter() {
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    startTransition(async () => {
      const res = await subscribeNewsletterAction(fd)
      if (res.ok) {
        toast.success(res.message ?? '¡Suscrito!')
        form.reset()
      } else {
        toast.error(res.message ?? 'Error')
      }
    })
  }

  return (
    <section className="bg-rt-yellow text-rt-black">
      <div className="container-page py-14 md:py-20">
        <div className="grid gap-8 md:grid-cols-[1.3fr_1fr] md:items-center md:gap-12">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.22em] font-[family-name:var(--font-heading)]">
              Suscríbete y obtén un 10% de descuento 📦
            </p>
            <h3 className="mt-2 max-w-[640px] font-[family-name:var(--font-heading)] text-[clamp(20px,2.4vw,28px)] font-extrabold leading-[1.15] tracking-[-0.01em]">
              Suscríbete para obtener un 10% de descuento en tu primera compra.
            </h3>
          </div>

          <form
            onSubmit={onSubmit}
            className="flex items-center gap-2 rounded-full bg-rt-white p-1.5 shadow-[var(--shadow-sm)]"
          >
            <input
              type="email"
              name="email"
              required
              placeholder="tu@email.com"
              aria-label="Email"
              className="flex-1 bg-transparent px-5 py-3 text-[15px] font-medium text-rt-black outline-none placeholder:text-rt-ink-500"
            />
            <Button type="submit" variant="dark" size="default" disabled={pending}>
              {pending ? '…' : 'Unirme'}
            </Button>
          </form>
        </div>
      </div>
    </section>
  )
}
