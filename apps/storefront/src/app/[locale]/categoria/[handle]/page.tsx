import type { Metadata } from 'next'
import { ChevronRight, Package } from 'lucide-react'
import { notFound } from 'next/navigation'
import { setRequestLocale, getTranslations } from 'next-intl/server'

import { EmptyState } from '@/components/commerce/empty-state'
import { ProductCard } from '@/components/product/product-card'
import { CategoryFilter } from '@/components/shop/category-filter'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'
import { getCategoryByHandle, getCategoryTree, listCategories, listProducts } from '@/lib/products'

export const revalidate = 60

interface CategoryPageProps {
  params: Promise<{ locale: string; handle: string }>
  searchParams: Promise<{ order?: string; page?: string }>
}

export async function generateStaticParams() {
  // Si el backend no está accesible en build-time (p. ej. al construir la
  // imagen Docker en CI), no pre-generamos nada: las categorías se renderizan
  // bajo demanda en runtime (dynamicParams es true por defecto).
  try {
    const categories = await listCategories()
    return categories.map((c) => ({ handle: c.handle }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { locale, handle } = await params
  try {
    const match = await getCategoryByHandle(handle)
    if (!match) return { title: 'Categoría · RT Bunker' }
    const { category } = match
    const description =
      category.description?.trim() ||
      `Compra ${category.name.toLowerCase()} en RT Bunker. Vinilo premium fabricado en España con envío en 24–48 h.`
    return {
      title: `${category.name} · RT Bunker`,
      description,
      alternates: { canonical: `/${locale}/categoria/${handle}` },
      openGraph: { title: `${category.name} · RT Bunker`, description },
    }
  } catch (error) {
    console.error(`[categoria/${handle}] generateMetadata falló:`, error)
    return { title: 'Categoría · RT Bunker' }
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { locale, handle } = await params
  const { order, page } = await searchParams
  setRequestLocale(locale)

  // La categoría puede no existir (handle inválido) o el backend puede fallar.
  // En el primer caso → 404 limpio; en el segundo no rompemos con un 500.
  let match: Awaited<ReturnType<typeof getCategoryByHandle>>
  try {
    match = await getCategoryByHandle(handle)
  } catch (error) {
    console.error(`[categoria/${handle}] getCategoryByHandle lanzó:`, error)
    notFound()
  }
  if (!match) notFound()
  const { category, descendantIds } = match

  const t = await getTranslations('shop')
  const limit = 12
  const currentPage = parseInt(page ?? '1', 10) || 1
  const offset = (currentPage - 1) * limit

  // Si el árbol de categorías o el listado de productos falla en runtime,
  // renderizamos la categoría con los datos disponibles (vacío) en vez de 500.
  let categoryTree: Awaited<ReturnType<typeof getCategoryTree>> = []
  let products: Awaited<ReturnType<typeof listProducts>>['products'] = []
  let count = 0
  try {
    const [tree, productsResult] = await Promise.all([
      getCategoryTree(),
      listProducts({
        countryCode: locale,
        limit,
        offset,
        category_id: descendantIds,
        ...(order ? { order } : {}),
      }),
    ])
    categoryTree = tree
    products = productsResult.products
    count = productsResult.count
  } catch (error) {
    console.error(`[categoria/${handle}] fallo al cargar árbol/productos:`, error)
  }

  const totalPages = Math.ceil(count / limit)
  const buildHref = (n: number) =>
    `/categoria/${handle}?${new URLSearchParams({
      ...(order ? { order } : {}),
      page: String(n),
    }).toString()}`

  return (
    <div className="container-page py-8 md:py-12">
      {/* Breadcrumb: Inicio › Categoría */}
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-1.5 text-[12px] text-rt-ink-500 font-[family-name:var(--font-heading)] font-semibold uppercase tracking-[0.12em]"
      >
        <Link href="/" className="transition-colors hover:text-rt-black">
          Inicio
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="line-clamp-1 text-rt-black">{category.name}</span>
      </nav>

      <header className="mb-10 max-w-2xl">
        <p className="text-eyebrow mb-2">Categoría</p>
        <h1 className="font-[family-name:var(--font-display)] text-[48px] uppercase leading-[1.02] tracking-[-0.02em] text-rt-black md:text-[64px]">
          {category.name}
        </h1>
        {category.description?.trim() ? (
          <p className="mt-4 text-[15px] leading-[1.6] text-rt-ink-500">{category.description}</p>
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-[220px_1fr]">
        <aside className="space-y-6 text-sm">
          <CategoryFilter tree={categoryTree} active={handle} label={t('filters')} />
        </aside>

        <section>
          <header className="mb-6 flex items-center justify-between">
            <p className="text-[13px] text-rt-ink-500 font-[family-name:var(--font-heading)] font-medium">
              {count} {count === 1 ? 'producto' : 'productos'}
            </p>
            <form className="text-sm">
              <select
                name="order"
                defaultValue={order ?? ''}
                className="rounded-[10px] border border-rt-ink-100 bg-rt-white px-3 py-2 font-[family-name:var(--font-heading)] text-[13px] font-medium shadow-xs focus:outline-none focus:ring-2 focus:ring-rt-yellow/55"
              >
                <option value="">{t('sort_relevance')}</option>
                <option value="variants.calculated_price.calculated_amount">
                  {t('sort_price_asc')}
                </option>
                <option value="-variants.calculated_price.calculated_amount">
                  {t('sort_price_desc')}
                </option>
              </select>
            </form>
          </header>

          {products.length === 0 ? (
            <EmptyState
              icon={Package}
              title={t('no_results')}
              description="Aún no hay productos en esta categoría."
              action={
                <Button asChild variant="ghost">
                  <Link href="/tienda">Ver todos los productos</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} locale={locale} />
              ))}
            </div>
          )}

          {totalPages > 1 ? (
            <nav className="mt-10 flex flex-wrap justify-center gap-2 text-sm">
              {Array.from({ length: totalPages }).map((_, i) => {
                const n = i + 1
                return (
                  <Button
                    key={n}
                    asChild
                    size="sm"
                    variant={n === currentPage ? 'primary' : 'ghost'}
                  >
                    <Link href={buildHref(n)}>{n}</Link>
                  </Button>
                )
              })}
            </nav>
          ) : null}
        </section>
      </div>
    </div>
  )
}
