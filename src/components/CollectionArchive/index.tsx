import { cn } from '@/utilities/cn'
import React from 'react'

import type { Product } from '@/payload-types'

import { Grid } from '@/components/Grid'
import { ProductGridItem } from '@/components/ProductGridItem'
import { ScrollReveal } from '@/components/ScrollReveal'

export type Props = {
  posts: Product[]
}

export const CollectionArchive: React.FC<Props> = (props) => {
  const { posts } = props

  return (
    <div className={cn('container')}>
      <Grid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {posts?.map((result, index) => {
          if (typeof result === 'object' && result !== null) {
            return (
              <ScrollReveal className="h-full" index={index % 8} key={index} staggerMs={50}>
                <ProductGridItem product={result} />
              </ScrollReveal>
            )
          }

          return null
        })}
      </Grid>
    </div>
  )
}
