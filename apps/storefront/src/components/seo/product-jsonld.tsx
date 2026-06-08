import type { HttpTypes } from '@medusajs/types'

interface ProductJsonLdProps {
  product: HttpTypes.StoreProduct
  url: string
  rating?: { average: number; count: number } | undefined
}

export function ProductJsonLd({ product, url, rating }: ProductJsonLdProps) {
  const variant = product.variants?.[0]
  const price = variant?.calculated_price
  const inStock = variant
    ? variant.manage_inventory === false ||
      variant.allow_backorder === true ||
      (variant.inventory_quantity ?? 0) > 0
    : false

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description ?? undefined,
    image: product.images?.map((i) => i.url) ?? (product.thumbnail ? [product.thumbnail] : []),
    sku: variant?.sku ?? undefined,
    aggregateRating:
      rating && rating.count > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: rating.average,
            reviewCount: rating.count,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    offers: price
      ? {
          '@type': 'Offer',
          url,
          priceCurrency: price.currency_code?.toUpperCase(),
          price: price.calculated_amount,
          availability: inStock
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        }
      : undefined,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
