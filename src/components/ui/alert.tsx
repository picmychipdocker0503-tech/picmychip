import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'

import { cn } from '@/utilities/cn'

const alertVariants = cva(
  'alert grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-1 rounded-md border text-sm [&>svg]:size-4 [&>svg]:translate-y-0.5',
  {
    variants: {
      variant: {
        info: 'alert-info alert-outline',
        success: 'alert-success alert-outline',
        warning: 'alert-warning alert-outline',
        destructive: 'alert-error alert-outline',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  },
)

const DEFAULT_ICON: Record<NonNullable<VariantProps<typeof alertVariants>['variant']>, React.ElementType> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: XCircle,
}

function Alert({
  className,
  variant = 'info',
  icon,
  children,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof alertVariants> & {
    /** Pass `null` to omit the icon entirely. Defaults to a variant-appropriate icon. */
    icon?: React.ReactNode | null
  }) {
  const Icon = DEFAULT_ICON[variant ?? 'info']

  return (
    <div data-slot="alert" role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      {icon !== null && (icon ?? <Icon />)}
      {children}
    </div>
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn('col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight', className)}
      {...props}
    />
  )
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn('text-current/80 col-start-2 grid justify-items-start gap-1 text-sm', className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, alertVariants }
