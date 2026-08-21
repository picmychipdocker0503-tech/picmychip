'use client'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { CheckIcon, MinusIcon, PlusIcon, ShoppingCartIcon } from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { cn } from '@/utilities/cn'

import { NotifyMeButton } from './NotifyMeButton'

type Props = {
  productId: number
  variantId?: number
  /** Caps the in-cart stepper's `+` once reached — omit when unknown/unlimited. */
  inventory?: number | null
  /** Swaps the whole control for a "Notify me when back in stock" flip-button instead of a disabled Add to Cart. */
  outOfStock?: boolean
  disabled?: boolean
  successMessage?: string
  className?: string
  /** Fired synchronously on click, before `addItem` — for analytics events tied to the add action. */
  onBeforeAdd?: () => void
}

/**
 * Solid black pill by default, collapsing to an icon-only outline button
 * below `sm` to save space in tight card grids. Once this product (+variant)
 * is already in the cart, it swaps for a split quantity stepper so the
 * shopper can adjust the cart line right from the grid/list instead of
 * re-adding it and re-triggering the confirmation toast every time.
 */
export const AddToCartButton: React.FC<Props> = ({
  productId,
  variantId,
  inventory,
  outOfStock,
  disabled,
  successMessage = 'Item added to cart.',
  className,
  onBeforeAdd,
}) => {
  const { addItem, cart, decrementItem, incrementItem, isLoading } = useCart()
  const [justAdded, setJustAdded] = useState(false)

  const existingItem = useMemo(() => {
    return cart?.items?.find((item) => {
      const itemProductId = typeof item.product === 'object' ? item.product?.id : item.product
      const itemVariantId = item.variant
        ? typeof item.variant === 'object'
          ? item.variant?.id
          : item.variant
        : undefined

      return (
        String(itemProductId) === String(productId) && String(itemVariantId ?? '') === String(variantId ?? '')
      )
    })
  }, [cart?.items, productId, variantId])

  const handleAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()

    onBeforeAdd?.()

    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 1200)

    addItem({ product: productId, variant: variantId }).then(() => {
      toast.success(successMessage)
    })
  }

  if (outOfStock) {
    return <NotifyMeButton className={className} productId={productId} />
  }

  if (existingItem?.id && existingItem.quantity) {
    const atMax = typeof inventory === 'number' && inventory > 0 && existingItem.quantity >= inventory
    const itemId = String(existingItem.id)

    return (
      <div
        className={cn(
          'border-border bg-background pmc-cart-pop inline-flex h-9 items-center overflow-hidden rounded-full border',
          className,
        )}
      >
        <button
          aria-label="Decrease quantity"
          className="text-muted-foreground hover:text-foreground flex h-full w-8 items-center justify-center disabled:opacity-40"
          disabled={isLoading}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            decrementItem(itemId)
          }}
          type="button"
        >
          <MinusIcon className="size-3.5" />
        </button>
        <span className="w-5 text-center text-xs font-semibold">{existingItem.quantity}</span>
        <button
          aria-label="Increase quantity"
          className="text-muted-foreground hover:text-foreground flex h-full w-8 items-center justify-center disabled:opacity-40"
          disabled={isLoading || atMax}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            incrementItem(itemId)
          }}
          type="button"
        >
          <PlusIcon className="size-3.5" />
        </button>
        <span className="bg-foreground text-background flex h-full w-9 items-center justify-center">
          <ShoppingCartIcon className="size-3.5" />
        </span>
      </div>
    )
  }

  return (
    <button
      aria-label="Add to cart"
      className={cn(
        'border-foreground/15 text-foreground hover:bg-muted flex size-9 items-center justify-center gap-1.5 rounded-full border text-xs font-bold transition-[background-color,color,transform] duration-150 active:scale-90 disabled:cursor-not-allowed disabled:opacity-50',
        'sm:bg-foreground sm:text-background sm:hover:bg-foreground/90 sm:w-auto sm:border-transparent sm:px-4',
        justAdded && 'sm:bg-success sm:hover:bg-success',
        className,
      )}
      disabled={disabled || isLoading}
      onClick={handleAdd}
      type="button"
    >
      <span className="grid">
        <ShoppingCartIcon
          className={cn(
            'col-start-1 row-start-1 size-3.5 shrink-0 transition-transform duration-200',
            justAdded && 'scale-0',
          )}
        />
        <CheckIcon
          className={cn(
            'col-start-1 row-start-1 size-3.5 shrink-0 scale-0 transition-transform duration-200',
            justAdded && 'scale-100',
          )}
        />
      </span>
      <span className="hidden sm:inline">{justAdded ? 'Added' : 'Add to cart'}</span>
    </button>
  )
}
