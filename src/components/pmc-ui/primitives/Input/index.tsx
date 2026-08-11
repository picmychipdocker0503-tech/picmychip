'use client'

import * as React from 'react'

import { cn } from '@/components/pmc-ui/lib/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, error, leftIcon, rightIcon, id, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id ?? generatedId
    const helperId = `${inputId}-helper`

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-pmc-ink-800">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3 text-pmc-ink-400" aria-hidden="true">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error || undefined}
            aria-describedby={helperText || error ? helperId : undefined}
            className={cn(
              'h-10 w-full rounded-md border bg-white px-3 text-sm text-pmc-ink-900 placeholder:text-pmc-ink-400',
              'border-pmc-slate-300 transition-shadow focus-visible:outline-none focus-visible:shadow-pmc-focus focus-visible:border-pmc-blue-600',
              'disabled:cursor-not-allowed disabled:bg-pmc-slate-50 disabled:text-pmc-ink-400',
              error && 'border-red-500 focus-visible:border-red-500',
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-pmc-ink-400" aria-hidden="true">
              {rightIcon}
            </span>
          )}
        </div>
        {(helperText || error) && (
          <p id={helperId} className={cn('text-xs', error ? 'text-red-600' : 'text-pmc-ink-500')}>
            {error || helperText}
          </p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'
