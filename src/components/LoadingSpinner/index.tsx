import React from 'react'
import { cn } from '@/utilities/cn'
import { VariantProps, cva } from 'class-variance-authority'
import { Comic_Neue } from 'next/font/google'

const comicNeue = Comic_Neue({ subsets: ['latin'], weight: '700' })

const spinnerVariants = cva('flex-col items-center justify-center', {
  variants: {
    show: {
      true: 'flex',
      false: 'hidden',
    },
  },
  defaultVariants: {
    show: true,
  },
})

const logoVariants = cva('', {
  variants: {
    size: {
      small: 'size-6',
      medium: 'size-8',
      large: 'size-12',
    },
  },
  defaultVariants: {
    size: 'medium',
  },
})

interface SpinnerContentProps
  extends VariantProps<typeof spinnerVariants>,
    VariantProps<typeof logoVariants> {
  className?: string
  children?: React.ReactNode
}

export function LoadingSpinner({ size, show, children, className }: SpinnerContentProps) {
  return (
    <span className={spinnerVariants({ show })}>
      <svg
        aria-label="Loading"
        className={cn(logoVariants({ size }), comicNeue.className, className)}
        role="img"
        viewBox="0 0 110 110"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle className="pmc-loader-ring" cx="55" cy="55" fill="none" r="41" />
        <circle className="pmc-loader-ring-track" cx="55" cy="55" fill="none" r="41" />
        <circle className="pmc-loader-core" cx="55" cy="55" r="32" />
        <text className="pmc-loader-text" fontSize="20" textAnchor="middle" x="55" y="62">
          MY
        </text>
      </svg>
      {children}
    </span>
  )
}
