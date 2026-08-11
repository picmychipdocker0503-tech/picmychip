'use client'

import type { Product } from '@/payload-types'

import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { useWishlist } from '@/providers/Wishlist'
import { getClientSideURL } from '@/utilities/getURL'
import { useCart, useCurrency } from '@payloadcms/plugin-ecommerce/client/react'
import clsx from 'clsx'
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  ClockIcon,
  HeartIcon,
  XCircleIcon,
  XIcon,
} from 'lucide-react'
import posthog from 'posthog-js'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'

const STOCK_DISPLAY = {
  'in-stock': { label: 'In Stock', icon: CheckCircle2Icon, className: 'text-success' },
  'low-stock': { label: 'Low Stock', icon: AlertCircleIcon, className: 'text-warning' },
  'out-of-stock': { label: 'Out of Stock', icon: XCircleIcon, className: 'text-error' },
  backorder: { label: 'Backorder', icon: ClockIcon, className: 'text-warning' },
} as const

export default function WishlistPage() {
  const { ids, toggle, clear } = useWishlist()
  const { addItem, isLoading } = useCart()
  const { currency } = useCurrency()
  const [products, setProducts] = useState<Product[]>([])
  const [isFetching, setIsFetching] = useState(true)

  useEffect(() => {
    if (ids.length === 0) {
      setProducts([])
      setIsFetching(false)
      return
    }

    setIsFetching(true)
    const query = ids.map((id) => `where[id][in][]=${id}`).join('&')

    fetch(`${getClientSideURL()}/api/products?${query}&depth=1&limit=${ids.length}`, {
      credentials: 'include',
    })
      .then((response) => response.json())
      .then((data) => setProducts(data?.docs ?? []))
      .finally(() => setIsFetching(false))
  }, [ids])

  if (!isFetching && ids.length === 0) {
    return (
      <div className="container flex flex-col items-center gap-4 py-24 text-center">
        <div className="bg-muted flex size-16 items-center justify-center rounded-full">
          <HeartIcon className="text-muted-foreground size-7" />
        </div>
        <h1 className="text-2xl font-bold">No favorites yet</h1>
        <p className="text-muted-foreground max-w-sm">
          Pick a product from the shop and hit the heart icon on it to save it here.
        </p>
        <Link className="btn btn-primary" href="/shop">
          Browse products
        </Link>
      </div>
    )
  }

  const priceField = `priceIn${currency.code}` as keyof Product

  return (
    <div className="container flex flex-col gap-6 py-16">
      <nav className="text-muted-foreground flex items-center gap-1.5 text-sm">
        <Link className="hover:text-foreground transition-colors" href="/">
          Home
        </Link>
        <ChevronRightIcon className="size-3.5" />
        <span className="text-foreground font-medium">Wishlist</span>
      </nav>

      <div className="flex items-end justify-between gap-4">
        <h1 className="text-2xl font-bold md:text-3xl">Your Wishlist</h1>
        {products.length > 0 && (
          <button
            className="text-primary text-sm font-medium hover:underline"
            onClick={clear}
            type="button"
          >
            Clear Wishlist
          </button>
        )}
      </div>

      {isFetching ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : (
        <div className="bg-card border-border overflow-hidden rounded-2xl border shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-border text-muted-foreground border-b text-sm">
                  <th className="px-6 py-4 font-medium">Product</th>
                  <th className="hidden px-6 py-4 font-medium sm:table-cell">Unit Price</th>
                  <th className="hidden px-6 py-4 font-medium sm:table-cell">Stock Status</th>
                  <th className="px-6 py-4 font-medium">Action</th>
                  <th className="w-14 px-4 py-4" />
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <WishlistRow
                    key={product.id}
                    isCartLoading={isLoading}
                    onAddToCart={() => {
                      posthog.capture('wishlist_item_added_to_cart', {
                        product_id: product.id,
                        product_title: product.title,
                      })
                      addItem({ product: product.id }).then(() => {
                        toast.success('Item added to cart.')
                      })
                    }}
                    onRemove={() => toggle(String(product.id))}
                    priceField={priceField}
                    product={product}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

const WishlistRow: React.FC<{
  product: Product
  priceField: keyof Product
  isCartLoading: boolean
  onAddToCart: () => void
  onRemove: () => void
}> = ({ product, priceField, isCartLoading, onAddToCart, onRemove }) => {
  const { gallery, title, slug, stockStatus } = product

  const image = gallery?.[0]?.image && typeof gallery[0]?.image !== 'string' ? gallery[0]?.image : false
  const price = product[priceField] as number | null | undefined
  const stock = stockStatus && stockStatus in STOCK_DISPLAY ? STOCK_DISPLAY[stockStatus as keyof typeof STOCK_DISPLAY] : STOCK_DISPLAY['in-stock']
  const StockIcon = stock.icon

  return (
    <tr className="border-border last:border-b-0 border-b">
      <td className="px-6 py-4">
        <Link className="group flex items-center gap-4" href={`/products/${slug}`}>
          <div className="bg-muted relative size-16 shrink-0 overflow-hidden rounded-lg">
            {image ? (
              <Media
                className="relative h-full w-full"
                fill
                imgClassName="object-cover"
                resource={image}
              />
            ) : (
              <div className="text-muted-foreground flex h-full w-full items-center justify-center text-xs">
                No image
              </div>
            )}
          </div>
          <span className="group-hover:text-primary font-medium text-foreground transition-colors">
            {title}
          </span>
        </Link>
      </td>
      <td className="hidden px-6 py-4 font-semibold sm:table-cell">
        {typeof price === 'number' ? <Price amount={price} /> : '—'}
      </td>
      <td className="hidden px-6 py-4 sm:table-cell">
        <span className={clsx('inline-flex items-center gap-1.5 text-sm font-medium', stock.className)}>
          <StockIcon className="size-4" />
          {stock.label}
        </span>
      </td>
      <td className="px-6 py-4">
        <button
          className="btn btn-outline btn-sm"
          disabled={isCartLoading || stockStatus === 'out-of-stock'}
          onClick={onAddToCart}
          type="button"
        >
          Add to Cart
        </button>
      </td>
      <td className="px-4 py-4 text-right">
        <button
          aria-label="Remove from wishlist"
          className="border-border text-muted-foreground hover:border-error hover:text-error inline-flex size-8 items-center justify-center rounded-full border transition-colors"
          onClick={onRemove}
          type="button"
        >
          <XIcon className="size-4" />
        </button>
      </td>
    </tr>
  )
}
