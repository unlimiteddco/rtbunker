import type { Metadata } from 'next'
import { ChevronRight } from 'lucide-react'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'

import { Link } from '@/i18n/routing'
import { getCmsPage, listCmsSlugs } from '@/lib/cms'

interface PageProps {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateStaticParams() {
  return listCmsSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params
  const page = getCmsPage(slug, locale)
  return page ? { title: page.title, description: page.excerpt } : {}
}

export default async function CmsPage({ params }: PageProps) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const page = getCmsPage(slug, locale)
  if (!page) notFound()

  return (
    <div className="container-page py-10 md:py-16">
      <article className="mx-auto max-w-2xl">
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <Link href="/" className="hover:text-foreground">
            Inicio
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{page.title}</span>
        </nav>

        <header className="mb-8 border-b border-border pb-8">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{page.title}</h1>
          {page.excerpt ? (
            <p className="mt-3 text-lg text-muted-foreground">{page.excerpt}</p>
          ) : null}
        </header>

        <div
          className="prose prose-neutral max-w-none prose-headings:tracking-tight prose-headings:font-semibold prose-a:text-foreground prose-a:underline-offset-4 hover:prose-a:no-underline"
          dangerouslySetInnerHTML={{ __html: page.body }}
        />
      </article>
    </div>
  )
}
