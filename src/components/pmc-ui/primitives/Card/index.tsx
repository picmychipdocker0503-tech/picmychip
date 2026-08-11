'use client'

import * as React from 'react'
import { motion } from 'framer-motion'

import { cn } from '@/components/pmc-ui/lib/cn'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable, children, ...props }, ref) => {
    if (hoverable) {
      return (
        <motion.div
          ref={ref}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={cn(
            'rounded-lg border border-pmc-slate-200 bg-white shadow-pmc transition-shadow hover:shadow-pmc-lg',
            className,
          )}
          {...(props as React.ComponentProps<typeof motion.div>)}
        >
          {children}
        </motion.div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn('rounded-lg border border-pmc-slate-200 bg-white shadow-pmc', className)}
        {...props}
      >
        {children}
      </div>
    )
  },
)
Card.displayName = 'Card'

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1 p-4', className)} {...props} />
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-base font-semibold text-pmc-ink-900', className)} {...props} />
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-pmc-ink-500', className)} {...props} />
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 pt-0', className)} {...props} />
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center gap-2 p-4 pt-0', className)} {...props} />
}
