'use client'

import type { Product } from '@/payload-types'

import { AddToCartButton } from '@/components/Cart/AddToCartButton'
import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { useWishlist } from '@/providers/Wishlist'
import { getWishlistProducts } from '@/providers/Wishlist/actions'
import { useCart, useCurrency } from '@payloadcms/plugin-ecommerce/client/react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import clsx from 'clsx'
import {
  AlertCircleIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowUpDownIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  HeartIcon,
  XCircleIcon,
  XIcon,
  ZapIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import posthog from 'posthog-js'
import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

const STOCK_DISPLAY = {
  'in-stock': { label: 'In Stock', icon: CheckCircle2Icon, className: 'text-success' },
  'low-stock': { label: 'Low Stock', icon: AlertCircleIcon, className: 'text-warning' },
  'out-of-stock': { label: 'Out of Stock', icon: XCircleIcon, className: 'text-error' },
  backorder: { label: 'Backorder', icon: ClockIcon, className: 'text-warning' },
} as const

type TableMeta = {
  onRemove: (product: Product) => void
}

const columnHelper = createColumnHelper<Product>()

const BuyNowButton: React.FC<{ product: Product }> = ({ product }) => {
  const { addItem, isLoading } = useCart()
  const router = useRouter()
  const [isBuyingNow, setIsBuyingNow] = useState(false)
  const outOfStock = product.stockStatus === 'out-of-stock'

  const handleBuyNow = () => {
    setIsBuyingNow(true)

    posthog.capture('wishlist_item_buy_now', {
      product_id: product.id,
      product_title: product.title,
    })

    addItem({ product: product.id })
      .then(() => {
        router.push('/checkout')
      })
      .catch(() => {
        setIsBuyingNow(false)
        toast.error('Could not start checkout — please try again.')
      })
  }

  return (
    <button
      aria-label="Buy now"
      className="border-foreground/15 text-foreground hover:bg-muted flex size-9 items-center justify-center gap-1.5 rounded-full border text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-4"
      disabled={outOfStock || isLoading || isBuyingNow}
      onClick={handleBuyNow}
      type="button"
    >
      <ZapIcon className="size-3.5 shrink-0" />
      <span className="hidden whitespace-nowrap sm:inline">{isBuyingNow ? 'Redirecting…' : 'Buy Now'}</span>
    </button>
  )
}

export default function WishlistPage() {
  const { ids, toggle, clear } = useWishlist()
  const { currency } = useCurrency()
  const [products, setProducts] = useState<Product[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])

  useEffect(() => {
    if (ids.length === 0) {
      setProducts([])
      setIsFetching(false)
      return
    }

    setIsFetching(true)

    getWishlistProducts(ids)
      .then((docs) => setProducts(docs))
      .finally(() => setIsFetching(false))
  }, [ids])

  const priceField = `priceIn${currency.code}` as keyof Product

  const meta = useMemo<TableMeta>(
    () => ({
      onRemove: (product) => toggle(String(product.id)),
    }),
    [toggle],
  )

  const columns = useMemo(
    () => [
      columnHelper.accessor('title', {
        cell: (info) => {
          const product = info.row.original
          const image =
            product.gallery?.[0]?.image && typeof product.gallery[0]?.image !== 'string'
              ? product.gallery[0]?.image
              : false

          return (
            <Link className="group flex items-center gap-4" href={`/products/${product.slug}`}>
              <div className="bg-muted relative size-16 shrink-0 overflow-hidden rounded-lg">
                {image ? (
                  <Media className="relative h-full w-full" fill imgClassName="object-cover" resource={image} size="64px" />
                ) : (
                  <div className="text-muted-foreground flex h-full w-full items-center justify-center text-xs">
                    No image
                  </div>
                )}
              </div>
              <span className="group-hover:text-primary font-medium text-foreground transition-colors">
                {info.getValue()}
              </span>
            </Link>
          )
        },
        header: 'Product',
      }),
      columnHelper.accessor((product) => (typeof product[priceField] === 'number' ? (product[priceField] as number) : null), {
        id: 'price',
        cell: (info) => {
          const value = info.getValue()
          return <span className="font-semibold">{typeof value === 'number' ? <Price amount={value} /> : '—'}</span>
        },
        header: 'Unit Price',
        meta: { className: 'hidden sm:table-cell' },
      }),
      columnHelper.accessor('stockStatus', {
        cell: (info) => {
          const stockStatus = info.getValue()
          const stock =
            stockStatus && stockStatus in STOCK_DISPLAY
              ? STOCK_DISPLAY[stockStatus as keyof typeof STOCK_DISPLAY]
              : STOCK_DISPLAY['in-stock']
          const StockIcon = stock.icon
          return (
            <span className={clsx('inline-flex items-center gap-1.5 text-sm font-medium', stock.className)}>
              <StockIcon className="size-4" />
              {stock.label}
            </span>
          )
        },
        header: 'Stock Status',
        meta: { className: 'hidden sm:table-cell' },
      }),
      columnHelper.display({
        cell: (info) => {
          const product = info.row.original
          return (
            <div className="flex items-center gap-2">
              <AddToCartButton
                outOfStock={product.stockStatus === 'out-of-stock'}
                inventory={product.inventory}
                onBeforeAdd={() =>
                  posthog.capture('wishlist_item_added_to_cart', {
                    product_id: product.id,
                    product_title: product.title,
                  })
                }
                productId={product.id}
              />
              <BuyNowButton product={product} />
            </div>
          )
        },
        header: 'Action',
        id: 'action',
      }),
      columnHelper.display({
        cell: (info) => {
          const product = info.row.original
          const tableMeta = info.table.options.meta as TableMeta
          return (
            <button
              aria-label="Remove from wishlist"
              className="border-border text-muted-foreground hover:border-error hover:text-error inline-flex size-8 items-center justify-center rounded-full border transition-colors"
              onClick={() => tableMeta.onRemove(product)}
              type="button"
            >
              <XIcon className="size-4" />
            </button>
          )
        },
        header: '',
        id: 'remove',
      }),
    ],
    [priceField],
  )

  const table = useReactTable({
    columns,
    data: products,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 10 } },
    meta,
    onSortingChange: setSorting,
    state: { sorting },
  })

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
          <button className="text-primary text-sm font-medium hover:underline" onClick={clear} type="button">
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
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr className="border-border text-muted-foreground border-b text-sm" key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const sortDirection = header.column.getIsSorted()
                      const className = (header.column.columnDef.meta as { className?: string } | undefined)?.className

                      return (
                        <th className={clsx('px-6 py-4 font-medium whitespace-nowrap', className)} key={header.id}>
                          {header.column.getCanSort() ? (
                            <button
                              className="flex cursor-pointer items-center gap-1 select-none"
                              onClick={header.column.getToggleSortingHandler()}
                              type="button"
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {sortDirection === 'asc' && <ArrowUpIcon className="size-3" />}
                              {sortDirection === 'desc' && <ArrowDownIcon className="size-3" />}
                              {!sortDirection && <ArrowUpDownIcon className="size-3 opacity-30" />}
                            </button>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                        </th>
                      )
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr className="border-border last:border-b-0 border-b" key={row.id}>
                    {row.getVisibleCells().map((cell) => {
                      const className = (cell.column.columnDef.meta as { className?: string } | undefined)?.className
                      return (
                        <td className={clsx('px-6 py-4', className)} key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {table.getPageCount() > 1 && (
            <div className="border-border flex items-center justify-between gap-3 border-t px-6 py-3">
              <span className="text-muted-foreground text-sm">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={!table.getCanPreviousPage()}
                  onClick={() => table.previousPage()}
                  type="button"
                >
                  <ChevronLeftIcon className="size-4" />
                  Prev
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={!table.getCanNextPage()}
                  onClick={() => table.nextPage()}
                  type="button"
                >
                  Next
                  <ChevronRightIcon className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
