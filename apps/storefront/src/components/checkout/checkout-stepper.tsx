'use client'

import { Check } from 'lucide-react'

import { cn } from '@/lib/cn'

export type CheckoutStep = 'address' | 'shipping' | 'payment'

const ORDER: CheckoutStep[] = ['address', 'shipping', 'payment']
const LABELS: Record<CheckoutStep, string> = {
  address: 'Dirección',
  shipping: 'Envío',
  payment: 'Pago',
}

interface CheckoutStepperProps {
  current: CheckoutStep
  onSelect?: (step: CheckoutStep) => void
}

export function CheckoutStepper({ current, onSelect }: CheckoutStepperProps) {
  const idx = ORDER.indexOf(current)
  return (
    <ol className="flex items-center gap-2">
      {ORDER.map((step, i) => {
        const isDone = i < idx
        const isCurrent = i === idx
        const canClick = isDone && onSelect
        return (
          <li key={step} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              onClick={canClick ? () => onSelect(step) : undefined}
              disabled={!canClick}
              className={cn(
                'flex items-center gap-2 text-sm transition-colors',
                canClick && 'cursor-pointer hover:text-foreground',
              )}
            >
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
                  isDone && 'bg-foreground text-background',
                  isCurrent && 'bg-primary text-primary-foreground',
                  !isDone && !isCurrent && 'bg-muted text-muted-foreground',
                )}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  'hidden text-sm font-medium md:inline',
                  isCurrent ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {LABELS[step]}
              </span>
            </button>
            {i < ORDER.length - 1 ? (
              <span
                aria-hidden
                className={cn('h-px flex-1', isDone ? 'bg-foreground' : 'bg-border')}
              />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
