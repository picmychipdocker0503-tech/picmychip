import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/utilities/cn'

const tooltipVariants = cva('tooltip', {
  variants: {
    side: {
      top: 'tooltip-top',
      bottom: 'tooltip-bottom',
      left: 'tooltip-left',
      right: 'tooltip-right',
    },
  },
  defaultVariants: {
    side: 'top',
  },
})

type TooltipProps = Omit<React.ComponentProps<'div'>, 'content'> &
  VariantProps<typeof tooltipVariants> & {
    /** Plain text renders via daisyUI's native `data-tip`; a node renders in a `.tooltip-content` slot. */
    content: React.ReactNode
    open?: boolean
  }

/** CSS-only hover/focus tooltip, styled with daisyUI's `tooltip` classes. */
function Tooltip({ className, side, content, open, children, ...props }: TooltipProps) {
  const isPlainText = typeof content === 'string' || typeof content === 'number'

  return (
    <div
      data-slot="tooltip"
      className={cn(tooltipVariants({ side }), open && 'tooltip-open', className)}
      data-tip={isPlainText ? content : undefined}
      {...props}
    >
      {children}
      {!isPlainText && <div className="tooltip-content">{content}</div>}
    </div>
  )
}

export { Tooltip }
