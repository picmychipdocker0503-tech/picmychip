import { Grid } from '@/components/Grid'
import { ProductGridItemSkeleton } from '@/components/ProductGridItem/Skeleton'
import React from 'react'

export default function Loading() {
  return (
    <div className="container pt-16 pb-24">
      <Grid className="grid-cols-2 lg:grid-cols-3">
        {Array(9)
          .fill(0)
          .map((_, index) => (
            <ProductGridItemSkeleton key={index} />
          ))}
      </Grid>
    </div>
  )
}
