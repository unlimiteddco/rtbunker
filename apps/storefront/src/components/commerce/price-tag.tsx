import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'

interface PriceTagProps {
  amount: number
  currency: string
  locale?: string
  /** Si se pasa, muestra el precio original tachado al lado. */
  compareAt?: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function PriceTag({
  amount,
  currency,
  locale = 'es-ES',
  compareAt,
  className,
  size = 'md',
}: PriceTagProps) {
  const isOnSale = compareAt !== undefined && compareAt > amount
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl font-semibold',
  }

  return (
    <span className={cn('inline-flex items-baseline gap-2', className)}>
      <span className={cn(sizes[size], isOnSale && 'text-destructive')}>
        {formatMoney(amount, currency, locale)}
      </span>
      {isOnSale ? (
        <span className="text-xs text-muted-foreground line-through">
          {formatMoney(compareAt, currency, locale)}
        </span>
      ) : null}
    </span>
  )
}
