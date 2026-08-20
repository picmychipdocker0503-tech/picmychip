import React from 'react'

import './HeroCarouselClient.css'

const TRUST_ITEM_COUNT = 3
const SIDE_CARD_COUNT = 2

/**
 * Mirrors HeroCarouselBlock's actual layout (split hero card + two side promo
 * cards + trust strip) so the Suspense fallback while its data resolves
 * doesn't leave the page's most prominent, above-the-fold section blank.
 */
export const HeroCarouselSkeleton: React.FC = () => (
  <section className="pmc-home-section" aria-hidden="true">
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
      <div className="pmc-hero">
        <div className="pmc-hero-left">
          <div className="pmc-hero-content w-full">
            <div className="animate-shimmer mb-5 h-6 w-32 rounded-full" />
            <div className="animate-shimmer h-10 w-[85%] rounded-lg" />
            <div className="animate-shimmer mt-3 h-10 w-3/5 rounded-lg" />
            <div className="animate-shimmer mt-5 h-4 w-full rounded" />
            <div className="animate-shimmer mt-2 h-4 w-2/3 rounded" />
            <div className="mt-7 flex flex-wrap gap-3">
              <div className="animate-shimmer h-11 w-40 rounded-xl" />
              <div className="animate-shimmer h-11 w-40 rounded-xl" />
            </div>
            <div className="mt-7 h-16 border-t border-border pt-5">
              <div className="animate-shimmer h-4 w-56 rounded" />
            </div>
          </div>
        </div>
        <div className="pmc-hero-right">
          <div className="animate-shimmer aspect-square w-full max-w-[320px] rounded-2xl" />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {Array.from({ length: SIDE_CARD_COUNT }, (_, i) => (
          <div
            className="bg-muted flex min-h-[180px] flex-1 items-center gap-4 rounded-3xl px-7 py-7"
            key={i}
          >
            <div className="min-w-0 flex-1">
              <div className="animate-shimmer h-3 w-20 rounded" />
              <div className="animate-shimmer mt-3 h-5 w-36 rounded" />
              <div className="animate-shimmer mt-6 h-9 w-28 rounded-full" />
            </div>
            <div className="animate-shimmer aspect-square w-2/5 shrink-0 rounded-xl" />
          </div>
        ))}
      </div>
    </div>

    <ul className="pmc-trust-strip">
      {Array.from({ length: TRUST_ITEM_COUNT }, (_, i) => (
        <li className="pmc-trust-strip-item" key={i}>
          <div className="animate-shimmer pmc-trust-strip-icon" />
          <div className="animate-shimmer h-3.5 w-24 rounded" />
        </li>
      ))}
    </ul>
  </section>
)
