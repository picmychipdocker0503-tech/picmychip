'use client'

import * as React from 'react'
import { Star, Scale, ShoppingCart } from 'lucide-react'

import { cn } from '@/components/pmc-ui/lib/cn'
import { Card } from '@/components/pmc-ui/primitives/Card'
import { Badge } from '@/components/pmc-ui/primitives/Badge'
import { Button } from '@/components/pmc-ui/primitives/Button'

export interface ProductCardData {
  title: string
  href: string
  imageUrl?: string
  brand?: string
  partNumber?: string
  price?: string
  compareAtPrice?: string
  stockStatus?: 'in-stock' | 'low-stock' | 'out-of-stock' | 'backorder'
  rating?: number
  reviewCount?: number
}

export interface ProductCardProps {
  product: ProductCardData
  onAddToCart?: () => void
  onToggleCompare?: () => void
  isComparing?: boolean
  className?: string
}

const stockLabel: Record<NonNullable<ProductCardData['stockStatus']>, string> = {
  'in-stock': 'In stock',
  'low-stock': 'Low stock',
  'out-of-stock': 'Out of stock',
  backorder: 'Backorder',
}

export function ProductCard({ product, onAddToCart, onToggleCompare, isComparing, className }: ProductCardProps) {
  return (
    <Card hoverable className={cn('flex flex-col overflow-hidden', className)}>
      <a href={product.href} className="block">
        <div className="relative aspect-square bg-pmc-slate-50">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.title}
              className="size-full object-contain p-6"
              loading="lazy"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-xs text-pmc-ink-400">No image</div>
          )}
          {product.stockStatus && (
            <Badge
              variant={
                product.stockStatus === 'in-stock'
                  ? 'in-stock'
                  : product.stockStatus === 'low-stock'
                    ? 'low-stock'
                    : 'out-of-stock'
              }
              className="absolute left-3 top-3"
            >
              {stockLabel[product.stockStatus]}
            </Badge>
          )}
        </div>
      </a>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {product.brand && (
          <span className="text-xs font-semibold uppercase tracking-wide text-pmc-blue-700">{product.brand}</span>
        )}
        <a href={product.href} className="text-sm font-medium text-pmc-ink-900 hover:text-pmc-blue-700">
          {product.title}
        </a>
        {product.partNumber && (
          <span className="font-mono text-xs text-pmc-ink-400">{product.partNumber}</span>
        )}

        {typeof product.rating === 'number' && (
          <div className="flex items-center gap-1 text-xs text-pmc-ink-500">
            <span className="flex items-center gap-0.5 text-pmc-orange-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn('size-3.5', i < Math.round(product.rating!) ? 'fill-current' : 'fill-none')}
                  aria-hidden="true"
                />
              ))}
            </span>
            {typeof product.reviewCount === 'number' && <span>({product.reviewCount})</span>}
          </div>
        )}

        <div className="mt-1 flex items-baseline gap-2">
          {product.price && <span className="text-base font-semibold text-pmc-ink-900">{product.price}</span>}
          {product.compareAtPrice && (
            <span className="text-sm text-pmc-ink-400 line-through">{product.compareAtPrice}</span>
          )}
        </div>

        <div className="mt-auto flex items-center gap-2 pt-3">
          <Button size="sm" className="flex-1" leftIcon={<ShoppingCart className="size-4" />} onClick={onAddToCart}>
            Add to cart
          </Button>
          <Button
            size="sm"
            variant={isComparing ? 'secondary' : 'ghost'}
            aria-pressed={isComparing}
            aria-label="Toggle compare"
            onClick={onToggleCompare}
          >
            <Scale className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
