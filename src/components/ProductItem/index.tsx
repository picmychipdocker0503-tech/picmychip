import { ProductMatchingImage } from '@/components/product/ProductMatchingImage'
import { Price } from '@/components/Price'
import { Product, Variant } from '@/payload-types'
import Link from 'next/link'
import React from 'react'

type Props = {
  product: Product
  style?: 'compact' | 'default'
  variant?: Variant
  quantity?: number
  currencyCode?: string
}

export const ProductItem: React.FC<Props> = ({
  product,
  quantity,
  variant,
  currencyCode,
}) => {
  const { title } = product

  const metaImage =
    product.meta?.image && typeof product.meta?.image !== 'string' ? product.meta.image : undefined

  const firstGalleryImage =
    typeof product.gallery?.[0]?.image !== 'string' ? product.gallery?.[0]?.image : undefined

  let image = firstGalleryImage || metaImage

  const isVariant = Boolean(variant) && typeof variant === 'object'

  if (isVariant) {
    const imageVariant = product.gallery?.find((item) => {
      if (!item.variantOption) return false
      const variantOptionID =
        typeof item.variantOption === 'object' ? item.variantOption.id : item.variantOption

      const hasMatch = variant?.options?.some((option) => {
        if (typeof option === 'object') return option.id === variantOptionID
        else return option === variantOptionID
      })

      return hasMatch
    })

    if (imageVariant && typeof imageVariant.image !== 'string') {
      image = imageVariant.image
    }
  }

  const itemPrice = variant?.priceInINR || product.priceInINR
  const itemURL = `/products/${product.slug}${variant ? `?variant=${variant.id}` : ''}`

  return (
    <div className="flex items-center gap-4 py-2">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl border border-border/80 bg-muted/20">
        <ProductMatchingImage
          className="w-full h-full"
          image={image}
          slug={product.slug}
          title={title}
        />
      </div>
      <div className="flex grow justify-between items-center min-w-0">
        <div className="flex flex-col gap-1 min-w-0">
          <p className="font-bold text-base text-foreground hover:text-primary transition-colors truncate">
            <Link href={itemURL}>{title}</Link>
          </p>
          {variant && (
            <p className="text-xs font-mono text-muted-foreground capitalize truncate">
              {variant.options
                ?.map((option) => {
                  if (typeof option === 'object') return option.label
                  return null
                })
                .filter(Boolean)
                .join(', ')}
            </p>
          )}
          <div className="text-xs font-mono text-muted-foreground">
            Qty: <strong className="text-foreground">{quantity}</strong>
          </div>
        </div>

        {itemPrice && quantity && (
          <div className="text-right shrink-0">
            <p className="text-[10px] font-mono uppercase text-muted-foreground">Subtotal</p>
            <Price
              className="font-mono font-bold text-foreground text-sm"
              amount={itemPrice * quantity}
              currencyCode={currencyCode}
            />
          </div>
        )}
      </div>
    </div>
  )
}
