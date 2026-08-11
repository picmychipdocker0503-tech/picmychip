import type { FacetDef } from '@/lib/facetConfig'
import React from 'react'

import { RangeFacet } from '@/components/Search/RangeFacet'
import { SelectFacet } from '@/components/Search/SelectFacet'

type Props = {
  facets: FacetDef[]
  facetDistribution?: Record<string, Record<string, number>>
}

/**
 * Only renders when facet data actually came from Meilisearch — the Mongo
 * fallback query doesn't support facet filtering, so there's nothing
 * meaningful to show or filter by when the search backend is unreachable.
 */
export const FacetSidebar: React.FC<Props> = ({ facets, facetDistribution }) => {
  if (!facetDistribution || facets.length === 0) return null

  return (
    <div className="flex w-full flex-none flex-col gap-6 basis-1/5">
      <h3 className="text-xs text-muted-foreground">Filter</h3>
      {facets.map((facet) =>
        facet.type === 'range' ? (
          <RangeFacet facet={facet} key={facet.attribute} />
        ) : (
          <SelectFacet
            distribution={facetDistribution[facet.attribute]}
            facet={facet}
            key={facet.attribute}
          />
        ),
      )}
    </div>
  )
}
