import type { Brand, BrandStripBlock as BrandStripBlockProps } from '@/payload-types'
import React from 'react'

import { getCachedGlobal } from '@/utilities/getGlobals'
import { BrandStripClient } from './Component.client'

export const BrandStripBlock: React.FC<
  BrandStripBlockProps & {
    id?: string | number
  }
> = async ({ heading, brands }) => {
  const featureFlags = await getCachedGlobal('feature-flags', 0)()
  if (featureFlags?.trustedByBrands === false) return null

  const resolvedBrands = (brands ?? []).filter((brand): brand is Brand => typeof brand === 'object')

  if (resolvedBrands.length === 0) return null

  return (
    <div className="bg-muted/30 py-4">
      <div className="container">
        <div className="bg-card border-border rounded-2xl p-8 shadow-sm">
          {heading && (
            <p className="text-muted-foreground mb-8 text-center text-sm font-semibold tracking-wide uppercase">
              {heading}
            </p>
          )}
          <BrandStripClient brands={resolvedBrands} />
        </div>
      </div>
    </div>
  )
}
