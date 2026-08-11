import { ServiceQuickLinks } from '@/components/services/ServiceQuickLinks'
import type { HeroCarouselBlock as HeroCarouselBlockProps } from '@/payload-types'
import React, { Suspense } from 'react'

import { HeroCarouselClient } from './Component.client'

export const HeroCarouselBlock: React.FC<
  HeroCarouselBlockProps & {
    id?: string | number
  }
> = ({ slides }) => {
  if (!slides?.length) return null

  return (
    <section className="pmc-home-section">
      {/* Services */}

      <div className="pmc-services-container">
        <Suspense fallback={null}>
          <ServiceQuickLinks className="pmc-service-links" />
        </Suspense>
      </div>

      {/* Hero */}

      <div className="pmc-hero-container">
        <HeroCarouselClient slides={slides} />
      </div>
    </section>
  )
}
