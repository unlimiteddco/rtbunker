import { ArrowRight } from 'lucide-react'

import { Link } from '@/i18n/routing'
import { listCategories, listProducts } from '@/lib/products'

interface CategoryGridProps {
  /** Necesario para resolver el region_id al pedir el primer producto
   *  de cada categoría (de donde sacamos la imagen de fondo). */
  locale: string
}

/**
 * 8 tiles con la foto de un producto de la categoría como fondo. Un
 * gradiente carbón asegura que el título blanco siempre se lee, incluso
 * sobre fotos claras. Si una categoría aún no tiene producto / thumbnail,
 * cae a un fondo sólido alternando carbón / Tiffany.
 */
export async function CategoryGrid({ locale }: CategoryGridProps) {
  const categories = (await listCategories()).slice(0, 8)
  if (categories.length === 0) return null

  // En paralelo: para cada categoría pedimos UN producto solo para sacar
  // su thumbnail. Si no hay, queda null y usamos fallback.
  const withImages = await Promise.all(
    categories.map(async (cat) => {
      try {
        const { products } = await listProducts({
          countryCode: locale,
          category_id: [cat.id],
          limit: 1,
        })
        return { ...cat, image: products[0]?.thumbnail ?? null }
      } catch {
        return { ...cat, image: null as string | null }
      }
    }),
  )

  return (
    <section className="bg-rt-white py-20 md:py-24">
      <div className="container-page">
        <header className="mb-8 flex items-end justify-between">
          <h2 className="rt-h2">Shop stickers</h2>
          <Link
            href="/tienda"
            className="font-[family-name:var(--font-heading)] text-[13px] font-bold uppercase tracking-[0.18em] text-rt-black hover:text-rt-yellow"
          >
            Ver todas →
          </Link>
        </header>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
          {withImages.map((cat, i) => {
            const fallbackTone = i % 3 === 1 ? 'accent' : 'dark'
            return (
              <Link
                key={cat.id}
                href={`/tienda?category=${encodeURIComponent(cat.handle)}`}
                className="group relative flex aspect-[3/4] flex-col overflow-hidden rounded-[20px] transition-transform duration-300 ease-[var(--ease-out-rt)] hover:-translate-y-1"
              >
                {/* Fondo: foto del primer producto o color sólido fallback. */}
                {cat.image ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cat.image}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[500ms] group-hover:scale-105"
                    />
                    {/* Gradiente carbón para que el texto siempre se lea. */}
                    <span
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-t from-rt-black/90 via-rt-black/45 to-rt-black/25"
                    />
                  </>
                ) : (
                  <span
                    aria-hidden
                    className={`absolute inset-0 ${
                      fallbackTone === 'accent' ? 'bg-rt-yellow' : 'bg-rt-black'
                    }`}
                  />
                )}

                {/* Contenido encima de la imagen */}
                <div className="relative z-10 flex flex-1 flex-col justify-between p-5">
                  <span
                    className={`font-[family-name:var(--font-heading)] text-[11px] font-bold uppercase tracking-[0.22em] ${
                      cat.image || fallbackTone === 'dark'
                        ? 'text-rt-white/85'
                        : 'text-rt-black/75'
                    }`}
                  >
                    Categoría
                  </span>
                  <div
                    className={`flex flex-col gap-3 ${
                      cat.image || fallbackTone === 'dark' ? 'text-rt-white' : 'text-rt-black'
                    }`}
                  >
                    <span
                      className="font-[family-name:var(--font-heading)] text-[20px] font-bold leading-[1.1] md:text-[24px]"
                      style={
                        cat.image
                          ? { textShadow: '0 2px 14px rgba(0,0,0,0.55)' }
                          : undefined
                      }
                    >
                      {cat.name}
                    </span>
                    <span className="inline-flex items-center gap-2 font-[family-name:var(--font-heading)] text-[11px] font-bold uppercase tracking-[0.16em] transition-transform group-hover:translate-x-1 md:text-[12px]">
                      Explorar <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
