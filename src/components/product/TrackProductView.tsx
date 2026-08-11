'use client'

import posthog from 'posthog-js'
import { useEffect } from 'react'

type Props = {
  productId: number
  productTitle: string
  productSlug: string
  price?: number | null
}

export function TrackProductView({ productId, productTitle, productSlug, price }: Props) {
  useEffect(() => {
    posthog.capture('product_viewed', {
      product_id: productId,
      product_title: productTitle,
      product_slug: productSlug,
      price,
    })
  }, [productId, productTitle, productSlug, price])

  return null
}
