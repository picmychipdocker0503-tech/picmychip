import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { BannerBlock } from '@/blocks/Banner/Component'
import { BrandStripBlock } from '@/blocks/BrandStrip/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { CarouselBlock } from '@/blocks/Carousel/Component'
import { CategoryGridBlock } from '@/blocks/CategoryGrid/Component'
import { ComparisonTableBlock } from '@/blocks/ComparisonTable/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { ContentFeedBlock } from '@/blocks/ContentFeed/Component'
import { CustomerInteractionBlock } from '@/blocks/CustomerInteraction/Component'
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
  customerInteraction: CustomerInteractionBlock,
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
  testimonials: TestimonialsBlock,
  threeItemGrid: ThreeItemGridBlock,
  trendingProducts: TrendingProductsBlock,
  trustBadgesStrip: TrustBadgesStripBlock,
}

export const RenderBlocks: React.FC<{
  blocks: Page['layout'][0][]
}> = (props) => {
  const { blocks } = props

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
                <div className="my-16" key={index}>
                  {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                  {/* @ts-ignore - weird type mismatch here */}
                  <Block id={toKebabCase(blockName!)} {...block} />
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
