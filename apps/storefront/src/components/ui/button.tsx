import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/cn'

/**
 * RT Bunker buttons.
 *
 * Reglas del sistema:
 *   • Tipografía: Montserrat 700, UPPERCASE, letter-spacing 0.08em.
 *   • Radius por defecto 14 (md). Pill (rounded-full) en mini-CTAs.
 *   • Hover: lift -2px + cross-fade de color, sin bounce.
 *   • :active = lose lift (sharper feel).
 *   • Focus: ring amarillo 3px alfa 55%.
 *
 * Variants:
 *   - primary    → yellow stamp, texto carbón. CTA principal.
 *   - dark       → carbón sólido, texto blanco. CTA secundario en surface clara.
 *   - ghost      → border 1.5px carbón, texto carbón. Outline on light.
 *   - ghostInv   → border 1.5px blanco, texto blanco. Outline on dark.
 *   - link       → underline-on-hover, sin caja.
 *   - subtle     → fondo gris suave, texto carbón. Acciones de baja jerarquía.
 *   - destructive→ rojo. Borrar / cancelar.
 */
const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap select-none',
    'font-[family-name:var(--font-heading)] font-bold uppercase',
    'tracking-[0.08em] text-[13px]',
    'transition-all duration-[220ms] ease-[var(--ease-out-rt)]',
    'will-change-transform',
    'hover:-translate-y-0.5 active:translate-y-0 active:shadow-none',
    'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(10,186,181,0.55)]',
    'disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0',
    '[&_svg]:size-3.5 [&_svg]:shrink-0',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: 'bg-rt-yellow text-rt-black hover:bg-rt-yellow-deep shadow-xs',
        dark: 'bg-rt-black text-rt-white hover:bg-rt-black-2 shadow-xs',
        ghost: 'border-[1.5px] border-rt-black bg-transparent text-rt-black hover:bg-rt-black hover:text-rt-white',
        ghostInv:
          'border-[1.5px] border-rt-white bg-transparent text-rt-white hover:bg-rt-white hover:text-rt-black',
        subtle:
          'bg-rt-white-2 text-rt-black hover:bg-rt-white-3 border border-rt-ink-100',
        link: 'text-foreground underline-offset-4 hover:underline normal-case tracking-normal hover:translate-y-0',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs',
      },
      size: {
        sm: 'h-9 px-3.5 rounded-[10px] text-[11px] tracking-[0.1em]',
        default: 'h-11 px-5 rounded-[14px]',
        lg: 'h-12 px-7 rounded-[14px] text-[14px]',
        xl: 'h-14 px-9 rounded-[14px] text-[14px]',
        icon: 'h-10 w-10 rounded-[12px]',
        pill: 'h-9 px-4 rounded-full text-[12px]',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
    compoundVariants: [
      // CTA principal sobre fondo oscuro → glow amarillo.
      { variant: 'primary', size: 'lg', class: 'shadow-[var(--shadow-yellow)] hover:shadow-[var(--shadow-yellow)]' },
      { variant: 'primary', size: 'xl', class: 'shadow-[var(--shadow-yellow)] hover:shadow-[var(--shadow-yellow)]' },
    ],
  },
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants, type ButtonProps }
