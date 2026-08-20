'use client'

import type { Product, Variant } from '@/payload-types'

import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { SecureCheckoutBadge } from '@/components/SecureCheckoutBadge'
import { useFeatureFlags } from '@/lib/useFeatureFlags'
import { getClientSideURL } from '@/utilities/getURL'
import { useCart, useCurrency } from '@payloadcms/plugin-ecommerce/client/react'
import { MinusIcon, PlusIcon, ShoppingCartIcon, Trash2Icon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import posthog from 'posthog-js'
import Link from 'next/link'
import React, { useState } from 'react'

type GalleryItem = NonNullable<Product['gallery']>[number]
type VariantOptionItem = NonNullable<Variant['options']>[number]
type CartItem = NonNullable<ReturnType<typeof useCart>['cart']>['items'] extends
  | (infer T)[]
  | undefined
  ? T
  : never

export default function CartPage() {
  const { cart, clearCart, isLoading, refreshCart } = useCart()
  const { currency } = useCurrency()
  const flags = useFeatureFlags()
  const t = useTranslations('cart')

  const priceField = `priceIn${currency.code}` as const

  const items = cart?.items ?? []
  const [couponInput, setCouponInput] = useState('')
  const [giftCardInput, setGiftCardInput] = useState('')
  const [couponError, setCouponError] = useState<string | null>(null)
  const [giftCardError, setGiftCardError] = useState<string | null>(null)
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false)

  const applyDiscount = async (args: {
    couponCode?: string
    giftCardCode?: string
    remove?: 'coupon' | 'gift-card'
  }) => {
    if (!cart?.id) return

    setIsApplyingDiscount(true)
    if (args.couponCode || args.remove === 'coupon') setCouponError(null)
    if (args.giftCardCode || args.remove === 'gift-card') setGiftCardError(null)

    try {
      // Guest carts (no logged-in user) are owned by whoever holds this
      // secret — the same one the ecommerce plugin's own cart requests use
      // under the hood. Logged-in users are authorized via their session
      // cookie server-side instead, so this is simply absent/unused there.
      const secret = window.localStorage.getItem('cart_secret') ?? undefined

      const res = await fetch(`${getClientSideURL()}/api/cart/discount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cartId: cart.id, secret, ...args }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (args.couponCode) setCouponError(data.error)
        if (args.giftCardCode) setGiftCardError(data.error)
        return
      }

      if (args.couponCode) {
        setCouponInput('')
        posthog.capture('coupon_applied', { coupon_code: args.couponCode })
      }
      if (args.giftCardCode) {
        setGiftCardInput('')
        posthog.capture('gift_card_applied', {})
      }
      await refreshCart()
    } catch {
      if (args.couponCode) setCouponError(t('genericError'))
      if (args.giftCardCode) setGiftCardError(t('genericError'))
    } finally {
      setIsApplyingDiscount(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="container flex flex-col items-center gap-4 py-24 text-center">
        <div className="bg-muted flex size-16 items-center justify-center rounded-full">
          <ShoppingCartIcon className="text-muted-foreground size-7" />
        </div>
        <h1 className="text-2xl font-bold">{t('empty.title')}</h1>
        <p className="text-muted-foreground max-w-sm">{t('empty.description')}</p>
        <Link className="btn btn-primary" href="/shop">
          {t('empty.browseProducts')}
        </Link>
      </div>
    )
  }

  return (
    <div className="container flex flex-col gap-6 py-16">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-2xl font-bold md:text-3xl">{t('title')}</h1>
        <button
          className="text-primary text-sm font-medium hover:underline"
          onClick={() => clearCart()}
          type="button"
        >
          {t('clearCart')}
        </button>
      </div>

      <ul className="flex flex-col gap-4">
        {items.map((item, index) => (
          <CartRow item={item as CartItem} key={item.id ?? index} priceField={priceField} />
        ))}
      </ul>

      <div className="grid gap-6 pb-24 lg:grid-cols-3 lg:pb-0">
        <div className="bg-card border-border flex flex-col gap-5 rounded-2xl border p-6 shadow-sm lg:col-span-2">
          <div>
            <p className="text-muted-foreground mb-3 font-medium">{t('haveCoupon')}</p>
            {cart?.appliedCouponCode ? (
              <div className="flex items-center justify-between text-sm">
                <span>
                  {t('couponLabel')} <span className="font-medium">{cart.appliedCouponCode}</span>{' '}
                  {t('appliedLabel')}
                  {typeof cart.couponDiscountAmount === 'number' && cart.couponDiscountAmount > 0 && (
                    <>
                      {' '}
                      (-<Price amount={cart.couponDiscountAmount} as="span" />)
                    </>
                  )}
                </span>
                <button
                  className="text-primary underline"
                  disabled={isApplyingDiscount}
                  onClick={() => applyDiscount({ remove: 'coupon' })}
                  type="button"
                >
                  {t('remove')}
                </button>
              </div>
            ) : (
              <form
                className="flex gap-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  applyDiscount({ couponCode: couponInput })
                }}
              >
                <input
                  aria-label={t('couponCodeLabel')}
                  className="border-border bg-background focus:border-primary flex-1 rounded-lg border px-4 py-2.5 text-sm outline-none"
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder={t('couponCodePlaceholder')}
                  value={couponInput}
                />
                <button className="btn btn-primary" disabled={!couponInput || isApplyingDiscount} type="submit">
                  {t('apply')}
                </button>
              </form>
            )}
            {couponError && <p className="text-error mt-1.5 text-xs">{couponError}</p>}
          </div>

          {flags.giftCards && (
          <div>
            <p className="text-muted-foreground mb-3 font-medium">{t('haveGiftCard')}</p>
            {cart?.appliedGiftCardCode ? (
              <div className="flex items-center justify-between text-sm">
                <span>
                  {t('giftCardLabel')} <span className="font-medium">{cart.appliedGiftCardCode}</span>{' '}
                  {t('appliedLabel')}
                  {typeof cart.giftCardAmountApplied === 'number' && cart.giftCardAmountApplied > 0 && (
                    <>
                      {' '}
                      (-<Price amount={cart.giftCardAmountApplied} as="span" />)
                    </>
                  )}
                </span>
                <button
                  className="text-primary underline"
                  disabled={isApplyingDiscount}
                  onClick={() => applyDiscount({ remove: 'gift-card' })}
                  type="button"
                >
                  {t('remove')}
                </button>
              </div>
            ) : (
              <form
                className="flex gap-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  applyDiscount({ giftCardCode: giftCardInput })
                }}
              >
                <input
                  aria-label={t('giftCardCodeLabel')}
                  className="border-border bg-background focus:border-primary flex-1 rounded-lg border px-4 py-2.5 text-sm outline-none"
                  onChange={(e) => setGiftCardInput(e.target.value)}
                  placeholder={t('giftCardCodePlaceholder')}
                  value={giftCardInput}
                />
                <button
                  className="btn btn-primary"
                  disabled={!giftCardInput || isApplyingDiscount}
                  type="submit"
                >
                  {t('apply')}
                </button>
              </form>
            )}
            {giftCardError && <p className="text-error mt-1.5 text-xs">{giftCardError}</p>}
          </div>
          )}
        </div>

        <div className="bg-card border-border rounded-2xl border p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold">{t('orderSummary')}</h2>

          <div className="border-border flex items-center justify-between border-b pb-3 text-sm font-medium">
            <span>{t('product')}</span>
            <span>{t('subtotal')}</span>
          </div>

          <ul className="divide-border divide-y">
            {items.map((item, index) => {
              const product = item.product
              if (typeof product !== 'object' || !product) return null

              const variant = item.variant
              const unitPrice =
                typeof variant === 'object' && variant ? variant[priceField] : product[priceField]

              const lineTotal =
                typeof unitPrice === 'number' ? unitPrice * (item.quantity ?? 0) : undefined

              return (
                <li className="flex items-center justify-between py-3 text-sm" key={item.id ?? index}>
                  <span className="pr-4 text-foreground">{product.title}</span>
                  {typeof lineTotal === 'number' && (
                    <span className="shrink-0 font-medium">
                      <Price amount={lineTotal} />
                    </span>
                  )}
                </li>
              )
            })}
          </ul>

          {/* Fixed on mobile (matches the PDP buy bar's pattern) so the
              primary action stays reachable without scrolling past the full
              summary card; reverts to normal inline flow from lg up. */}
          <div className="border-border bg-card fixed inset-x-0 bottom-0 z-40 border-t p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-lg lg:static lg:inset-auto lg:z-auto lg:mt-2 lg:border-t lg:p-0 lg:pt-4 lg:pb-0 lg:shadow-none">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">{t('total')}</span>
              <span className="text-lg font-bold">
                <Price amount={cart?.subtotal ?? 0} />
              </span>
            </div>

            <Link
              className="btn btn-primary mt-3 w-full lg:mt-6"
              href="/checkout"
              aria-disabled={isLoading}
            >
              {t('proceedToCheckout')}
            </Link>

            <SecureCheckoutBadge className="mt-4 hidden lg:flex" />
          </div>
        </div>
      </div>
    </div>
  )
}

const CartRow: React.FC<{ item: CartItem; priceField: `priceIn${string}` }> = ({
  item,
  priceField,
}) => {
  const { decrementItem, incrementItem, removeItem, isLoading } = useCart()
  const t = useTranslations('cart')

  const product = item.product
  const variant = item.variant

  if (typeof product !== 'object' || !product || !product.slug) return null

  const isVariant = Boolean(variant) && typeof variant === 'object'

  const metaImage =
    product.meta?.image && typeof product.meta?.image === 'object' ? product.meta.image : undefined
  const firstGalleryImage =
    typeof product.gallery?.[0]?.image === 'object' ? product.gallery?.[0]?.image : undefined

  let image = firstGalleryImage || metaImage

  const unitPrice = isVariant && variant ? variant[priceField] : product[priceField]

  if (isVariant && variant) {
    const imageVariant = product.gallery?.find((galleryItem: GalleryItem) => {
      if (!galleryItem.variantOption) return false
      const variantOptionID =
        typeof galleryItem.variantOption === 'object'
          ? galleryItem.variantOption.id
          : galleryItem.variantOption

      return variant.options?.some((option: VariantOptionItem) => {
        if (typeof option === 'object') return option.id === variantOptionID
        return option === variantOptionID
      })
    })

    if (imageVariant && typeof imageVariant.image === 'object') {
      image = imageVariant.image
    }
  }

  const target = isVariant && variant ? variant : product
  const inventory = target?.inventory
  const atMaxInventory =
    typeof inventory === 'number' && typeof item.quantity === 'number' && item.quantity >= inventory

  const lineTotal = typeof unitPrice === 'number' ? unitPrice * (item.quantity ?? 0) : undefined

  return (
    <li className="bg-card border-border flex gap-4 rounded-2xl border p-4 shadow-sm">
      <Link className="bg-muted relative size-20 shrink-0 overflow-hidden rounded-xl" href={`/products/${product.slug}`}>
        {image ? (
          <Media className="relative h-full w-full" fill imgClassName="object-cover" resource={image} size="80px" />
        ) : (
          <div className="text-muted-foreground flex h-full w-full items-center justify-center text-xs">
            {t('noImage')}
          </div>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <Link className="group min-w-0" href={`/products/${product.slug}`}>
            <p className="group-hover:text-primary line-clamp-2 font-medium text-foreground transition-colors">
              {product.title}
            </p>
            {isVariant && variant?.options ? (
              <p className="text-muted-foreground text-xs capitalize">
                {variant.options
                  .map((option: VariantOptionItem) => (typeof option === 'object' ? option.label : null))
                  .filter(Boolean)
                  .join(', ')}
              </p>
            ) : null}
          </Link>

          <button
            aria-label={t('removeFromCart')}
            className="border-border text-muted-foreground hover:border-error hover:text-error inline-flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors"
            disabled={isLoading || !item.id}
            onClick={() => item.id && removeItem(item.id)}
            type="button"
          >
            <Trash2Icon className="size-4" />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="font-semibold text-foreground">
            {typeof unitPrice === 'number' ? <Price amount={unitPrice} /> : '—'}
          </span>

          <div className="flex items-center gap-3">
            <div className="border-border flex w-fit items-center rounded-lg border">
              <button
                aria-label={t('decreaseQuantity')}
                className="text-muted-foreground hover:text-foreground flex size-9 items-center justify-center disabled:opacity-40"
                disabled={isLoading || !item.id}
                onClick={() => item.id && decrementItem(item.id)}
                type="button"
              >
                <MinusIcon className="size-4" />
              </button>
              <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
              <button
                aria-label={t('increaseQuantity')}
                className="text-muted-foreground hover:text-foreground flex size-9 items-center justify-center disabled:opacity-40"
                disabled={isLoading || !item.id || atMaxInventory}
                onClick={() => item.id && incrementItem(item.id)}
                type="button"
              >
                <PlusIcon className="size-4" />
              </button>
            </div>

            {typeof lineTotal === 'number' && (
              <span className="text-muted-foreground w-20 shrink-0 text-right text-sm">
                <Price amount={lineTotal} />
              </span>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}
