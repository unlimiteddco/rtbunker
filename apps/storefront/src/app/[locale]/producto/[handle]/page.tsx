import type { Metadata } from 'next'
import { ChevronRight } from 'lucide-react'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'

import { ProductCard } from '@/components/product/product-card'
import { ProductGallery } from '@/components/product/product-gallery'
import { ProductInfoTabs } from '@/components/product/product-info-tabs'
import { ProductReviews } from '@/components/product/product-reviews'
import { StarRating } from '@/components/product/star-rating'
import { StickyMobileCta } from '@/components/product/sticky-mobile-cta'
import { VariantSelector } from '@/components/product/variant-selector'
import { ProductJsonLd } from '@/components/seo/product-jsonld'
import { env } from '@/../env'
import { Link } from '@/i18n/routing'
import { getCurrentCustomer } from '@/lib/auth'
import { getProductByHandle } from '@/lib/products'
import { listRelatedProducts } from '@/lib/related'
import { getProductReviews } from '@/lib/reviews'

export const revalidate = 60

interface ProductPageProps {
  params: Promise<{ locale: string; handle: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { locale, handle } = await params
  const { product } = await getProductByHandle(handle, locale)
  if (!product) return {}
  return {
    title: product.title,
    description: product.description ?? product.subtitle ?? undefined,
    openGraph: {
      title: product.title,
      description: product.description ?? undefined,
      images: product.thumbnail ? [{ url: product.thumbnail }] : [],
      type: 'website',
    },
    alternates: {
      canonical: `${env.NEXT_PUBLIC_BASE_URL}/${locale}/producto/${handle}`,
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale, handle } = await params
  setRequestLocale(locale)

  const { product } = await getProductByHandle(handle, locale)
  if (!product) notFound()

  const productUrl = `${env.NEXT_PUBLIC_BASE_URL}/${locale}/producto/${handle}`

  // Precio mínimo entre variantes — usado por la sticky mobile CTA cuando
  // todavía no se ha elegido variante.
  const minPrice =
    Math.min(
      ...(product.variants ?? [])
        .map((v) => v.calculated_price?.calculated_amount ?? 0)
        .filter((n) => n > 0),
    ) || 0
  const currency = product.variants?.[0]?.calculated_price?.currency_code ?? 'eur'
  const firstCategory = (product.categories ?? [])[0]

  const details = [
    product.weight ? { label: 'Peso', value: `${product.weight} g` } : null,
    product.material ? { label: 'Material', value: product.material } : null,
    product.origin_country ? { label: 'Origen', value: product.origin_country } : null,
    { label: 'Fabricación', value: 'Artesanal · Cuarte de Huerva (España)' },
    { label: 'Envío', value: '24–72 h' },
  ].filter((d): d is { label: string; value: string } => d !== null)

  const related = await listRelatedProducts({
    productId: product.id,
    categoryIds: (product.categories ?? []).map((c) => c.id),
    countryCode: locale,
    limit: 4,
  })

  const [reviews, customer] = await Promise.all([
    getProductReviews(product.id),
    getCurrentCustomer(),
  ])

  return (
    <>
      <div className="container-page py-6 md:py-10">
        <ProductJsonLd
          product={product}
          url={productUrl}
          rating={
            reviews.count > 0
              ? { average: reviews.average, count: reviews.count }
              : undefined
          }
        />

        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-1.5 text-[12px] text-rt-ink-500 font-[family-name:var(--font-heading)] font-semibold uppercase tracking-[0.12em]"
        >
          <Link href="/" className="transition-colors hover:text-rt-black">
            Inicio
          </Link>
          <ChevronRight className="h-3 w-3" />
          {firstCategory ? (
            <>
              <Link
                href={`/categoria/${firstCategory.handle}`}
                className="line-clamp-1 transition-colors hover:text-rt-black"
              >
                {firstCategory.name}
              </Link>
              <ChevronRight className="h-3 w-3" />
            </>
          ) : null}
          <span className="line-clamp-1 normal-case tracking-normal text-rt-black">
            {product.title}
          </span>
        </nav>

        <article className="grid grid-cols-1 items-start gap-10 md:grid-cols-2 md:gap-16">
          {/* Galería sticky en desktop: a medida que el lado derecho hace
              scroll, la foto se queda fija a la altura del header (que vive
              en sticky top-0 con altura ~72px → top-24 = 96px da margen). */}
          <div className="group md:sticky md:top-24 md:self-start">
            <ProductGallery
              images={(product.images ?? []).map((i) => ({ id: i.id, url: i.url }))}
              alt={product.title}
              fallbackThumbnail={product.thumbnail}
            />
          </div>

          <div className="flex flex-col gap-8">
            <header className="space-y-3">
              {firstCategory ? (
                <Link
                  href={`/categoria/${firstCategory.handle}`}
                  className="text-eyebrow inline-block transition-colors hover:text-rt-black"
                >
                  {firstCategory.name}
                </Link>
              ) : null}
              <h1 className="font-[family-name:var(--font-display)] text-[44px] uppercase leading-[1.02] tracking-[-0.02em] text-rt-black md:text-[56px]">
                {product.title.replace(/^Pegatina\s+/i, '')}
              </h1>
              {reviews.count > 0 ? (
                <a
                  href="#reviews"
                  className="inline-flex items-center gap-2 text-[13px] text-rt-ink-500 transition-colors hover:text-rt-black"
                >
                  <StarRating value={reviews.average} size={15} />
                  <span className="font-semibold text-rt-black">
                    {reviews.average.toFixed(1)}
                  </span>
                  <span>
                    · {reviews.count} {reviews.count === 1 ? 'reseña' : 'reseñas'}
                  </span>
                </a>
              ) : null}
              {product.subtitle ? (
                <p className="max-w-prose text-[15px] leading-[1.6] text-rt-ink-500">
                  {product.subtitle.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}
                </p>
              ) : null}
            </header>

            <VariantSelector product={product} countryCode={locale} />

            <ProductInfoTabs description={product.description} details={details} />
          </div>
        </article>

        <ProductReviews
          productId={product.id}
          initial={reviews}
          defaultEmail={customer?.email ?? null}
          defaultName={customer?.first_name ?? null}
        />

        {related.length > 0 ? (
          <section className="mt-20">
            <h2 className="rt-h3 mb-6">También te puede gustar</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} locale={locale} />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <StickyMobileCta amount={minPrice} currency={currency} locale={locale} />
    </>
  )
}
