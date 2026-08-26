import type { CollectionConfig } from 'payload'

import { slugField } from 'payload'

import { Archive } from '@/blocks/ArchiveBlock/config'
import { Banner } from '@/blocks/Banner/config'
import { CallToAction } from '@/blocks/CallToAction/config'
import { Carousel } from '@/blocks/Carousel/config'
import { ComparisonTable } from '@/blocks/ComparisonTable/config'
import { Content } from '@/blocks/Content/config'
import { FAQ } from '@/blocks/FAQ/config'
import { FormBlock } from '@/blocks/Form/config'
import { IllustratedCategoryGrid } from '@/blocks/IllustratedCategoryGrid/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { ThreeItemGrid } from '@/blocks/ThreeItemGrid/config'
import { hero } from '@/fields/hero'
import { adminOnly } from '@/access/adminOnly'
import { adminOrPublishedStatus } from '@/access/adminOrPublishedStatus'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'

export const Guides: CollectionConfig = {
  slug: 'guides',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOrPublishedStatus,
    update: adminOnly,
  },
  admin: {
    group: 'Content',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    useAsTitle: 'title',
    components: {
      views: {
        list: {
          Component: '@/components/admin/collections/GuidesListView#GuidesListView',
        },
      },
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Thumbnail shown in the Tutorials/Blog feed and archive cards.',
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      admin: {
        description: 'Short summary shown in card previews.',
      },
    },
    {
      name: 'contentType',
      type: 'select',
      defaultValue: 'article',
      options: [
        { label: 'Article', value: 'article' },
        { label: 'Video', value: 'video' },
      ],
    },
    {
      name: 'videoUrl',
      type: 'text',
      admin: {
        condition: (data) => data?.contentType === 'video',
        description: 'YouTube (or other) video URL, shown with a play-icon overlay.',
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
                IllustratedCategoryGrid,
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
              hasGenerateFn: true,
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'authorName',
      type: 'text',
      admin: {
        position: 'sidebar',
        description:
          'Byline shown on the post. Plain text (not a Users relationship) since Users read access is admin-only — set this for posts that should appear on /blog.',
      },
    },
    {
      name: 'authorTitle',
      type: 'text',
      admin: {
        condition: (data) => Boolean(data?.authorName),
        position: 'sidebar',
        description: 'e.g. "Supply Chain" or "People & Culture" — shown under the author name.',
      },
    },
    {
      name: 'relatedCategory',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        position: 'sidebar',
        description: 'The category this guide/pillar page centers on, for topical linking.',
      },
    },
    {
      name: 'relatedProducts',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      admin: {
        position: 'sidebar',
      },
    },
    slugField(),
  ],
  versions: {
    drafts: {
      autosave: true,
    },
    maxPerDoc: 50,
  },
}
