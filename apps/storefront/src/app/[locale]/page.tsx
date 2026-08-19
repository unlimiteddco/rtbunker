import { setRequestLocale } from 'next-intl/server'

import { AboutBanner } from '@/components/home/about-banner'
import { CategoryGrid } from '@/components/home/category-grid'
import { CustomStickersCta } from '@/components/home/custom-stickers-cta'
import { Hero } from '@/components/home/hero'
import { HomeFaq } from '@/components/home/home-faq'
import { HomeTestimonials } from '@/components/home/home-testimonials'
import { ScrollShowcase } from '@/components/home/scroll-showcase'
import { TrustBadges } from '@/components/home/trust-badges'
import { WhyUs } from '@/components/home/why-us'
import { ProductCard } from '@/components/product/product-card'
import { Link } from '@/i18n/routing'
import { listProducts } from '@/lib/products'
import { getFeaturedReviews } from '@/lib/reviews'

export const revalidate = 60

interface HomeProps {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: HomeProps) {
  const { locale } = await params
  setRequestLocale(locale)

  const [{ products }, featuredReviews] = await Promise.all([
    listProducts({ countryCode: locale, limit: 8 }),
    getFeaturedReviews(8),
  ])

  return (
    <>
      {/* Orden de la home. Los fondos ALTERNAN carbón / claro para que nunca
          se peguen dos secciones del mismo color:
          hero(negro) · categorías(claro) · a medida(negro) · showcase(claro)
          · garantías(negro) · destacados(claro) · sobre nosotros(negro)
          · por qué(claro-2) · reseñas(claro) · faq(claro-2) */}
      <Hero />
      <CategoryGrid locale={locale} />
      <CustomStickersCta />
      <ScrollShowcase />
      <TrustBadges />

      {products.length > 0 ? (
        <section className="bg-rt-white py-20 md:py-24">
          <div className="container-page">
            <header className="mb-8 flex items-end justify-between">
              <h2 className="rt-h2">Destacados</h2>
              <Link
                href="/tienda"
                className="font-[family-name:var(--font-heading)] text-[13px] font-bold uppercase tracking-[0.18em] text-rt-black hover:text-rt-yellow"
              >
                Ver tienda →
              </Link>
            </header>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-rt-white py-20">
          <div className="container-page">
            <div className="rounded-[20px] border border-dashed border-rt-ink-100 bg-rt-white-2 p-16 text-center">
              <p className="text-rt-ink-500">
                Aún no hay productos publicados.{' '}
                <a
                  href="http://localhost:9000/app"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-rt-black hover:text-rt-yellow"
                >
                  Crea uno desde el admin →
                </a>
              </p>
            </div>
          </div>
        </section>
      )}

      <AboutBanner />
      <WhyUs />
      <HomeTestimonials reviews={featuredReviews} />
      <HomeFaq />
    </>
  )
}
