'use client'

import type { Media as MediaType } from '@/payload-types'

import { Media } from '@/components/Media'
import { cn } from '@/utilities/cn'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { ArrowRight, ZapIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import React, { useState } from 'react'
import { toast } from 'sonner'

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
  /** When set, the CTA becomes an instant "Buy Now" (add to cart + go to checkout) instead of a plain link button. */
  productId?: number
  variantId?: number
  disabled?: boolean
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
  productId,
  variantId,
  disabled,
}) => {
  const { addItem } = useCart()
  const router = useRouter()
  const t = useTranslations('cart')
  const [isBuyingNow, setIsBuyingNow] = useState(false)

  const handleBuyNow = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!productId) return

    setIsBuyingNow(true)
    addItem({ product: productId, variant: variantId })
      .then(() => {
        router.push('/checkout')
      })
      .catch(() => {
        setIsBuyingNow(false)
        toast.error('Could not start checkout — please try again.')
      })
  }

  const wrapperClassName = cn(
    // Row layout (image beside text) is the base/mobile behavior, not just a
    // sm:+ upgrade — stacking the image full-width above the text (the old
    // mobile layout) doubled each card's height for no real benefit at
    // typical phone widths. py-7 is pinned back for sm:+ since it used to
    // apply at every size; every other property already had a sm: override.
    'group relative flex flex-row items-center gap-4 overflow-hidden rounded-3xl px-5 py-5 transition-transform duration-300 sm:px-10 sm:py-7',
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
            'mt-2 line-clamp-3 font-bold tracking-tight text-balance [text-wrap:pretty]',
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
        {productId ? (
          <button
            aria-label="Buy now"
            className="bg-primary text-primary-foreground relative z-20 mt-3 sm:mt-6 inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold transition-transform group-hover:scale-105 disabled:pointer-events-none disabled:opacity-50"
            disabled={disabled || isBuyingNow}
            onClick={handleBuyNow}
            type="button"
          >
            {isBuyingNow ? (
              t('redirecting')
            ) : (
              <>
                <ZapIcon className="size-3.5" />
                {t('buyNow')}
              </>
            )}
          </button>
        ) : (
          href && (
            <span className="bg-primary text-primary-foreground mt-3 sm:mt-6 inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold transition-transform group-hover:scale-105">
              {buttonLabel}
              <ArrowRight className="size-3.5" />
            </span>
          )
        )}
      </div>

      {typeof image === 'object' && image && (
        <Media
          className="relative aspect-square w-24 shrink-0 self-center sm:w-2/5 sm:max-w-none"
          fill
          imgClassName="object-contain transition-transform duration-300 group-hover:scale-105"
          resource={image}
          size="(max-width: 640px) 96px, 20vw"
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
