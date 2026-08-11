import { slugField } from 'payload'
import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { CallToAction } from '@/blocks/CallToAction/config'
import { ComparisonTable } from '@/blocks/ComparisonTable/config'
import { Content } from '@/blocks/Content/config'
import { FAQ } from '@/blocks/FAQ/config'
import { IllustratedCategoryGrid } from '@/blocks/IllustratedCategoryGrid/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { SPEC_SCHEMA_OPTIONS } from '@/fields/productSpecs/specSchemaOptions'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        position: 'sidebar',
        description: 'Optional parent category, for sub-category hierarchies.',
      },
      filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
    },
    {
      name: 'specSchemaType',
      type: 'select',
      defaultValue: 'none',
      options: [...SPEC_SCHEMA_OPTIONS],
      admin: {
        position: 'sidebar',
        description:
          'Which spec schema products in this category use (should match the Spec Schema set on those Products).',
      },
    },
    {
      name: 'layout',
      type: 'blocks',
      blocks: [CallToAction, Content, MediaBlock, FAQ, ComparisonTable, IllustratedCategoryGrid],
    },
    {
      type: 'tabs',
      tabs: [
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
    slugField({
      position: undefined,
    }),
  ],
}
