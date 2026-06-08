# Storefront — Next.js 15

## Stack

- Next.js 15 (App Router) + React 19
- TypeScript estricto
- Tailwind CSS 4 (CSS-first config en `globals.css`)
- shadcn/ui (compartido vía `@rtbunker/ui`)
- next-intl con rutas `/[locale]/...`
- Medusa JS SDK + Stripe Elements
- T3 Env (`env.ts`) para validar variables de entorno

## Arranque

```bash
cp .env.example .env
# rellena NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY (lo emite el seed del backend)
npm install
npm run dev    # http://localhost:8000
```

## Estructura clave

```
src/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx
│   │   ├── page.tsx                  → home
│   │   ├── tienda/page.tsx           → listado con filtros + paginación
│   │   ├── producto/[handle]/page.tsx
│   │   ├── carrito/page.tsx
│   │   ├── checkout/page.tsx         → multi-paso (dirección → envío → pago)
│   │   ├── cuenta/{login,registro,pedidos,direcciones}
│   │   └── pagina/[slug]/page.tsx    → CMS estático (lib/cms.ts)
│   ├── actions/                      → server actions
│   ├── sitemap.ts / robots.ts
│   └── globals.css                   → Tailwind 4 + tokens shadcn
├── i18n/                             → routing + request config
├── lib/
│   ├── medusa.ts                     → SDK
│   ├── cart.ts                       → server actions de carrito
│   ├── products.ts                   → listProducts / getProductByHandle
│   ├── region.ts                     → resuelve region por locale
│   ├── search.ts                     → proxy a /store/search del backend
│   ├── stripe.ts
│   ├── format.ts
│   └── cms.ts
└── components/
    ├── layout/{header,footer,locale-switcher}
    ├── product/{product-card,variant-selector}
    ├── search/search-bar               → autocomplete con Meilisearch
    ├── checkout/{address-step,shipping-step,payment-step,checkout-flow}
    ├── account/{login-form,register-form,orders-list,addresses-list}
    └── seo/product-jsonld
```

## i18n

- Locales soportados: `es` (default), `en`, `fr` — declarados en `src/i18n/config.ts`.
- Mensajes en `messages/{locale}.json`.
- El `LocaleSwitcher` cambia la ruta y sincroniza `metadata.locale` del cart
  vía la server action `setCartLocaleAction`.
- En las páginas server-side llamamos `setRequestLocale(locale)` antes del
  primer `await` para que `getTranslations`/`useTranslations` funcionen
  sin Suspense.

## SEO

- `generateMetadata` por producto (title, description, OG, canonical).
- `JSON-LD` de Product en `src/components/seo/product-jsonld.tsx`.
- `sitemap.xml` multi-locale en `src/app/sitemap.ts` (incluye productos +
  CMS + rutas estáticas).
- `robots.txt` en `src/app/robots.ts`.
- Helper `buildMetadata` en `src/app/[locale]/page-metadata.ts` para
  `alternates.languages` (hreflang).

## Tailwind 4

`globals.css` usa la sintaxis CSS-first. Si necesitas un preset JS para
componentes externos, importa `@rtbunker/config` → `tailwind.base.cjs`.
