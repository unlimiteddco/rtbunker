import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ locale: string }>
}

/**
 * La variante "compact" pasó a ser la página por defecto en `/personalizadas`.
 * Mantenemos esta URL viva con un redirect permanente para no romper enlaces.
 */
export default async function PersonalizadasCompactPage({ params }: PageProps) {
  const { locale } = await params
  redirect(`/${locale}/personalizadas`)
}
