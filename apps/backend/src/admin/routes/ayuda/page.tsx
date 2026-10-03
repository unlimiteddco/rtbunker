import { defineRouteConfig } from '@medusajs/admin-sdk'
import { ArrowUpRightOnBox, BookOpen } from '@medusajs/icons'
import { Button, Container, Heading, Text } from '@medusajs/ui'
import { Link } from 'react-router-dom'

/** URL pública de la tienda: la guía se sirve desde ahí (`/guia.html`). */
const STOREFRONT_URL = (
  (import.meta.env.VITE_STOREFRONT_URL as string | undefined) ||
  'https://rtbunker.com'
).replace(/\/+$/, '')

const GUIDE_URL = `${STOREFRONT_URL}/guia.html`

/** Atajos a lo que más se usa, con el mismo nombre que en el menú. */
const SHORTCUTS: { to: string; title: string; text: string }[] = [
  {
    to: '/publicar-producto',
    title: 'Publicar un producto',
    text: 'Fotos, nombre, precio, tamaños y colores en un solo formulario.',
  },
  {
    to: '/precios',
    title: 'Cambiar precios por tamaño',
    text: 'Sube o baja el precio de un tamaño en uno o en muchos productos a la vez.',
  },
  {
    to: '/orders',
    title: 'Cobrar y enviar pedidos',
    text: 'Abre el pedido, marca la transferencia como cobrada y después prepáralo y envíalo.',
  },
  {
    to: '/custom-orders',
    title: 'Encargos personalizados',
    text: 'Sube el mockup, espera la aprobación del cliente y pásalo a producción.',
  },
  {
    to: '/portfolio',
    title: 'Añadir un trabajo al portafolio',
    text: 'Servicio, título, descripción y fotos: aparece en la página de Servicios.',
  },
  {
    to: '/site-content',
    title: 'Cambiar textos de la web',
    text: 'Servicios, pasos del proceso y categorías de la portada.',
  },
]

/**
 * Ayuda: la guía de uso de la web dentro del propio panel, para no depender
 * del PDF. Se incrusta la misma página pública de la guía, así siempre está
 * la versión al día.
 */
const HelpPage = () => {
  return (
    <div className="flex flex-col gap-y-3">
      <Container className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Heading>Ayuda</Heading>
          <Text size="small" leading="compact" className="text-ui-fg-subtle mt-1">
            Cómo funciona la web y cómo se hace cada cosa desde este panel, paso a paso.
          </Text>
        </div>
        <Button size="small" variant="secondary" asChild>
          <a href={GUIDE_URL} target="_blank" rel="noopener">
            <ArrowUpRightOnBox />
            Abrir la guía en otra pestaña
          </a>
        </Button>
      </Container>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {SHORTCUTS.map((s) => (
          <Link key={s.to} to={s.to} className="group">
            <Container className="group-hover:bg-ui-bg-base-hover h-full px-6 py-4 transition-colors">
              <Text size="small" leading="compact" weight="plus">
                {s.title}
              </Text>
              <Text size="small" leading="compact" className="text-ui-fg-subtle mt-1">
                {s.text}
              </Text>
            </Container>
          </Link>
        ))}
      </div>

      <Container className="overflow-hidden p-0">
        <iframe
          src={GUIDE_URL}
          title="Guía de uso de RT Bunker"
          className="block h-[75vh] w-full border-0"
          loading="lazy"
        />
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: 'Ayuda',
  icon: BookOpen,
})

export default HelpPage
