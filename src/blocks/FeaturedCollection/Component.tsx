import type { FeaturedCollectionBlock as FeaturedCollectionBlockProps } from '@/payload-types'

import { PromoCard } from '@/components/PromoCard'
import { cn } from '@/utilities/cn'
import React from 'react'

type Panel = NonNullable<FeaturedCollectionBlockProps['panels']>[number]

/* Mirrors CMSLink's own href resolution (src/components/Link/index.tsx) —
   duplicated rather than reused because here we need to know up front
   whether a href exists at all, to decide between a clickable card and a
   plain, non-linking one. */
const resolvePanelHref = (link: Panel['link']): string | null => {
  if (!link) return null
  if (link.type === 'reference' && typeof link.reference?.value === 'object' && link.reference.value?.slug) {
    return `${link.reference.relationTo !== 'pages' ? `/${link.reference.relationTo}` : ''}/${link.reference.value.slug}`
  }
  return link.url ?? null
}

export const FeaturedCollectionBlock: React.FC<
  FeaturedCollectionBlockProps & {
    id?: string | number
  }
> = ({ panels }) => {
  if (!panels?.length) return null

  const [primary, ...rest] = panels

  return (
    <section className="container my-20">
      <div className={cn('grid grid-cols-1 gap-6', rest.length > 0 && 'lg:grid-cols-[1.6fr_1fr]')}>
        <PromoCard
          buttonLabel={primary.link?.label || 'Shop Now'}
          className="min-h-[260px] lg:min-h-[440px]"
          description={primary.copy}
          eyebrow="Featured"
          heading={primary.heading}
          headingSize="lg"
          href={resolvePanelHref(primary.link)}
          image={primary.image}
          tone="dark"
        />

        {rest.length > 0 && (
          <div className="flex flex-col gap-6">
            {rest.map((panel, index) => (
              <PromoCard
                buttonLabel={panel.link?.label || 'Shop Now'}
                className="min-h-[180px] flex-1"
                description={panel.copy}
                eyebrow="Featured"
                heading={panel.heading}
                href={resolvePanelHref(panel.link)}
                image={panel.image}
                key={panel.id ?? index}
                tone="light"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
