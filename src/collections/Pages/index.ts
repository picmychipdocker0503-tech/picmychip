import type { CollectionConfig } from 'payload'

import { Banner } from '@/blocks/Banner/config'
import { BrandStrip } from '@/blocks/BrandStrip/config'
import { Carousel } from '@/blocks/Carousel/config'
import { CategoryGrid } from '@/blocks/CategoryGrid/config'
import { ContentFeed } from '@/blocks/ContentFeed/config'
import { CustomerInteraction } from '@/blocks/CustomerInteraction/config'
import { FeaturedCollection } from '@/blocks/FeaturedCollection/config'
import { ServicesShowcase } from '@/blocks/ServicesShowcase/config'
import { ThreeItemGrid } from '@/blocks/ThreeItemGrid/config'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { adminOnly } from '@/access/adminOnly'
import { Archive } from '@/blocks/ArchiveBlock/config'
import { CallToAction } from '@/blocks/CallToAction/config'
import { ComparisonTable } from '@/blocks/ComparisonTable/config'
import { Content } from '@/blocks/Content/config'
import { FAQ } from '@/blocks/FAQ/config'
import { FlashDeal } from '@/blocks/FlashDeal/config'
import { FormBlock } from '@/blocks/Form/config'
import { HeroCarousel } from '@/blocks/HeroCarousel/config'
import { IllustratedCategoryGrid } from '@/blocks/IllustratedCategoryGrid/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { Testimonials } from '@/blocks/Testimonials/config'
import { TrendingProducts } from '@/blocks/TrendingProducts/config'
import { TrustBadgesStrip } from '@/blocks/TrustBadgesStrip/config'
import { hero } from '@/fields/hero'
import { slugField } from 'payload'
import { adminOrPublishedStatus } from '@/access/adminOrPublishedStatus'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { revalidatePage, revalidateDelete } from './hooks/revalidatePage'

export const Pages: CollectionConfig = {
  slug: 'pages',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOrPublishedStatus,
    update: adminOnly,
  },
  admin: {
    group: 'Content',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'pages',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'pages',
        req,
      }),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'publishedOn',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [hero],
          label: 'Hero',
        },
        {
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              blocks: [
                CallToAction,
                Content,
                MediaBlock,
                Archive,
                Carousel,
                ThreeItemGrid,
                Banner,
                FormBlock,
                FAQ,
                ComparisonTable,
                CustomerInteraction,
                IllustratedCategoryGrid,
                HeroCarousel,
                FlashDeal,
                TrendingProducts,
                CategoryGrid,
                BrandStrip,
                ServicesShowcase,
                TrustBadgesStrip,
                Testimonials,
                FeaturedCollection,
                ContentFeed,
              ],
              required: true,
            },
          ],
          label: 'Content',
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    slugField(),
  ],
  hooks: {
    afterChange: [revalidatePage],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      autosave: true,
    },
    maxPerDoc: 50,
  },
}
