import type { Media as MediaType, Product } from '@/payload-types'

import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { getTrendingProducts } from '@/lib/getTrendingProducts'
import configPromise from '@payload-config'
import { ArrowRight, FlameIcon } from 'lucide-react'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

export const BestSellersQuickLinks: React.FC<{ className?: string }> = async ({ className }) => {
  const payload = await getPayload({ config: configPromise })

  const candidates = await getTrendingProducts({ payload, limit: 8 })
  const products = candidates.filter((product) => product.stockStatus !== 'out-of-stock').slice(0, 4)

  if (products.length === 0) return null

  return (
    <div className={`pmc-services-hub ${className || ''}`}>
      <div className="pmc-services-hub-header">
        <span className="pmc-services-hub-pill">
          <FlameIcon className="size-3" />
          Best Sellers
        </span>
        <span className="pmc-services-hub-title">Frequently Purchased</span>
      </div>

      <div className="pmc-service-links-list">
        {products.map((product: Product) => {
          const image = product.gallery?.find((item) => typeof item.image === 'object')?.image as
            | MediaType
            | undefined

          return (
            <Link className="pmc-service-card pmc-product-card group" href={`/products/${product.slug}`} key={product.id}>
              <div className="pmc-service-icon-box pmc-product-icon-box">
                {image ? (
                  <Media className="relative h-full w-full" fill imgClassName="object-contain p-1" resource={image} />
                ) : (
                  <span className="text-muted-foreground text-[9px]">No image</span>
                )}
              </div>

              <div className="pmc-service-info">
                <span className="pmc-service-title group-hover:text-primary transition-colors">
                  {product.title}
                </span>
                {typeof product.priceInINR === 'number' && (
                  <Price amount={product.priceInINR} as="span" className="pmc-service-subtitle" />
                )}
              </div>

              <div className="pmc-service-arrow">
                <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
