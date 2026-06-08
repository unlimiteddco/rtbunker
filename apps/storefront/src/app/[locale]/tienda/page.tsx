import type { Metadata } from 'next'
import { Package } from 'lucide-react'
import { setRequestLocale, getTranslations } from 'next-intl/server'

import { CategoryFilter, type CategoryNode } from '@/components/shop/category-filter'
import { EmptyState } from '@/components/commerce/empty-state'
import { ProductCard } from '@/components/product/product-card'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'
import { listCategories, listProducts } from '@/lib/products'

export const revalidate = 60

interface ShopPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    q?: string
    category?: string
    order?: string
    page?: string
  }>
}

export async function generateMetadata({ params }: ShopPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'shop' })
  return { title: t('title') }
}

export default async function ShopPage({ params, searchParams }: ShopPageProps) {
  const { locale } = await params
  const { q, category, order, page } = await searchParams
  setRequestLocale(locale)

  const t = await getTranslations('shop')
  const limit = 12
  const offset = ((parseInt(page ?? '1', 10) || 1) - 1) * limit

  const categories = await listCategories()
  const matchedCategory = category ? categories.find((c) => c.handle === category) : undefined

  // Construye el árbol categoría → subcategorías para el filtro lateral.
  type Cat = (typeof categories)[number]
  const byRank = (a: Cat, b: Cat) =>
    ((a as { rank?: number }).rank ?? 0) - ((b as { rank?: number }).rank ?? 0) ||
    a.name.localeCompare(b.name)
  const childrenOf = (parentId: string) =>
    categories
      .filter(
        (c) => (c as { parent_category?: { id?: string } }).parent_category?.id === parentId,
      )
      .sort(byRank)
  const categoryTree: CategoryNode[] = categories
    .filter((c) => !(c as { parent_category?: unknown }).parent_category)
    .sort(byRank)
    .map((root) => ({
      id: root.id,
      name: root.name,
      handle: root.handle,
      children: childrenOf(root.id).map((kid) => ({
        id: kid.id,
        name: kid.name,
        handle: kid.handle,
      })),
    }))

  const { products, count } = await listProducts({
    countryCode: locale,
    limit,
    offset,
    ...(matchedCategory ? { category_id: [matchedCategory.id] } : {}),
    ...(q ? { q } : {}),
    ...(order ? { order } : {}),
  })

  const totalPages = Math.ceil(count / limit)
  const currentPage = parseInt(page ?? '1', 10) || 1

  return (
    <div className="container-page py-8 md:py-12">
      <header className="mb-10">
        <p className="text-eyebrow mb-2">
          {q ? `Buscando "${q}"` : matchedCategory ? matchedCategory.name : 'Catálogo'}
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-[48px] uppercase leading-[1.02] tracking-[-0.02em] text-rt-black md:text-[64px]">
          {t('title')}
        </h1>
      </header>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-[220px_1fr]">
        <aside className="space-y-6 text-sm">
          <CategoryFilter tree={categoryTree} active={category} label={t('filters')} />
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
              description="Prueba a quitar filtros o buscar otra cosa."
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
                    variant={n === currentPage ? 'default' : 'outline'}
                  >
                    <Link
                      href={`/tienda?${new URLSearchParams({
                        ...(q ? { q } : {}),
                        ...(category ? { category } : {}),
                        page: String(n),
                      }).toString()}`}
                    >
                      {n}
                    </Link>
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
