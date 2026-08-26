'use client'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { CheckIcon, MinusIcon, PlusIcon, ShoppingCartIcon } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { setCartItemQuantity } from '@/lib/cart/setCartItemQuantity'
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
  const { addItem, cart, decrementItem, incrementItem, isLoading, refreshCart } = useCart()
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

  const [quantityInput, setQuantityInput] = useState(String(existingItem?.quantity ?? 1))
  const [isUpdatingQuantity, setIsUpdatingQuantity] = useState(false)

  // Resyncs the typed value whenever the committed quantity changes — from
  // this control's own commit, the +/- buttons, or a cart refresh elsewhere.
  useEffect(() => {
    setQuantityInput(String(existingItem?.quantity ?? 1))
  }, [existingItem?.quantity])

  const clampQuantity = (next: number) => {
    const clamped = Math.max(1, Math.floor(next) || 1)
    return typeof inventory === 'number' && inventory > 0 ? Math.min(inventory, clamped) : clamped
  }

  const commitQuantity = async () => {
    if (!existingItem?.id || !cart?.id) return
    const parsed = Number(quantityInput)
    const next = clampQuantity(Number.isNaN(parsed) ? (existingItem.quantity ?? 1) : parsed)
    setQuantityInput(String(next))
    if (next === existingItem.quantity) return

    setIsUpdatingQuantity(true)
    try {
      await setCartItemQuantity({ cartId: cart.id, itemId: existingItem.id, quantity: next })
      await refreshCart()
    } catch {
      setQuantityInput(String(existingItem.quantity ?? 1))
    } finally {
      setIsUpdatingQuantity(false)
    }
  }

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
          disabled={isLoading || isUpdatingQuantity}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            decrementItem(itemId)
          }}
          type="button"
        >
          <MinusIcon className="size-3.5" />
        </button>
        <input
          aria-label="Quantity"
          className="w-7 [appearance:textfield] bg-transparent text-center text-xs font-semibold [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          disabled={isLoading || isUpdatingQuantity}
          inputMode="numeric"
          max={typeof inventory === 'number' && inventory > 0 ? inventory : undefined}
          min={1}
          onBlur={commitQuantity}
          onChange={(e) => setQuantityInput(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.currentTarget.blur()
            }
          }}
          type="number"
          value={quantityInput}
        />
        <button
          aria-label="Increase quantity"
          className="text-muted-foreground hover:text-foreground flex h-full w-8 items-center justify-center disabled:opacity-40"
          disabled={isLoading || isUpdatingQuantity || atMax}
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
        'group border-foreground/15 text-foreground hover:bg-muted flex size-9 items-center justify-center gap-1.5 rounded-full border text-xs font-bold transition-[background-color,color,transform] duration-150 active:scale-90 disabled:cursor-not-allowed disabled:opacity-50',
        'sm:w-auto sm:px-4',
        justAdded && 'border-success text-success bg-success/10 hover:bg-success/10',
        className,
      )}
      disabled={disabled || isLoading}
      onClick={handleAdd}
      type="button"
    >
      <span className="grid">
        <ShoppingCartIcon
          className={cn(
            'pmc-icon-anim col-start-1 row-start-1 size-3.5 shrink-0 transition-transform duration-200 group-hover:animate-[pmc-icon-nudge-up_0.5s_ease-in-out]',
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
