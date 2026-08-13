import type { FeaturedCollectionBlock as FeaturedCollectionBlockProps } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import { ArrowUpRightIcon } from 'lucide-react'
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
          <div
            className="group border-border bg-muted relative aspect-[16/9] overflow-hidden rounded-2xl border"
            key={panel.id ?? index}
          >
            {typeof panel.image === 'object' && (
              <Media
                className="absolute inset-0"
                fill
                imgClassName="object-contain p-10 pb-20 transition-transform duration-300 group-hover:scale-105 sm:p-12 sm:pb-24"
                resource={panel.image}
              />
            )}
            <div className="from-background/95 via-background/40 absolute inset-0 bg-gradient-to-t to-transparent" />

            {panel.link?.label && (
              <div className="border-border bg-card/90 text-foreground absolute top-4 right-4 flex size-9 items-center justify-center rounded-full border backdrop-blur-sm transition-transform group-hover:scale-105">
                <ArrowUpRightIcon className="size-4" />
              </div>
            )}

            <div className="relative z-10 flex h-full flex-col justify-end gap-1.5 p-6">
              <span className="text-primary text-xs font-bold tracking-wide uppercase">Featured</span>
              <h3 className="text-foreground text-xl font-bold sm:text-2xl">{panel.heading}</h3>
              {panel.copy && <p className="text-muted-foreground max-w-sm text-sm">{panel.copy}</p>}
              {panel.link?.label && (
                <CMSLink
                  {...panel.link}
                  appearance="inline"
                  className="text-foreground group-hover:text-primary mt-2 inline-flex w-fit items-center gap-1.5 text-sm font-semibold underline-offset-4 group-hover:underline"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
