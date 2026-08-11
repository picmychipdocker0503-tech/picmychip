import { Grid } from '@/components/Grid'
import React from 'react'

export default function Loading() {
  return (
    <div className="container py-16">
      <Grid className="grid-cols-2 lg:grid-cols-3">
        {Array(6)
          .fill(0)
          .map((_, index) => {
            return <div className="animate-shimmer aspect-video rounded-lg" key={index} />
          })}
      </Grid>
    </div>
  )
}
