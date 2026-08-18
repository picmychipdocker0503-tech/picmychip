'use client'
import type { Product, Variant } from '@/payload-types'

import { RichText } from '@/components/RichText'
import { AddToCart } from '@/components/Cart/AddToCart'
import { Price } from '@/components/Price'
import { RatingStars } from '@/components/RatingStars'
import { useCompare } from '@/providers/Compare'
import { useTranslations } from 'next-intl'
import { useWishlist } from '@/providers/Wishlist'
import { cn } from '@/utilities/cn'
import { CheckIcon, HeartIcon, ScaleIcon, TagIcon } from 'lucide-react'
import Link from 'next/link'
import posthog from 'posthog-js'
import React, { Suspense } from 'react'

import { VariantSelector } from './VariantSelector'
import { useCurrency } from '@payloadcms/plugin-ecommerce/client/react'
import { BackInStockForm } from '@/components/product/BackInStockForm'
import { BulkOrderContact } from '@/components/product/BulkOrderContact'
import { DeliveryEstimate } from '@/components/product/DeliveryEstimate'
import { StockIndicator } from '@/components/product/StockIndicator'
import { TrustBadges } from '@/components/product/TrustBadges'

type Props = {
  product: Product
  supportEmail?: string | null
  averageRating?: number
  reviewCount?: number
  categoryName?: string
  categorySlug?: string
}

export function ProductDescription({
  product,
  supportEmail,
  averageRating = 0,
  reviewCount = 0,
  categoryName,
  categorySlug,
}: Props) {
  const { currency } = useCurrency()
  const t = useTranslations('product')
  const { toggle, isComparing } = useCompare()
  const { toggle: toggleWishlist, isSaved } = useWishlist()
  const productId = String(product.id)
  const comparing = isComparing(productId)
  const saved = isSaved(productId)
  let amount = 0,
    lowestAmount = 0,
    highestAmount = 0
  const priceField = `priceIn${currency.code}` as keyof Product
  const hasVariants = product.enableVariants && Boolean(product.variants?.docs?.length)

  if (hasVariants) {
    const priceField = `priceIn${currency.code}` as keyof Variant
    const variantsOrderedByPrice = product.variants?.docs
      ?.filter((variant) => variant && typeof variant === 'object')
      .sort((a, b) => {
        if (
          typeof a === 'object' &&
          typeof b === 'object' &&
          priceField in a &&
          priceField in b &&
          typeof a[priceField] === 'number' &&
          typeof b[priceField] === 'number'
        ) {
          return a[priceField] - b[priceField]
        }

        return 0
      }) as Variant[]

    if (variantsOrderedByPrice.length) {
      const lowestVariant = variantsOrderedByPrice[0][priceField]
      const highestVariant = variantsOrderedByPrice[variantsOrderedByPrice.length - 1][priceField]
      if (typeof lowestVariant === 'number' && typeof highestVariant === 'number') {
        lowestAmount = lowestVariant
        highestAmount = highestVariant
      }
    }
  } else if (product[priceField] && typeof product[priceField] === 'number') {
    amount = product[priceField]
  }

  return (
    <div className="flex flex-col gap-6">
      {categoryName && categorySlug && (
        <Link
          className="border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-primary inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide uppercase transition-colors"
          href={`/category/${categorySlug}`}
        >
          <TagIcon className="size-3" />
          {categoryName}
        </Link>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">{product.title}</h1>
        <div className="text-primary shrink-0 text-2xl font-bold tracking-tight">
          {hasVariants ? (
            <Price highestAmount={highestAmount} lowestAmount={lowestAmount} />
          ) : (
            <Price amount={amount} />
          )}
        </div>
      </div>

      <a className="-mt-3 flex w-fit items-center gap-2 hover:opacity-80" href="#reviews">
        <RatingStars rating={averageRating} />
        <span className="text-muted-foreground text-sm">
          ({reviewCount} customer review{reviewCount === 1 ? '' : 's'})
        </span>
      </a>

      {product.highlights?.length ? (
        <ol className="flex flex-col gap-1.5 text-sm">
          {product.highlights.map((item, index) => (
            <li className="flex gap-2" key={item.id ?? index}>
              <span className="text-primary font-semibold">{index + 1}.</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ol>
      ) : null}

      {product.description ? (
        <RichText className="" data={product.description} enableGutter={false} />
      ) : null}

      <div className="border-border bg-muted/20 flex flex-col gap-5 rounded-2xl border p-5">
        {hasVariants && (
          <Suspense fallback={null}>
            <VariantSelector product={product} />
          </Suspense>
        )}

        <Suspense fallback={null}>
          <StockIndicator product={product} />
        </Suspense>

        {product.stockStatus === 'out-of-stock' && !product.enableVariants && (
          <BackInStockForm productId={product.id} />
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Suspense fallback={null}>
            <AddToCart product={product} />
          </Suspense>

          <button
            aria-label={comparing ? 'Remove from compare' : 'Add to compare'}
            className={cn(
              'flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors',
              comparing
                ? 'border-primary text-primary bg-primary/5'
                : 'border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
            onClick={() => toggle(productId)}
            type="button"
          >
            {comparing ? <CheckIcon className="size-4" /> : <ScaleIcon className="size-4" />}
            {comparing ? t('comparing') : t('compare')}
          </button>

          <button
            aria-label={saved ? t('removeFromFavorites') : t('addToFavorites')}
            className={cn(
              'flex items-center justify-center rounded-full border p-2.5 transition-colors',
              saved
                ? 'border-primary text-primary bg-primary/5'
                : 'border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
            onClick={() => {
              if (!saved) {
                posthog.capture('product_wishlisted', {
                  product_id: product.id,
                  product_title: product.title,
                })
              }
              toggleWishlist(productId)
            }}
            type="button"
          >
            <HeartIcon className={cn('size-4', saved && 'fill-current')} />
          </button>
        </div>

        <DeliveryEstimate />
      </div>

      <BulkOrderContact supportEmail={supportEmail} />

      <TrustBadges />
    </div>
  )
}
