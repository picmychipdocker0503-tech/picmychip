'use client'

import { Button } from '@/components/ui/button'
import { setCartItemQuantity } from '@/lib/cart/setCartItemQuantity'
import type { Product, Variant } from '@/payload-types'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { useTranslations } from 'next-intl'
import { CheckIcon, MinusIcon, PlusIcon, ShoppingCartIcon, ZapIcon } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
type Props = {
  product: Product
}

export function AddToCart({ product }: Props) {
  const { addItem, cart, isLoading, refreshCart } = useCart()
  const t = useTranslations('cart')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [justAdded, setJustAdded] = useState(false)
  const [quantity, setQuantity] = useState(1)
  // The input's own text, separate from the committed `quantity` number —
  // a number input bound straight to a number state can't ever show "" while
  // you're backspacing a single digit to retype it (nothing changes, so
  // React never re-renders, but the very next re-render from anything else —
  // a cart refresh, a parent state change — snaps it straight back to the
  // old value with nothing typed yet in between).
  const [quantityInput, setQuantityInput] = useState('1')
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

  // The line already in the cart for this exact product/variant, if any —
  // used both to pre-fill the quantity box with what's already there (rather
  // than always resetting to 1) and, in addToCart/buyNow below, to set that
  // line to the edited total instead of calling addItem (which always ADDS
  // to an existing line's quantity, so re-submitting an unchanged pre-filled
  // 12 would silently double it to 24).
  const existingItem = useMemo(() => {
    return cart?.items?.find((item) => {
      const productID = typeof item.product === 'object' ? item.product?.id : item.product
      const variantID = item.variant
        ? typeof item.variant === 'object'
          ? item.variant?.id
          : item.variant
        : undefined

      if (productID !== product.id) return false
      return product.enableVariants ? variantID === selectedVariant?.id : true
    })
  }, [cart?.items, product, selectedVariant])

  useEffect(() => {
    const next = existingItem?.quantity ?? 1
    setQuantity(next)
    setQuantityInput(String(next))
  }, [existingItem?.quantity])

  const disabled = useMemo<boolean>(() => {
    if (product.enableVariants) {
      if (!selectedVariant) return true
      if ((selectedVariant.inventory ?? 0) <= 0) return true
    } else if ((product.inventory ?? 0) <= 0) {
      return true
    }

    return false
  }, [selectedVariant, product])

  const clampQuantity = useCallback(
    (next: number) => {
      const clamped = Math.max(1, Math.floor(next) || 1)
      return availableInventory > 0 ? Math.min(availableInventory, clamped) : clamped
    },
    [availableInventory],
  )

  // If this product/variant is already a line in the cart, pushes the new
  // quantity straight to the server so the cart reflects an edit immediately
  // — no separate "Add to Cart" click needed once it's already there.
  const syncExistingLine = useCallback(
    (next: number) => {
      if (!existingItem?.id || !cart?.id || next === existingItem.quantity) return
      setCartItemQuantity({ cartId: cart.id, itemId: existingItem.id, quantity: next })
        .then(() => refreshCart())
        .catch(() => {
          toast.error('Could not update cart quantity — please try again.')
        })
    },
    [existingItem, cart?.id, refreshCart],
  )

  const applyQuantity = useCallback(
    (next: number) => {
      const clamped = clampQuantity(next)
      setQuantity(clamped)
      setQuantityInput(String(clamped))
      syncExistingLine(clamped)
    },
    [clampQuantity, syncExistingLine],
  )

  const decreaseQuantity = () => applyQuantity(quantity - 1)
  const increaseQuantity = () => applyQuantity(quantity + 1)

  const handleQuantityInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Always mirror exactly what's typed, including empty — this is a plain
    // text buffer, not the committed quantity, so there's nothing to clamp
    // or reject here (that happens once editing finishes, in commitInput).
    setQuantityInput(event.target.value)
  }

  const commitQuantityInput = () => {
    const parsed = Number(quantityInput)
    applyQuantity(quantityInput === '' || Number.isNaN(parsed) ? 1 : parsed)
  }

  const handleQuantityInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur()
    }
  }

  // Set the existing line to `quantity` outright if one's already in the
  // cart (see the existingItem comment above); otherwise add a new one. In
  // the already-in-cart case this is normally already a no-op by the time
  // it's called, since syncExistingLine committed the edit as it happened —
  // kept as a fallback for the rare case a click reaches the button before
  // the input's blur/commit does.
  const commitQuantity = useCallback(() => {
    if (existingItem?.id && cart?.id) {
      if (quantity === existingItem.quantity) return Promise.resolve()
      return setCartItemQuantity({ cartId: cart.id, itemId: existingItem.id, quantity }).then(() =>
        refreshCart(),
      )
    }

    return addItem(
      {
        product: product.id,
        variant: selectedVariant?.id ?? undefined,
      },
      quantity,
    )
  }, [existingItem, cart?.id, quantity, refreshCart, addItem, product.id, selectedVariant])

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

      commitQuantity().then(() => {
        toast.success('Item added to cart.')
      })
    },
    [commitQuantity, product, selectedVariant, quantity],
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

      commitQuantity()
        .then(() => {
          router.push('/checkout')
        })
        .catch(() => {
          setIsBuyingNow(false)
          toast.error('Could not start checkout — please try again.')
        })
    },
    [commitQuantity, product, selectedVariant, quantity, router],
  )

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex flex-wrap items-center gap-3 border-t border-border bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-lg lg:static lg:inset-auto lg:z-auto lg:border-0 lg:bg-transparent lg:p-0 lg:pb-0 lg:shadow-none">
      <div className="border-border bg-background hidden items-center rounded-lg border lg:flex">
        <button
          aria-label="Decrease quantity"
          className="text-muted-foreground hover:text-foreground flex size-9 items-center justify-center disabled:opacity-40"
          disabled={quantity <= 1}
          onClick={decreaseQuantity}
          type="button"
        >
          <MinusIcon className="size-4" />
        </button>
        <input
          aria-label="Quantity"
          className="w-10 [appearance:textfield] bg-transparent text-center text-sm font-medium [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          inputMode="numeric"
          max={availableInventory > 0 ? availableInventory : undefined}
          min={1}
          onBlur={commitQuantityInput}
          onChange={handleQuantityInputChange}
          onKeyDown={handleQuantityInputKeyDown}
          type="number"
          value={quantityInput}
        />
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
        className="border-white/30 bg-white/10 text-foreground shadow-md backdrop-blur-md backdrop-saturate-150 hover:border-white/40 hover:bg-white/20"
        disabled={disabled || isLoading}
        onClick={addToCart}
        type="button"
      >
        {justAdded ? (
          <>
            <CheckIcon /> {t('added')}
          </>
        ) : (
          <>
            <ShoppingCartIcon /> {t('addToCart')}
          </>
        )}
      </Button>

      <Button
        aria-label="Buy now"
        disabled={disabled || isLoading || isBuyingNow}
        onClick={buyNow}
        type="button"
      >
        {isBuyingNow ? (
          t('redirecting')
        ) : (
          <>
            <ZapIcon /> {t('buyNow')}
          </>
        )}
      </Button>
    </div>
  )
}
