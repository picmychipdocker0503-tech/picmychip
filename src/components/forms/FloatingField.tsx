import React from 'react'
import { cn } from '@/utilities/cn'
import { FormError } from '@/components/forms/FormError'

type Props = {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string
  className?: string
  children: React.ReactNode
}

/**
 * Bordered box with the label pinned inside the top edge (Amazon/Flipkart
 * style address-form field) instead of a separate label sitting above the
 * input. `children` should be the bare input/select with its own border,
 * background, height, and padding stripped via className overrides — see
 * `floatingFieldInputClassName`.
 */
export const FloatingField: React.FC<Props> = ({
  label,
  htmlFor,
  required,
  error,
  className,
  children,
}) => {
  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'relative rounded-lg border border-input bg-background px-3 pt-4 pb-1.5 transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring',
          error && 'border-destructive',
        )}
      >
        <label
          htmlFor={htmlFor}
          className="pointer-events-none absolute left-3 top-1.5 text-[11px] leading-none text-muted-foreground"
        >
          {label}
          {required && <span className="text-destructive"> *</span>}
        </label>
        {children}
      </div>
      {error && <FormError message={error} className="mt-1" />}
    </div>
  )
}

/** Strips the default Input/SearchableSelect chrome so it sits flush inside a FloatingField. */
export const floatingFieldInputClassName =
  'h-auto w-full border-0 bg-transparent p-0 pt-3 pb-0 text-sm shadow-none focus-visible:ring-0 focus-visible:border-0 mb-0'
