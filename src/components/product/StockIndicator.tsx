'use client'
import { Product, Variant } from '@/payload-types'
import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

import { Badge } from '@/components/ui/badge'

type Props = {
  product: Product
}

const STOCK_STATUS_BADGE = {
  'in-stock': { label: 'In Stock', variant: 'success' as const },
  'low-stock': { label: 'Low Stock', variant: 'warning' as const },
  'out-of-stock': { label: 'Out of Stock', variant: 'destructive' as const },
  backorder: { label: 'Backorder', variant: 'warning' as const },
}

export const StockIndicator: React.FC<Props> = ({ product }) => {
  const searchParams = useSearchParams()

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

  const stockQuantity = useMemo(() => {
    if (product.enableVariants) {
      if (selectedVariant) {
        return selectedVariant.inventory || 0
      }
    }
    return product.inventory || 0
  }, [product.enableVariants, selectedVariant, product.inventory])

  const statusBadge = product.stockStatus ? STOCK_STATUS_BADGE[product.stockStatus] : undefined
  const showInventoryLine = !(product.enableVariants && !selectedVariant)

  if (!statusBadge && !showInventoryLine) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      {statusBadge && (
        <div className="flex items-center gap-2">
          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          {product.stockStatus === 'backorder' && product.leadTimeDays ? (
            <span className="text-muted-foreground text-sm">Ships in {product.leadTimeDays} days</span>
          ) : null}
        </div>
      )}
      {showInventoryLine && (
        <div className="uppercase font-mono text-sm font-medium text-gray-500">
          {stockQuantity < 10 && stockQuantity > 0 && <p>Only {stockQuantity} left in stock</p>}
          {(stockQuantity === 0 || !stockQuantity) && <p>Out of stock</p>}
        </div>
      )}
    </div>
  )
}
