import { Reveal } from '@/components/services/reveal'
import { BrandMarquee } from '@/components/ui/brand-marquee'
import type { MarqueeItem } from '@/lib/content-blocks'

/**
 * Franja "Han confiado en nuestras pegatinas" de /personalizadas: la cinta
 * corredora de marcas sobre fondo claro. Las marcas (texto o logo) se editan
 * en el panel: Contenido web → Marcas.
 */
export function PersonalizadasLogosMarquee({ items }: { items: MarqueeItem[] }) {
  return (
    <section className="border-y border-rt-ink-100 bg-rt-white py-10 md:py-12">
      <Reveal as="up" className="container-page">
        <p className="text-center font-[family-name:var(--font-heading)] text-[11px] font-bold uppercase tracking-[0.22em] text-rt-ink-500 md:text-[12px]">
          Han confiado en nuestras pegatinas
        </p>
      </Reveal>

      <div className="mt-7">
        <BrandMarquee
          items={items}
          tone="light"
          textClassName="text-[clamp(22px,3vw,34px)]"
          logoClassName="h-7 md:h-9"
        />
      </div>
    </section>
  )
}
