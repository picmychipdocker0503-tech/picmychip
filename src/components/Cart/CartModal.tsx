'use client'

import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'

import { DeleteItemButton } from './DeleteItemButton'
import { EditItemQuantityButton } from './EditItemQuantityButton'
import { OpenCartButton } from './OpenCart'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { setCartItemQuantity } from '@/lib/cart/setCartItemQuantity'
import { FREE_SHIPPING_THRESHOLD } from '@/lib/shipping'
import { useFeatureFlags } from '@/lib/useFeatureFlags'
import { Product, Variant } from '@/payload-types'

type GalleryItem = NonNullable<Product['gallery']>[number]
type VariantOptionItem = NonNullable<Variant['options']>[number]
type CartItem = NonNullable<ReturnType<typeof useCart>['cart']>['items'] extends
  | (infer T)[]
  | undefined
  ? T
  : never

export function CartModal() {
  const { cart } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const flags = useFeatureFlags()

  const pathname = usePathname()

  useEffect(() => {
    // Close the cart modal when the pathname changes.
    setIsOpen(false)
  }, [pathname])

  // The badge on the cart icon is a count of distinct items in the cart, not
  // the sum of their quantities — 15 of one product and 1 of another reads
  // as "2 items in your cart", not "16".
  const itemCount = useMemo(() => {
    if (!cart || !cart.items || !cart.items.length) return undefined
    return cart.items.length
  }, [cart])

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger asChild>
        <OpenCartButton quantity={itemCount} />
      </SheetTrigger>

      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>My Cart</SheetTitle>

          <SheetDescription>Manage your cart here, add items to view the total.</SheetDescription>
        </SheetHeader>

        {!cart || cart?.items?.length === 0 ? (
          <div className="text-center flex flex-col items-center gap-2">
            <ShoppingCart className="h-16" />
            <p className="text-center text-2xl font-bold">Your cart is empty.</p>
          </div>
        ) : (
          <div className="grow flex px-4 min-h-0">
            <div className="flex flex-col justify-between w-full min-h-0">
              {flags.freeShippingBanner && typeof cart?.subtotal === 'number' && (
                <div className="border-border bg-muted/30 mb-2 rounded-lg border p-3 text-sm">
                  {cart.subtotal >= FREE_SHIPPING_THRESHOLD ? (
                    <p className="font-medium">🎉 You&apos;ve unlocked free shipping!</p>
                  ) : (
                    <p className="mb-2">
                      Add <Price amount={FREE_SHIPPING_THRESHOLD - cart.subtotal} as="span" /> more
                      for free shipping
                    </p>
                  )}
                  <Progress
                    value={(cart.subtotal / FREE_SHIPPING_THRESHOLD) * 100}
                    className="h-1.5"
                  />
                </div>
              )}

              <ul className="grow overflow-y-auto overflow-x-hidden py-4 min-h-0">
                {cart?.items?.map((item, i) => (
                  <CartModalItem item={item as CartItem} key={item.id ?? i} />
                ))}
              </ul>

              <div className="px-4">
                <div className="py-4 text-sm text-neutral-500 dark:text-neutral-400">
                  {typeof cart?.subtotal === 'number' && (
                    <div className="mb-3 flex items-center justify-between border-b border-neutral-200 pb-1 pt-1 dark:border-neutral-700">
                      <p>Total</p>
                      <Price
                        amount={cart?.subtotal}
                        className="text-right text-base text-black dark:text-white"
                      />
                    </div>
                  )}

                  <Button asChild variant="outline" className="mb-2 w-full">
                    <Link href="/cart">View Cart</Link>
                  </Button>

                  <Button asChild>
                    <Link className="w-full" href="/checkout">
                      Proceed to Checkout
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

const CartModalItem: React.FC<{ item: CartItem }> = ({ item }) => {
  const { cart, refreshCart } = useCart()
  const product = item.product
  const variant = item.variant

  const [quantityInput, setQuantityInput] = useState(String(item.quantity ?? 1))
  const [isUpdatingQuantity, setIsUpdatingQuantity] = useState(false)

  // Resyncs the typed value whenever the committed quantity changes —
  // whether from this row's own commit, the +/- buttons, or a cart refresh
  // triggered elsewhere.
  useEffect(() => {
    setQuantityInput(String(item.quantity ?? 1))
  }, [item.quantity])

  if (typeof product !== 'object' || !item || !product || !product.slug) return null

  const metaImage =
    product.meta?.image && typeof product.meta?.image === 'object' ? product.meta.image : undefined

  const firstGalleryImage =
    typeof product.gallery?.[0]?.image === 'object' ? product.gallery?.[0]?.image : undefined

  let image = firstGalleryImage || metaImage
  let price = product.priceInINR

  const isVariant = Boolean(variant) && typeof variant === 'object'

  if (isVariant) {
    price = variant?.priceInINR

    const imageVariant = product.gallery?.find((galleryItem: GalleryItem) => {
      if (!galleryItem.variantOption) return false
      const variantOptionID =
        typeof galleryItem.variantOption === 'object' ? galleryItem.variantOption.id : galleryItem.variantOption

      return variant?.options?.some((option: VariantOptionItem) => {
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

  const clampQuantity = (next: number) => {
    const clamped = Math.max(1, Math.floor(next) || 1)
    return typeof inventory === 'number' && inventory > 0 ? Math.min(inventory, clamped) : clamped
  }

  const commitQuantity = async () => {
    if (!item.id || !cart?.id) return
    const parsed = Number(quantityInput)
    const next = clampQuantity(Number.isNaN(parsed) ? (item.quantity ?? 1) : parsed)
    setQuantityInput(String(next))
    if (next === item.quantity) return

    setIsUpdatingQuantity(true)
    try {
      await setCartItemQuantity({ cartId: cart.id, itemId: item.id, quantity: next })
      await refreshCart()
    } catch {
      setQuantityInput(String(item.quantity ?? 1))
    } finally {
      setIsUpdatingQuantity(false)
    }
  }

  return (
    <li className="flex w-full min-w-0 flex-col">
      <div className="relative flex w-full min-w-0 flex-row justify-between gap-2 px-1 py-4">
        <div className="absolute z-40 -mt-2 ml-[55px]">
          <DeleteItemButton item={item} />
        </div>
        <Link className="z-30 flex min-w-0 flex-1 flex-row space-x-4" href={`/products/${product.slug}`}>
          <div className="relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-md border border-neutral-300 bg-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800">
            <Media fill imgClassName="h-full w-full object-cover" resource={image} size="64px" />
          </div>

          <div className="flex min-w-0 flex-1 flex-col text-base">
            <span className="truncate leading-tight">{product?.title}</span>
            {isVariant && variant ? (
              <p className="truncate text-sm text-neutral-500 dark:text-neutral-400 capitalize">
                {variant.options
                  ?.map((option: VariantOptionItem) => {
                    if (typeof option === 'object') return option.label
                    return null
                  })
                  .join(', ')}
              </p>
            ) : null}
          </div>
        </Link>
        <div className="flex h-16 shrink-0 flex-col justify-between">
          {typeof price === 'number' && (
            <Price amount={price} className="flex justify-end space-y-2 text-right text-sm" />
          )}
          <div className="ml-auto flex h-9 flex-row items-center rounded-lg border">
            <EditItemQuantityButton item={item} type="minus" />
            <input
              aria-label="Quantity"
              className="w-8 [appearance:textfield] bg-transparent text-center text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              disabled={isUpdatingQuantity}
              inputMode="numeric"
              max={typeof inventory === 'number' && inventory > 0 ? inventory : undefined}
              min={1}
              onBlur={commitQuantity}
              onChange={(e) => setQuantityInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  e.currentTarget.blur()
                }
              }}
              type="number"
              value={quantityInput}
            />
            <EditItemQuantityButton item={item} type="plus" />
          </div>
        </div>
      </div>
    </li>
  )
}
