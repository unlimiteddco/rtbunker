/**
 * Banda amarilla scroll horizontal arriba del nav.
 * "10% OFF · CÓDIGO: RTBUNKER ★" repetido — animación lineal continua.
 *
 * El sistema de diseño dice: presente en cabecera, slow loop ~24s, no se
 * pausa en hover. Doblamos el contenido para que el bucle no salte.
 */

// Doblamos los items para que la animación de translate(-50%) cierre el
// bucle sin saltos. Generamos índices únicos para evitar el warning de
// "two children with the same key".
const TOTAL = 24

export function PromoMarquee() {
  return (
    <div className="overflow-hidden border-b border-rt-black/10 bg-rt-yellow text-rt-black">
      <div
        role="marquee"
        aria-label="Promoción activa"
        className="flex w-max items-center gap-12 py-3 pl-12 [animation:var(--animate-marquee)]"
      >
        {Array.from({ length: TOTAL }, (_, idx) => (
          <span
            key={`promo-${idx}`}
            className="inline-flex items-center gap-12 whitespace-nowrap text-[13px] font-bold uppercase tracking-[0.22em] font-[family-name:var(--font-heading)]"
          >
            10% OFF · Código: RTBUNKER
            <span aria-hidden className="opacity-60">★</span>
          </span>
        ))}
      </div>
    </div>
  )
}
