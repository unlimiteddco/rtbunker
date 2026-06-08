import { Link } from '@/i18n/routing'

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-3xl font-semibold">404</h1>
      <p className="mt-2 text-muted-foreground">Esta página no existe.</p>
      <Link href="/" className="mt-6 inline-block underline">
        Volver al inicio
      </Link>
    </div>
  )
}
