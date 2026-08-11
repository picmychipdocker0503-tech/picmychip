import type { FeaturedCollectionBlock as FeaturedCollectionBlockProps } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import React from 'react'

export const FeaturedCollectionBlock: React.FC<
  FeaturedCollectionBlockProps & {
    id?: string | number
  }
> = ({ panels }) => {
  if (!panels?.length) return null

  return (
    <div className="container">
      <div className={`grid grid-cols-1 gap-6 ${panels.length > 1 ? 'md:grid-cols-2' : ''}`}>
        {panels.map((panel, index) => (
          <div className="card-hover group relative aspect-[16/9] overflow-hidden rounded-2xl" key={panel.id ?? index}>
            {typeof panel.image === 'object' && (
              <Media
                className="absolute inset-0"
                fill
                imgClassName="object-cover transition-transform duration-500 group-hover:scale-105"
                resource={panel.image}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="relative z-10 flex h-full flex-col justify-end gap-2 p-6 text-white">
              <h3 className="text-xl font-bold sm:text-2xl">{panel.heading}</h3>
              {panel.copy && <p className="max-w-sm text-sm text-white/85">{panel.copy}</p>}
              {panel.link?.label && <CMSLink {...panel.link} className="mt-2 w-fit" size="sm" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
