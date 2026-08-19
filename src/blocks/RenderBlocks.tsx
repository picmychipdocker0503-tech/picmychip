import { ScrollReveal } from '@/components/ScrollReveal'

import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { BannerBlock } from '@/blocks/Banner/Component'
import { BrandStripBlock } from '@/blocks/BrandStrip/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { CarouselBlock } from '@/blocks/Carousel/Component'
import { CategoryGridBlock } from '@/blocks/CategoryGrid/Component'
import { ComparisonTableBlock } from '@/blocks/ComparisonTable/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { ContentFeedBlock } from '@/blocks/ContentFeed/Component'
import { FAQBlock } from '@/blocks/FAQ/Component'
import { FeaturedCollectionBlock } from '@/blocks/FeaturedCollection/Component'
import { FeatureBentoBlock } from '@/blocks/FeatureBento/Component'
import { FlashDealBlock } from '@/blocks/FlashDeal/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { HeroCarouselBlock } from '@/blocks/HeroCarousel/Component'
import { IllustratedCategoryGridBlock } from '@/blocks/IllustratedCategoryGrid/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { ServicesShowcaseBlock } from '@/blocks/ServicesShowcase/Component'
import { StatsStripBlock } from '@/blocks/StatsStrip/Component'
import { TeamCultureBlock } from '@/blocks/TeamCulture/Component'
import { TestimonialsBlock } from '@/blocks/Testimonials/Component'
import { ThreeItemGridBlock } from '@/blocks/ThreeItemGrid/Component'
import { TrendingProductsBlock } from '@/blocks/TrendingProducts/Component'
import { TrustBadgesStripBlock } from '@/blocks/TrustBadgesStrip/Component'
import { toKebabCase } from '@/utilities/toKebabCase'
import React, { Fragment } from 'react'

import type { Page } from '../payload-types'

const blockComponents = {
  archive: ArchiveBlock,
  banner: BannerBlock,
  brandStrip: BrandStripBlock,
  carousel: CarouselBlock,
  categoryGrid: CategoryGridBlock,
  comparisonTable: ComparisonTableBlock,
  content: ContentBlock,
  contentFeed: ContentFeedBlock,
  cta: CallToActionBlock,
  faq: FAQBlock,
  featureBento: FeatureBentoBlock,
  featuredCollection: FeaturedCollectionBlock,
  flashDeal: FlashDealBlock,
  formBlock: FormBlock,
  heroCarousel: HeroCarouselBlock,
  illustratedCategoryGrid: IllustratedCategoryGridBlock,
  mediaBlock: MediaBlock,
  servicesShowcase: ServicesShowcaseBlock,
  statsStrip: StatsStripBlock,
  teamCulture: TeamCultureBlock,
  testimonials: TestimonialsBlock,
  threeItemGrid: ThreeItemGridBlock,
  trendingProducts: TrendingProductsBlock,
  trustBadgesStrip: TrustBadgesStripBlock,
}

export const RenderBlocks: React.FC<{
  blocks: Page['layout'][0][]
  /** Skips the wrapper's top margin — for a block sitting directly under the
   * header (e.g. the home page's hero), where `my-16`'s top half reads as a
   * large dead gap rather than rhythm between blocks. */
  noTopSpacing?: boolean
}> = (props) => {
  const { blocks, noTopSpacing } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockName, blockType } = block

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType]

            if (Block) {
              return (
                <div className={noTopSpacing ? 'mb-16' : 'my-16'} key={index}>
                  <ScrollReveal>
                    {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                    {/* @ts-ignore - weird type mismatch here */}
                    <Block id={toKebabCase(blockName!)} {...block} />
                  </ScrollReveal>
                </div>
              )
            }
          }
          return null
        })}
      </Fragment>
    )
  }

  return null
}
