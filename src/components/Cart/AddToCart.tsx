'use client'

import { Button } from '@/components/ui/button'
import type { Product, Variant } from '@/payload-types'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { useLocale } from '@/providers/Locale'
import clsx from 'clsx'
import { CheckIcon, MinusIcon, PlusIcon } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'
import React, { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
type Props = {
  product: Product
}

export function AddToCart({ product }: Props) {
  const { addItem, cart, isLoading } = useCart()
  const { t } = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [justAdded, setJustAdded] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [isBuyingNow, setIsBuyingNow] = useState(false)

  const variants = product.variants?.docs || []

  const selectedVariant = useMemo<Variant | undefined>(() => {
    if (product.enableVariants && variants.length) {
      const variantId = searchParams.get('variant')

      const validVariant = variants.find((variant) => {
        if (typeof variant === 'object') {
          return String(variant.id) === variantId
        }
        return String(variant) === variantId
      })

      if (validVariant && typeof validVariant === 'object') {
        return validVariant
      }
    }

    return undefined
  }, [product.enableVariants, searchParams, variants])

  const availableInventory = product.enableVariants
    ? (selectedVariant?.inventory ?? 0)
    : (product.inventory ?? 0)

  const disabled = useMemo<boolean>(() => {
    const existingItem = cart?.items?.find((item) => {
      const productID = typeof item.product === 'object' ? item.product?.id : item.product
      const variantID = item.variant
        ? typeof item.variant === 'object'
          ? item.variant?.id
          : item.variant
        : undefined

      if (productID === product.id) {
        if (product.enableVariants) {
          return variantID === selectedVariant?.id
        }
        return true
      }
    })

    if (existingItem) {
      const existingQuantity = existingItem.quantity

      if (product.enableVariants) {
        return existingQuantity >= (selectedVariant?.inventory || 0)
      }
      return existingQuantity >= (product.inventory || 0)
    }

    if (product.enableVariants) {
      if (!selectedVariant) {
        return true
      }

      if (selectedVariant.inventory === 0) {
        return true
      }
    } else {
      if (product.inventory === 0) {
        return true
      }
    }

    return false
  }, [selectedVariant, cart?.items, product])

  const decreaseQuantity = () => setQuantity((prev) => Math.max(1, prev - 1))
  const increaseQuantity = () =>
    setQuantity((prev) => Math.min(availableInventory || prev + 1, prev + 1))

  const addToCart = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()

      // Feels instant — flips before the server confirms, reverts shortly after.
      setJustAdded(true)
      window.setTimeout(() => setJustAdded(false), 1500)

      posthog.capture('product_added_to_cart', {
        product_id: product.id,
        product_title: product.title,
        variant_id: selectedVariant?.id ?? null,
        quantity,
      })

      addItem(
        {
          product: product.id,
          variant: selectedVariant?.id ?? undefined,
        },
        quantity,
      ).then(() => {
        toast.success('Item added to cart.')
      })
    },
    [addItem, product, selectedVariant, quantity],
  )

  const buyNow = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      setIsBuyingNow(true)

      posthog.capture('buy_now_clicked', {
        product_id: product.id,
        product_title: product.title,
        variant_id: selectedVariant?.id ?? null,
        quantity,
      })

      addItem(
        {
          product: product.id,
          variant: selectedVariant?.id ?? undefined,
        },
        quantity,
      )
        .then(() => {
          router.push('/checkout')
        })
        .catch(() => {
          setIsBuyingNow(false)
          toast.error('Could not start checkout — please try again.')
        })
    },
    [addItem, product, selectedVariant, quantity, router],
  )

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="border-border bg-background flex items-center rounded-lg border">
        <button
          aria-label="Decrease quantity"
          className="text-muted-foreground hover:text-foreground flex size-9 items-center justify-center disabled:opacity-40"
          disabled={quantity <= 1}
          onClick={decreaseQuantity}
          type="button"
        >
          <MinusIcon className="size-4" />
        </button>
        <span className="w-8 text-center text-sm font-medium">{quantity}</span>
        <button
          aria-label="Increase quantity"
          className="text-muted-foreground hover:text-foreground flex size-9 items-center justify-center disabled:opacity-40"
          disabled={Boolean(availableInventory) && quantity >= availableInventory}
          onClick={increaseQuantity}
          type="button"
        >
          <PlusIcon className="size-4" />
        </button>
      </div>

      <Button
        aria-label="Add to cart"
        variant={'outline'}
        className={clsx({
          'hover:opacity-90': true,
        })}
        disabled={disabled || isLoading}
        onClick={addToCart}
        type="button"
      >
        {justAdded ? (
          <>
            <CheckIcon /> {t('added')}
          </>
        ) : (
          t('addToCart')
        )}
      </Button>

      <Button
        aria-label="Buy now"
        disabled={disabled || isLoading || isBuyingNow}
        onClick={buyNow}
        type="button"
      >
        {isBuyingNow ? t('redirecting') : t('buyNow')}
      </Button>
    </div>
  )
}
