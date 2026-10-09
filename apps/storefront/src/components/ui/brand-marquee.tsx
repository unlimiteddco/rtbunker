import { cn } from '@/lib/cn'
import type { MarqueeItem } from '@/lib/content-blocks'

interface BrandMarqueeProps {
  items: MarqueeItem[]
  /** `dark`: sobre fondo carbón (hero de Servicios). `light`: sobre blanco. */
  tone: 'dark' | 'light'
  /** Clases de tamaño del texto (cada sitio usa el suyo). */
  textClassName: string
  /** Alto de los logos, p. ej. `h-6 md:h-8`. */
  logoClassName: string
}

/** Con muy pocas marcas la cinta se quedaría corta y se vería el salto. */
const MIN_TILES = 10

/**
 * Cinta corredora infinita de marcas (texto o logo), editable desde el panel
 * ("Contenido web → Marcas"). La lista se repite hasta tener ancho suficiente
 * y luego se duplica: la animación desplaza un -50 % y el bucle no tiene
 * costura (ver `.animate-marquee` en globals.css). Se pausa al pasar el ratón.
 *
 * Los logos se pintan en un solo color (blanco sobre oscuro, gris sobre claro)
 * para que una mezcla de logos de colores distintos no rompa la franja; por
 * eso conviene subirlos en PNG con fondo transparente.
 */
export function BrandMarquee({ items, tone, textClassName, logoClassName }: BrandMarqueeProps) {
  if (items.length === 0) return null

  const repeats = Math.max(1, Math.ceil(MIN_TILES / items.length))
  const base = Array.from({ length: repeats }, () => items).flat()
  const tiles = [...base, ...base]

  return (
    <div
      className="group relative overflow-hidden"
      // Máscara de degradado en los bordes para que entren/salgan suaves.
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
      }}
    >
      <ul className="animate-marquee flex w-max items-center gap-12 group-hover:[animation-play-state:paused] md:gap-16">
        {tiles.map((item, i) => (
          <li
            key={`${item.text}-${i}`}
            // Solo la primera pasada se anuncia a lectores de pantalla.
            aria-hidden={i >= items.length}
            className={cn(
              'shrink-0 select-none transition-[color,opacity] duration-300',
              item.image
                ? 'opacity-60 hover:opacity-100'
                : cn(
                    'font-[family-name:var(--font-display)] uppercase leading-none tracking-[0.04em]',
                    textClassName,
                    tone === 'dark'
                      ? 'text-rt-white/45 hover:text-rt-white'
                      : 'text-rt-ink-300 hover:text-rt-black',
                  ),
            )}
          >
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image}
                alt={item.text}
                loading="lazy"
                className={cn('w-auto object-contain', logoClassName)}
                style={{ filter: tone === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)' }}
              />
            ) : (
              item.text
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
