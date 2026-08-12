import { Grid } from '@/components/Grid'
import { DealProductCardSkeleton } from '@/components/product/DealProductCardSkeleton'
import React from 'react'

export default function Loading() {
  return (
    <div className="container pt-16 pb-24">
      <Grid className="grid-cols-2 sm:grid-cols-4">
        {Array(9)
          .fill(0)
          .map((_, index) => (
            <DealProductCardSkeleton key={index} />
          ))}
      </Grid>
    </div>
  )
}
