import { CallToAction } from '@/blocks/CallToAction/config'
import { Content } from '@/blocks/Content/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { slugField } from 'payload'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import { priceTiers } from '@/fields/priceTiers'
import { productSpecsGroup, SPEC_SCHEMA_OPTIONS } from '@/fields/productSpecs'
import { deriveSalePricing } from '@/hooks/deriveSalePricing'
import { deriveStockStatus } from '@/hooks/deriveStockStatus'
import { notifyBackInStock } from '@/hooks/notifyBackInStock'
import { notifyWishlistChanges } from '@/hooks/notifyWishlistChanges'
import { removeProductFromSearchIndex } from '@/hooks/removeProductFromSearchIndex'
import { syncProductToSearchIndex } from '@/hooks/syncProductToSearchIndex'
import { revalidateProduct, revalidateProductDelete } from './hooks/revalidateProduct'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { DefaultDocumentIDType, Where } from 'payload'

export const ProductsCollection: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  hooks: {
    ...defaultCollection?.hooks,
    beforeChange: [...(defaultCollection?.hooks?.beforeChange ?? []), deriveStockStatus, deriveSalePricing],
    afterChange: [
      ...(defaultCollection?.hooks?.afterChange ?? []),
      syncProductToSearchIndex,
      notifyBackInStock,
      notifyWishlistChanges,
      revalidateProduct,
    ],
    afterDelete: [
      ...(defaultCollection?.hooks?.afterDelete ?? []),
      removeProductFromSearchIndex,
      revalidateProductDelete,
    ],
  },
  admin: {
    ...defaultCollection?.admin,
    components: {
      ...defaultCollection?.admin?.components,
      beforeList: ['@/components/admin/ProductsListStats#ProductsListStats'],
      views: {
        ...defaultCollection?.admin?.components?.views,
        list: {
          Component: '@/components/admin/collections/ProductsListView#ProductsListView',
        },
      },
    },
    defaultColumns: ['title', 'stockStatus', 'categories', 'priceInINR', 'onSale', '_status'],
    group: 'Catalog',
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'products',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'products',
        req,
      }),
    useAsTitle: 'title',
  },
  defaultPopulate: {
    ...defaultCollection?.defaultPopulate,
    title: true,
    slug: true,
    variantOptions: true,
    variants: true,
    enableVariants: true,
    gallery: true,
    priceInINR: true,
    inventory: true,
    meta: true,
    sku: true,
    gstPercent: true,
    hsnCode: true,
    zohoItemId: true,
    description: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        components: {
          Cell: '@/components/admin/cells/ProductTitleCell#ProductTitleCell',
        },
      },
    },
    {
      name: 'highlights',
      type: 'array',
      maxRows: 8,
      admin: {
        description: 'Short key-feature bullets shown near the top of the product page (e.g. "AC output: 1800W continuous, 2700W surge").',
      },
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'description',
              type: 'richText',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HorizontalRuleFeature(),
                  ]
                },
              }),
              label: false,
              required: false,
            },
            {
              name: 'gallery',
              type: 'array',
              minRows: 1,
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
                {
                  name: 'variantOption',
                  type: 'relationship',
                  relationTo: 'variantOptions',
                  admin: {
                    condition: (data) => {
                      return data?.enableVariants === true && data?.variantTypes?.length > 0
                    },
                  },
                  filterOptions: ({ data }) => {
                    if (data?.enableVariants && data?.variantTypes?.length) {
                      const variantTypeIDs = data.variantTypes.map((item: any) => {
                        if (typeof item === 'object' && item?.id) {
                          return item.id
                        }
                        return item
                      }) as DefaultDocumentIDType[]

                      if (variantTypeIDs.length === 0)
                        return {
                          variantType: {
                            in: [],
                          },
                        }

                      const query: Where = {
                        variantType: {
                          in: variantTypeIDs,
                        },
                      }

                      return query
                    }

                    return {
                      variantType: {
                        in: [],
                      },
                    }
                  },
                },
              ],
            },

            {
              name: 'datasheets',
              type: 'upload',
              relationTo: 'datasheets',
              hasMany: true,
              admin: {
                description: 'Downloadable PDF datasheets / spec sheets for this product.',
              },
            },
            {
              name: 'layout',
              type: 'blocks',
              blocks: [CallToAction, Content, MediaBlock],
            },
          ],
          label: 'Content',
        },
        {
          fields: [
            ...defaultCollection.fields,
            {
              name: 'relatedProducts',
              type: 'relationship',
              admin: {
                description: 'Generic merchandising cross-sell (e.g. "customers also viewed").',
              },
              filterOptions: ({ id }) => {
                if (id) {
                  return {
                    id: {
                      not_in: [id],
                    },
                  }
                }

                // ID comes back as undefined during seeding so we need to handle that case
                return {
                  id: {
                    exists: true,
                  },
                }
              },
              hasMany: true,
              relationTo: 'products',
            },
            {
              name: 'compatibleProducts',
              type: 'relationship',
              admin: {
                description:
                  'Technically compatible products (e.g. motor ↔ ESC ↔ props). Distinct from Related Products, which is generic merchandising.',
              },
              filterOptions: ({ id }) => {
                if (id) {
                  return {
                    id: {
                      not_in: [id],
                    },
                  }
                }

                return {
                  id: {
                    exists: true,
                  },
                }
              },
              hasMany: true,
              relationTo: 'products',
            },
            priceTiers,
            {
              name: 'customSpecs',
              type: 'array',
              label: 'Specifications',
              admin: {
                description:
                  'Custom label/value specification rows shown in the Specifications table on the product page (e.g. "Resistance" → "475 kΩ"). Available for every product, regardless of category.',
              },
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'value', type: 'text', required: true },
              ],
            },
            productSpecsGroup,
          ],
          label: 'Product Details',
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
    {
      name: 'categories',
      type: 'relationship',
      admin: {
        position: 'sidebar',
        sortOptions: 'sequence',
      },
      hasMany: true,
      relationTo: 'categories',
    },
    {
      name: 'brand',
      type: 'relationship',
      relationTo: 'brands',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'tags',
      type: 'text',
      hasMany: true,
      admin: {
        position: 'sidebar',
        description: 'Freeform tags for search and merchandising.',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Surface this product in curated spots like the mega-menu and homepage.',
      },
    },
    {
      name: 'specSchemaType',
      type: 'select',
      defaultValue: 'none',
      options: [...SPEC_SCHEMA_OPTIONS],
      admin: {
        position: 'sidebar',
        description: 'Which category spec schema to show on the Product Details tab.',
      },
    },
    {
      name: 'stockStatus',
      type: 'select',
      options: [
        { label: 'In Stock', value: 'in-stock' },
        { label: 'Low Stock', value: 'low-stock' },
        { label: 'Out of Stock', value: 'out-of-stock' },
        { label: 'Backorder', value: 'backorder' },
      ],
      index: true,
      admin: {
        position: 'sidebar',
        description:
          'Auto-derived from Inventory on save, unless set to "Backorder" (which is a manual business decision and is left alone).',
        components: {
          Cell: '@/components/admin/cells/ProductStockCell#ProductStockCell',
        },
      },
    },
    {
      name: 'lowStockThreshold',
      type: 'number',
      defaultValue: 5,
      admin: {
        position: 'sidebar',
        description: 'Inventory at or below this triggers "Low Stock". Defaults to 5.',
      },
    },
    {
      name: 'weightInGrams',
      type: 'number',
      defaultValue: 50,
      admin: {
        position: 'sidebar',
        description:
          'Per-unit shipping weight in grams — defaults to 50g, a reasonable estimate for small electronic components.',
      },
    },
    {
      name: 'sku',
      type: 'text',
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Stock-keeping unit sent to Zoho Books. Falls back to the product slug when left blank.',
      },
    },
    {
      name: 'hsnCode',
      type: 'text',
      required: true,
      admin: {
        position: 'sidebar',
        description: 'HSN/SAC code for GST invoicing — required on every product for a compliant Zoho invoice.',
      },
    },
    {
      name: 'zohoItemId',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Zoho Books catalog item this product is linked to — set automatically on first sales-order sync.',
      },
    },
    {
      name: 'gstPercent',
      type: 'number',
      defaultValue: 18,
      admin: {
        position: 'sidebar',
        description:
          'GST rate applied to this product on Zoho invoices and the internal tax breakdown. Falls back to Site Settings → Tax Invoicing → GST rate when left blank.',
      },
    },
    {
      name: 'compareAtPriceInINR',
      type: 'number',
      admin: {
        position: 'sidebar',
        description:
          'Optional "was" price (₹) shown struck through next to the current price when higher than it.',
      },
    },
    {
      name: 'onSale',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: {
        position: 'sidebar',
        description:
          'Enable a storefront sale — Sale Price (₹) below is calculated automatically from Price + Discount Type/Value.',
        components: {
          Cell: '@/components/admin/cells/ProductSaleStatusCell#ProductSaleStatusCell',
        },
      },
    },
    {
      name: 'saleType',
      type: 'select',
      options: [
        { label: 'Percentage Off', value: 'percentage' },
        { label: 'Fixed Amount Off', value: 'fixed' },
      ],
      admin: {
        position: 'sidebar',
        condition: (data) => Boolean(data?.onSale),
      },
    },
    {
      name: 'discountValue',
      type: 'number',
      admin: {
        position: 'sidebar',
        condition: (data) => Boolean(data?.onSale),
        description: 'Percentage (0–90) or ₹ amount off, depending on Discount Type above.',
      },
    },
    {
      name: 'salePriceInINR',
      type: 'number',
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => Boolean(data?.onSale),
        description: 'Auto-calculated from Price + Discount Value on save.',
      },
    },
    {
      name: 'saleEndDate',
      type: 'date',
      admin: {
        position: 'sidebar',
        condition: (data) => Boolean(data?.onSale),
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Sale auto-disables the next time this product is saved after this date.',
      },
    },
    {
      name: 'isClearance',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Clearance stock — shown with a distinct badge on the storefront; not intended to be restocked.',
      },
    },
    {
      name: 'clearanceReason',
      type: 'text',
      admin: {
        position: 'sidebar',
        condition: (data) => Boolean(data?.isClearance),
        description: 'Optional customer-facing reason shown on the product page (e.g. "Discontinued model").',
      },
    },
    {
      name: 'isGiftCard',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: {
        position: 'sidebar',
        description:
          'Flags this as a purchasable gift card — a GiftCard document (with a redeemable code) is minted per unit automatically when an order containing it is placed. Use variants for denominations.',
      },
    },
    {
      name: 'googleMerchant',
      type: 'group',
      admin: {
        position: 'sidebar',
        description: 'Overrides for the Google Merchant Center product feed.',
      },
      fields: [
        {
          name: 'excludeFromFeed',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Hide this product from the Google Merchant Center feed.',
          },
        },
        {
          name: 'googleProductCategory',
          type: 'text',
          admin: {
            description: 'Optional Google product category, e.g. Electronics > Electronics Accessories.',
          },
        },
        {
          name: 'gtin',
          type: 'text',
          admin: {
            description: 'Optional GTIN/UPC/EAN/ISBN. Leave blank if unavailable.',
          },
        },
        {
          name: 'mpn',
          type: 'text',
          admin: {
            description: 'Optional manufacturer part number. Falls back to SKU when blank.',
          },
        },
        {
          name: 'condition',
          type: 'text',
          defaultValue: 'new',
          admin: {
            description: 'Google condition value: new, refurbished, or used. Defaults to new.',
          },
        },
        {
          name: 'customLabel0',
          type: 'text',
        },
        {
          name: 'customLabel1',
          type: 'text',
        },
        {
          name: 'customLabel2',
          type: 'text',
        },
        {
          name: 'customLabel3',
          type: 'text',
        },
        {
          name: 'customLabel4',
          type: 'text',
        },
      ],
    },
    {
      name: 'leadTimeDays',
      type: 'number',
      admin: {
        position: 'sidebar',
        condition: (data) => data?.stockStatus === 'backorder',
      },
    },
    slugField(),
  ],
})
