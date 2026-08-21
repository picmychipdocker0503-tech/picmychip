import { slugField } from 'payload'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig } from 'payload'

import { revalidatePath } from 'next/cache'

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

// The header's mega-menu (and mobile menu) queries the category tree fresh
// on every page via the shared layout, but Next's static/ISR page cache still
// caches that render — unlike Pages/Globals, this collection had no
// revalidation hook, so a category added, renamed, or deleted in the CMS
// wouldn't show up (or drop out of) the storefront menu until the next full
// deploy. Revalidating the layout busts that cache for every route at once.
const revalidateCategoryNav: CollectionAfterChangeHook = ({ req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info('Revalidating layout after category change')
    revalidatePath('/', 'layout')
  }
}

const revalidateCategoryNavOnDelete: CollectionAfterDeleteHook = ({ req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info('Revalidating layout after category delete')
    revalidatePath('/', 'layout')
  }
}

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
    group: 'Catalog',
    components: {
      views: {
        list: {
          Component: '@/components/admin/collections/CategoriesListView#CategoriesListView',
        },
      },
    },
  },
  hooks: {
    afterChange: [revalidateCategoryNav],
    afterDelete: [revalidateCategoryNavOnDelete],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description:
          'One or two sentences shown under the category heading on the storefront — also used for search engines\' category-page structured data. Keeps the page from being just an icon and a product grid.',
      },
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
      name: 'sequence',
      type: 'number',
      defaultValue: 1000,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Controls category order in product category pickers and storefront menus.',
      },
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
