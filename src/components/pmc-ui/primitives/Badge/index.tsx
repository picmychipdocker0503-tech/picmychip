import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/components/pmc-ui/lib/cn'

export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide',
  {
    variants: {
      variant: {
        'in-stock': 'border-emerald-200 bg-emerald-50 text-emerald-700',
        'low-stock': 'border-amber-200 bg-amber-50 text-amber-700',
        'out-of-stock': 'border-red-200 bg-red-50 text-red-700',
        new: 'border-pmc-blue-200 bg-pmc-blue-50 text-pmc-blue-700',
        discount: 'border-pmc-orange-200 bg-pmc-orange-50 text-pmc-orange-700',
        neutral: 'border-pmc-slate-200 bg-pmc-slate-50 text-pmc-ink-600',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
