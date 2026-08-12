import { cn } from '@/utilities/cn'
import React from 'react'

import type { Product } from '@/payload-types'

import { Grid } from '@/components/Grid'
import { DealProductCard } from '@/components/product/DealProductCard'
import { ScrollReveal } from '@/components/ScrollReveal'

export type Props = {
  posts: Product[]
}

export const CollectionArchive: React.FC<Props> = (props) => {
  const { posts } = props

  return (
    <div className={cn('container')}>
      <Grid className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {posts?.map((result, index) => {
          if (typeof result === 'object' && result !== null) {
            return (
              <ScrollReveal className="h-full" index={index % 8} key={index} staggerMs={50}>
                <DealProductCard product={result} />
              </ScrollReveal>
            )
          }

          return null
        })}
      </Grid>
    </div>
  )
}
