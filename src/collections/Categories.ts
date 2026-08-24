import { slugField } from 'payload'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig } from 'payload'

import { revalidatePath } from 'next/cache'

import { adminOnly } from '@/access/adminOnly'
import { checkRole } from '@/access/utilities'
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
// revalidatePath requires an active Next.js request-scoped context to run —
// it throws "Invariant: static generation store missing" outside one, and
// since afterChange hooks run inside the same DB transaction as the write,
// that throw rolls back the entire update (confirmed live: a Products bulk
// edit's category change silently never persisted because of exactly this).
// Revalidation is a cache-freshness nicety, never something allowed to undo
// a real write.
function safeRevalidatePath(path: string, type: 'layout' | undefined, logger: { warn: (obj: unknown) => void }): void {
  try {
    revalidatePath(path, type)
  } catch (err) {
    logger.warn({ msg: 'revalidatePath failed (non-fatal)', path, err })
  }
}

const revalidateCategoryNav: CollectionAfterChangeHook = ({ req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info('Revalidating layout after category change')
    safeRevalidatePath('/', 'layout', payload.logger)
  }
}

const revalidateCategoryNavOnDelete: CollectionAfterDeleteHook = ({ req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info('Revalidating layout after category delete')
    safeRevalidatePath('/', 'layout', payload.logger)
  }
}

type ReorderItem = {
  id: string
  order: number
}

const jsonResponse = (body: unknown, status = 200): Response =>
  Response.json(body, {
    status,
  })

const validateReorderPayload = (body: unknown): ReorderItem[] => {
  if (!Array.isArray(body) || body.length === 0) {
    throw new Error('Payload must be a non-empty array.')
  }

  const seenIDs = new Set<string>()

  return body.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Item ${index + 1} must be an object.`)
    }

    const { id, order } = item as { id?: unknown; order?: unknown }
    const normalizedID = typeof id === 'number' ? String(id) : id
    const normalizedOrder = typeof order === 'string' && order.trim() ? Number(order) : order

    if (typeof normalizedID !== 'string' || normalizedID.trim().length === 0) {
      throw new Error(`Item ${index + 1} must include a valid id.`)
    }

    if (seenIDs.has(normalizedID)) {
      throw new Error(`Duplicate category id "${normalizedID}" in reorder payload.`)
    }

    if (
      typeof normalizedOrder !== 'number' ||
      !Number.isFinite(normalizedOrder) ||
      !Number.isInteger(normalizedOrder) ||
      normalizedOrder < 0
    ) {
      throw new Error(`Item ${index + 1} must include a non-negative integer order.`)
    }

    seenIDs.add(normalizedID)

    return {
      id: normalizedID,
      order: normalizedOrder,
    }
  })
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
  defaultSort: 'sequence',
  endpoints: [
    {
      path: '/reorder',
      method: 'put',
      handler: async (req) => {
        if (!checkRole(['admin'], req.user)) {
          return jsonResponse({ error: 'Forbidden.' }, 403)
        }

        let updates: ReorderItem[]

        try {
          const body = typeof req.json === 'function' ? await req.json() : null
          updates = validateReorderPayload(body)
        } catch (error) {
          return jsonResponse(
            { error: error instanceof Error ? error.message : 'Invalid reorder payload.' },
            400,
          )
        }

        const transactionID = await req.payload.db.beginTransaction()

        if (!transactionID) {
          return jsonResponse({ error: 'Database transactions are unavailable.' }, 500)
        }

        req.transactionID = transactionID

        try {
          await Promise.all(
            updates.map(({ id, order }) =>
              req.payload.update({
                collection: 'categories',
                id,
                data: {
                  sequence: order,
                },
                depth: 0,
                disableTransaction: true,
                overrideAccess: true,
                req,
              }),
            ),
          )

          await req.payload.db.commitTransaction(transactionID)

          return jsonResponse({
            success: true,
            updated: updates.length,
          })
        } catch (error) {
          await req.payload.db.rollbackTransaction(transactionID)
          req.payload.logger.error({
            err: error,
            msg: 'Failed to reorder categories',
          })

          return jsonResponse({ error: 'Failed to update category order.' }, 500)
        } finally {
          delete req.transactionID
        }
      },
    },
  ],
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
