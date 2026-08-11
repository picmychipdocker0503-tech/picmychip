import { cn } from '@/utilities/cn'
import React from 'react'

import type { Product } from '@/payload-types'

import { Grid } from '@/components/Grid'
import { ProductGridItem } from '@/components/ProductGridItem'

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
              <ProductGridItem key={index} product={result} />
            )
          }

          return null
        })}
      </Grid>
    </div>
  )
}
