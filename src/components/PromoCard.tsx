import type { Media as MediaType } from '@/payload-types'

import { Media } from '@/components/Media'
import { cn } from '@/utilities/cn'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

type Props = {
  eyebrow: string
  heading: string
  description?: string | null
  buttonLabel?: string
  href?: string | null
  image?: MediaType | number | string | null
  tone?: 'dark' | 'light'
  headingSize?: 'lg' | 'sm'
  className?: string
}

/**
 * Shared "promo banner" card — a text block (eyebrow, heading, optional
 * description, CTA button) beside a floating product photo, the whole card
 * linking out. Used for the FeaturedCollection block's panels and the
 * homepage hero's secondary side cards, so both stay visually identical.
 */
export const PromoCard: React.FC<Props> = ({
  eyebrow,
  heading,
  description,
  buttonLabel = 'Shop Now',
  href,
  image,
  tone = 'light',
  headingSize = 'sm',
  className,
}) => {
  const wrapperClassName = cn(
    'group relative flex items-center gap-4 overflow-hidden rounded-3xl px-7 py-7 transition-transform duration-300 sm:px-10',
    tone === 'dark' ? 'bg-neutral-950 text-white hover:-translate-y-0.5' : 'bg-muted text-foreground hover:-translate-y-0.5',
    className,
  )

  const content = (
    <>
      <div className="relative z-10 min-w-0 flex-1">
        <span
          className={cn(
            'text-xs font-bold tracking-wider uppercase',
            tone === 'dark' ? 'text-white/50' : 'text-muted-foreground',
          )}
        >
          {eyebrow}
        </span>
        <h3
          className={cn(
            'mt-2 font-bold tracking-tight text-balance',
            headingSize === 'lg' ? 'text-2xl sm:text-4xl' : 'text-lg sm:text-xl',
          )}
        >
          {heading}
        </h3>
        {description && (
          <p className={cn('mt-3 max-w-xs text-sm', tone === 'dark' ? 'text-white/70' : 'text-muted-foreground')}>
            {description}
          </p>
        )}
        {href && (
          <span className="bg-primary text-primary-foreground mt-6 inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold transition-transform group-hover:scale-105">
            {buttonLabel}
            <ArrowRight className="size-3.5" />
          </span>
        )}
      </div>

      {typeof image === 'object' && image && (
        <Media
          className="relative aspect-square w-2/5 shrink-0"
          fill
          imgClassName="object-contain transition-transform duration-300 group-hover:scale-105"
          resource={image}
        />
      )}
    </>
  )

  if (href) {
    return (
      <Link className={wrapperClassName} href={href}>
        {content}
      </Link>
    )
  }

  return <div className={wrapperClassName}>{content}</div>
}
