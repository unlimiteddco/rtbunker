'use client'

import { CheckCircle2, ImagePlus, Loader2, ShieldCheck, Star, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { StarRating } from '@/components/product/star-rating'
import { cn } from '@/lib/cn'
import { sdk } from '@/lib/medusa'
import type { ProductReview, ProductReviewsData } from '@/lib/reviews'

const MAX_PHOTOS = 6
const MAX_PHOTO_BYTES = 8 * 1024 * 1024 // 8 MB
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface PhotoDraft {
  id: string
  file: File
  preview: string
}

interface ProductReviewsProps {
  productId: string
  initial: ProductReviewsData
  defaultEmail?: string | null
  defaultName?: string | null
}

export function ProductReviews({
  productId,
  initial,
  defaultEmail,
  defaultName,
}: ProductReviewsProps) {
  const [showForm, setShowForm] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  return (
    <section id="reviews" className="mt-20 scroll-mt-28">
      <div className="flex flex-col gap-2 border-t border-rt-black/10 pt-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="rt-h3">Valoraciones</h2>
          <p className="mt-1 text-[14px] text-rt-ink-500">
            {initial.count > 0
              ? `${initial.count} ${initial.count === 1 ? 'reseña verificada' : 'reseñas de clientes'}`
              : 'Sé el primero en valorar este producto.'}
          </p>
        </div>
        {!showForm && !submitted ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 self-start rounded-[12px] border-2 border-rt-black bg-transparent px-5 py-2.5 text-[13px] font-bold uppercase tracking-[0.1em] text-rt-black transition-colors hover:bg-rt-black hover:text-rt-white font-[family-name:var(--font-heading)] sm:self-auto"
          >
            <Star className="h-4 w-4" />
            Escribir reseña
          </button>
        ) : null}
      </div>

      {/* Resumen */}
      {initial.count > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <span className="font-[family-name:var(--font-display)] text-[56px] leading-none text-rt-black">
              {initial.average.toFixed(1)}
            </span>
            <StarRating value={initial.average} size={18} />
            <span className="text-[12px] text-rt-ink-500">sobre 5</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {[5, 4, 3, 2, 1].map((n) => {
              const c = initial.distribution[n] ?? 0
              const pct = initial.count > 0 ? (c / initial.count) * 100 : 0
              return (
                <div key={n} className="flex items-center gap-3">
                  <span className="w-10 shrink-0 text-[12px] tabular-nums text-rt-ink-500">
                    {n} ★
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-rt-black/10">
                    <div
                      className="h-full rounded-full bg-rt-yellow"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-[12px] tabular-nums text-rt-ink-500">
                    {c}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      {/* Formulario / éxito */}
      {submitted ? (
        <div className="mt-8 flex items-start gap-3 rounded-[16px] border border-rt-yellow/40 bg-rt-yellow/10 p-5">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-rt-yellow-deep" />
          <div>
            <p className="text-[15px] font-bold text-rt-black">¡Gracias por tu reseña!</p>
            <p className="mt-1 text-[13px] leading-[1.5] text-rt-ink-500">
              La revisaremos en breve y se publicará aquí en cuanto la aprobemos.
            </p>
          </div>
        </div>
      ) : showForm ? (
        <ReviewForm
          productId={productId}
          defaultEmail={defaultEmail}
          defaultName={defaultName}
          onCancel={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false)
            setSubmitted(true)
          }}
        />
      ) : null}

      {/* Lista */}
      {initial.reviews.length > 0 ? (
        <ul className="mt-12 flex flex-col gap-8">
          {initial.reviews.map((r) => (
            <ReviewItem key={r.id} review={r} />
          ))}
        </ul>
      ) : null}
    </section>
  )
}

function ReviewItem({ review }: { review: ProductReview }) {
  const date = new Date(review.created_at).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return (
    <li className="border-b border-rt-black/8 pb-8 last:border-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <StarRating value={review.rating} size={15} />
        {review.title ? (
          <span className="text-[15px] font-bold text-rt-black">{review.title}</span>
        ) : null}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px] text-rt-ink-500">
        <span className="font-semibold text-rt-black">{review.name ?? 'Cliente'}</span>
        {review.verified_purchase ? (
          <span className="inline-flex items-center gap-1 text-rt-yellow-deep">
            <ShieldCheck className="h-3.5 w-3.5" />
            Compra verificada
          </span>
        ) : null}
        <span>·</span>
        <span>{date}</span>
      </div>
      {review.content ? (
        <p className="mt-3 max-w-prose whitespace-pre-wrap text-[14px] leading-[1.6] text-rt-ink-500">
          {review.content}
        </p>
      ) : null}
      {Array.isArray(review.images) && review.images.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {review.images.map((src) => (
            <li key={src}>
              <a
                href={src}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-[10px] border border-rt-black/10 transition-opacity hover:opacity-90"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt="Foto de la reseña"
                  className="h-[88px] w-[88px] object-cover"
                />
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      {review.admin_response ? (
        <div className="mt-4 rounded-[12px] border-l-2 border-rt-yellow bg-rt-black/[0.03] px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-rt-ink-500 font-[family-name:var(--font-heading)]">
            Respuesta de RT Bunker
          </p>
          <p className="mt-1 whitespace-pre-wrap text-[13px] leading-[1.55] text-rt-ink-500">
            {review.admin_response}
          </p>
        </div>
      ) : null}
    </li>
  )
}

function ReviewForm({
  productId,
  defaultEmail,
  defaultName,
  onCancel,
  onSuccess,
}: {
  productId: string
  defaultEmail?: string | null | undefined
  defaultName?: string | null | undefined
  onCancel: () => void
  onSuccess: () => void
}) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [name, setName] = useState(defaultName ?? '')
  const [email, setEmail] = useState(defaultEmail ?? '')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [photos, setPhotos] = useState<PhotoDraft[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function addPhotos(files: FileList | null) {
    if (!files || files.length === 0) return
    setError(null)
    setPhotos((prev) => {
      const next = [...prev]
      for (const file of Array.from(files)) {
        if (next.length >= MAX_PHOTOS) {
          setError(`Puedes subir un máximo de ${MAX_PHOTOS} fotos.`)
          break
        }
        if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
          setError('Solo se admiten imágenes JPG, PNG o WebP.')
          continue
        }
        if (file.size > MAX_PHOTO_BYTES) {
          setError('Cada foto debe pesar menos de 8 MB.')
          continue
        }
        next.push({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file) })
      }
      return next
    })
    // Permite volver a seleccionar el mismo archivo tras quitarlo.
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removePhoto(id: string) {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id)
      if (target) URL.revokeObjectURL(target.preview)
      return prev.filter((p) => p.id !== id)
    })
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (rating < 1) {
      setError('Elige una puntuación de 1 a 5 estrellas.')
      return
    }
    if (!email) {
      setError('Necesitamos tu email para verificar la reseña.')
      return
    }
    setSubmitting(true)
    try {
      // 1. Subir cada foto al backend (R2). El SDK fija content-type:json por
      //    defecto y rompe multipart — hay que neutralizarlo explícitamente.
      const imageUrls: string[] = []
      for (const photo of photos) {
        const formData = new FormData()
        formData.append('file', photo.file)
        const uploaded = await sdk.client.fetch<{ url: string }>(
          '/store/reviews/upload',
          {
            method: 'POST',
            body: formData,
            headers: { 'content-type': null as unknown as string },
          },
        )
        imageUrls.push(uploaded.url)
      }

      // 2. Crear la reseña con las URLs de las fotos.
      await sdk.client.fetch('/store/reviews', {
        method: 'POST',
        body: {
          product_id: productId,
          email,
          name: name || null,
          rating,
          title: title || null,
          content: content || null,
          images: imageUrls.length > 0 ? imageUrls : null,
        },
      })
      photos.forEach((p) => URL.revokeObjectURL(p.preview))
      toast.success('Reseña enviada · pendiente de aprobación')
      onSuccess()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo enviar la reseña'
      setError(
        message.includes('Ya has dejado')
          ? 'Ya has reseñado este producto.'
          : message,
      )
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 space-y-4 rounded-[20px] border border-rt-black/10 bg-rt-black/[0.02] p-6"
    >
      <div>
        <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.14em] text-rt-black font-[family-name:var(--font-heading)]">
          Tu puntuación
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${n} estrellas`}
              className="p-0.5"
            >
              <Star
                className={cn(
                  'h-7 w-7 transition-colors',
                  (hover || rating) >= n ? 'text-rt-yellow' : 'text-rt-ink-300',
                )}
                fill={(hover || rating) >= n ? 'currentColor' : 'none'}
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre (opcional)"
          maxLength={80}
          className="block w-full rounded-[12px] border border-rt-black/15 bg-rt-white px-4 py-3 text-[15px] text-rt-black placeholder:text-rt-ink-300 transition-colors focus:border-rt-black focus:outline-none"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          autoComplete="email"
          className="block w-full rounded-[12px] border border-rt-black/15 bg-rt-white px-4 py-3 text-[15px] text-rt-black placeholder:text-rt-ink-300 transition-colors focus:border-rt-black focus:outline-none"
        />
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título (opcional)"
        maxLength={120}
        className="block w-full rounded-[12px] border border-rt-black/15 bg-rt-white px-4 py-3 text-[15px] text-rt-black placeholder:text-rt-ink-300 transition-colors focus:border-rt-black focus:outline-none"
      />

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="¿Qué te ha parecido? Calidad, adhesivo, acabado…"
        rows={4}
        maxLength={2000}
        className="block w-full resize-none rounded-[12px] border border-rt-black/15 bg-rt-white px-4 py-3 text-[15px] text-rt-black placeholder:text-rt-ink-300 transition-colors focus:border-rt-black focus:outline-none"
      />

      {/* Fotos */}
      <div>
        <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.14em] text-rt-black font-[family-name:var(--font-heading)]">
          Fotos (opcional)
        </label>
        <div className="flex flex-wrap gap-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative h-20 w-20 overflow-hidden rounded-[12px] border border-rt-black/15"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.preview}
                alt="Vista previa"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                aria-label="Quitar foto"
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rt-black/70 text-rt-white transition-colors hover:bg-rt-black"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-[12px] border border-dashed border-rt-black/25 text-rt-ink-500 transition-colors hover:border-rt-black hover:text-rt-black"
            >
              <ImagePlus className="h-5 w-5" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em]">
                Añadir
              </span>
            </button>
          ) : null}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => addPhotos(e.target.files)}
          className="hidden"
        />
        <p className="mt-2 text-[12px] text-rt-ink-500">
          Hasta {MAX_PHOTOS} fotos · JPG, PNG o WebP · máx. 8 MB cada una.
        </p>
      </div>

      {error ? <p className="text-[13px] font-medium text-rt-danger">{error}</p> : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-rt-black px-6 py-3 text-[14px] font-bold uppercase tracking-[0.1em] text-rt-white transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 font-[family-name:var(--font-heading)]"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando…
            </>
          ) : (
            'Publicar reseña'
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="text-[13px] font-bold uppercase tracking-[0.1em] text-rt-ink-500 transition-colors hover:text-rt-black font-[family-name:var(--font-heading)]"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
