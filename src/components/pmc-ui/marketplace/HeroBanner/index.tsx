'use client'

import * as React from 'react'
import { motion } from 'framer-motion'

import { cn } from '@/components/pmc-ui/lib/cn'
import { buttonVariants } from '@/components/pmc-ui/primitives/Button'

export interface HeroBannerCta {
  label: string
  href: string
  variant?: 'primary' | 'secondary'
}

export interface HeroBannerProps {
  eyebrow?: string
  heading: string
  copy?: string
  ctas?: HeroBannerCta[]
  media?: React.ReactNode
  layout?: 'split' | 'full'
  className?: string
}

export function HeroBanner({
  eyebrow,
  heading,
  copy,
  ctas = [],
  media,
  layout = 'split',
  className,
}: HeroBannerProps) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex max-w-xl flex-col gap-4"
    >
      {eyebrow && (
        <span className="text-xs font-semibold uppercase tracking-widest text-pmc-blue-700">{eyebrow}</span>
      )}
      <h1 className="text-3xl font-bold tracking-tight text-pmc-ink-900 sm:text-4xl lg:text-5xl">{heading}</h1>
      {copy && <p className="text-base text-pmc-ink-600 sm:text-lg">{copy}</p>}
      {ctas.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-3">
          {ctas.map((cta) => (
            <a
              key={cta.href}
              href={cta.href}
              className={buttonVariants({ variant: cta.variant ?? 'primary', size: 'lg' })}
            >
              {cta.label}
            </a>
          ))}
        </div>
      )}
    </motion.div>
  )

  if (layout === 'full') {
    return (
      <section className={cn('relative isolate overflow-hidden rounded-xl bg-pmc-ink-900 px-6 py-16 sm:px-12', className)}>
        {media && <div className="absolute inset-0 -z-10 opacity-40">{media}</div>}
        <div className="[&_h1]:text-white [&_p]:text-white/80">{content}</div>
      </section>
    )
  }

  return (
    <section
      className={cn(
        'grid grid-cols-1 items-center gap-8 rounded-xl border border-pmc-slate-200 bg-white p-6 sm:p-10 lg:grid-cols-2 lg:gap-12',
        className,
      )}
    >
      {content}
      {media && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
          className="overflow-hidden rounded-lg bg-pmc-slate-50"
        >
          {media}
        </motion.div>
      )}
    </section>
  )
}
