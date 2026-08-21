import type { Brand, BrandStripBlock as BrandStripBlockProps } from '@/payload-types'
import dynamic from 'next/dynamic'
import React from 'react'

import { getCachedGlobal } from '@/utilities/getGlobals'

// Below-the-fold brand row — splits `embla-carousel` (+ its auto-scroll
// plugin) out of every page's main bundle into its own chunk, fetched only
// on pages that actually render this block.
const BrandStripClient = dynamic(() =>
  import('./Component.client').then((mod) => mod.BrandStripClient),
)

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
