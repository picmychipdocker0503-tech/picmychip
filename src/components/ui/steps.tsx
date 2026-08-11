import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/utilities/cn'

const stepsVariants = cva('steps', {
  variants: {
    orientation: {
      horizontal: 'steps-horizontal',
      vertical: 'steps-vertical',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
  },
})

function Steps({
  className,
  orientation,
  ...props
}: React.ComponentProps<'ul'> & VariantProps<typeof stepsVariants>) {
  return (
    <ul data-slot="steps" className={cn(stepsVariants({ orientation }), className)} {...props} />
  )
}

const stepVariants = cva('step', {
  variants: {
    variant: {
      neutral: 'step-neutral',
      primary: 'step-primary',
      secondary: 'step-secondary',
      accent: 'step-accent',
      success: 'step-success',
      warning: 'step-warning',
      error: 'step-error',
    },
  },
})

type StepProps = React.ComponentProps<'li'> &
  VariantProps<typeof stepVariants> & {
    /** Overrides the auto-numbered marker, e.g. a checkmark glyph for a completed step. */
    content?: string
  }

/** Mark a step complete/current by giving it and every step before it the same `variant`. */
function Step({ className, variant, content, ...props }: StepProps) {
  return (
    <li
      data-slot="step"
      data-content={content}
      className={cn(stepVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Steps, Step }
