'use client'
import type { Product, Variant } from '@/payload-types'

import { AddToCart } from '@/components/Cart/AddToCart'
import { Badge } from '@/components/ui/badge'
import { Price } from '@/components/Price'
import { RatingStars } from '@/components/RatingStars'
import { RichText } from '@/components/RichText'
import { useCompare } from '@/providers/Compare'
import { useWishlist } from '@/providers/Wishlist'
import { useWishlistPopover } from '@/providers/WishlistPopover'
import { cn } from '@/utilities/cn'
import { CheckIcon, HeartIcon, ScaleIcon, TagIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import posthog from 'posthog-js'
import { Suspense } from 'react'

import { BackInStockForm } from '@/components/product/BackInStockForm'
import { BulkOrderContact } from '@/components/product/BulkOrderContact'
import { DeliveryEstimate } from '@/components/product/DeliveryEstimate'
import { StockIndicator } from '@/components/product/StockIndicator'
import { TrustBadges } from '@/components/product/TrustBadges'
import { useFeatureFlags } from '@/lib/useFeatureFlags'
import { useCurrency } from '@payloadcms/plugin-ecommerce/client/react'
import { VariantSelector } from './VariantSelector'

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
  const flags = useFeatureFlags()
  const { toggle, isComparing } = useCompare()
  const { toggle: toggleWishlist, isSaved } = useWishlist()
  const { showWishlistPopover } = useWishlistPopover()
  const productId = String(product.id)
  const comparing = isComparing(productId)
  const saved = isSaved(productId)
  let amount = 0,
    lowestAmount = 0,
    highestAmount = 0
  const priceField = `priceIn${currency.code}` as keyof Product
  const salePriceField = `salePriceIn${currency.code}` as keyof Product
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

  // Sale/clearance pricing is product-level only (no per-variant override
  // yet), so it's only shown for the single-price case, not a variant range.
  const salePrice = product[salePriceField] as number | null | undefined
  const saleExpired = Boolean(product.saleEndDate && new Date(product.saleEndDate).getTime() < Date.now())
  const isOnSale = !hasVariants && Boolean(product.onSale) && !saleExpired && typeof salePrice === 'number'
  const isClearance = Boolean(product.isClearance)
  const displayAmount = isOnSale ? salePrice! : amount
  const discountPercent = isOnSale && amount > 0 ? Math.round((1 - salePrice! / amount) * 100) : 0

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
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {(isClearance || isOnSale) && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase',
                isClearance ? 'bg-amber-600 text-white' : 'bg-primary text-primary-foreground',
              )}
            >
              <TagIcon className="size-3" />
              {isClearance ? 'Clearance' : discountPercent > 0 ? `${discountPercent}% Off` : 'Sale'}
            </span>
          )}

          <div className="flex items-baseline gap-2">
            {isOnSale && (
              <span className="text-muted-foreground text-base line-through">
                <Price amount={amount} as="span" />
              </span>
            )}
            <div className="text-primary text-2xl font-bold tracking-tight">
              {hasVariants ? (
                <Price highestAmount={highestAmount} lowestAmount={lowestAmount} />
              ) : (
                <Price amount={displayAmount} />
              )}
            </div>
          </div>

          {isOnSale && amount > displayAmount && (
            <span className="text-success text-xs font-semibold">
              You save <Price amount={amount - displayAmount} as="span" />
            </span>
          )}

          {isClearance && product.clearanceReason && (
            <span className="text-muted-foreground max-w-[16rem] text-right text-xs">{product.clearanceReason}</span>
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
        <ul className="flex flex-wrap gap-2">
          {product.highlights.map((item, index) => (
            <li key={item.id ?? index}>
              <Badge variant="secondary" className="py-1 text-sm font-normal">
                {item.text}
              </Badge>
            </li>
          ))}
        </ul>
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

        {flags.backInStockAlerts && product.stockStatus === 'out-of-stock' && !product.enableVariants && (
          <BackInStockForm productId={product.id} />
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Suspense fallback={null}>
            <AddToCart product={product} />
          </Suspense>

          {flags.compareProducts && (
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
          )}

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
                showWishlistPopover(product)
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
