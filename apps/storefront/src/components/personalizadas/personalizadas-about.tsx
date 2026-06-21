import { ArrowRight } from 'lucide-react'
import Image from 'next/image'

import { Reveal } from '@/components/services/reveal'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'

/**
 * "Sobre mí" — presentación condensada de Nikita, el fundador. Reutiliza el
 * tono y la historia real de la página /nosotros (RusoTurista + Bunker, desde
 * 2022) en versión corta para cerrar la página de personalizadas con cara y
 * confianza antes del CTA.
 */
export function PersonalizadasAbout() {
  return (
    <section className="bg-rt-white py-20 md:py-28">
      <div className="container-page grid gap-12 md:grid-cols-[0.85fr_1fr] md:items-center">
        {/* TODO Nikita: sustituir founder.jpg por tu foto definitiva si procede. */}
        <Reveal as="left">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] shadow-[var(--shadow-lg)]">
            <Image
              src="/about/founder.jpg"
              alt="Nikita, fundador de RT Bunker"
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover"
            />
          </div>
        </Reveal>

        <Reveal as="right">
          <p className="rt-eyebrow text-rt-yellow-deep">Sobre mí · desde 2022</p>
          <h2 className="mt-3 rt-h2 text-balance text-rt-black">Hola, soy Nikita</h2>
          {/* TODO Nikita: ajusta este texto si quieres otro tono o más detalle. */}
          <div className="mt-5 space-y-4 text-[16px] leading-[1.7] text-rt-ink-700">
            <p>
              Apasionado del mundo del motor y del arte de la personalización. Empecé{' '}
              <strong className="text-rt-black">RT Bunker en 2022</strong> desde cero, con pocos
              recursos pero con la idea fija de que cada vehículo es único y merece destacar.
            </p>
            <p>
              El nombre lo dice todo: <strong className="text-rt-black">RT</strong> por{' '}
              <em>RusoTurista</em>, el apodo que me acompaña por mi origen ruso, y{' '}
              <strong className="text-rt-black">Bunker</strong>, el taller donde nacen las pegatinas
              que diseñas aquí. Cada pedido lo fabricamos en casa, con vinilo premium y una prueba
              digital antes de imprimir.
            </p>
          </div>

          <div className="mt-8">
            <Button asChild variant="ghost" size="default">
              <Link href="/nosotros">
                Conoce la historia completa
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
