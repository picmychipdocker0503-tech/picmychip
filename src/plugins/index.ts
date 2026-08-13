import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { Plugin } from 'payload'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { ecommercePlugin } from '@payloadcms/plugin-ecommerce'
import { s3Storage } from '@payloadcms/storage-s3'

import { payuAdapter } from '@/payments/payu'
import { currenciesConfig } from '@/lib/currencies'

import { Category, Guide, Page, Product } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { ProductsCollection } from '@/collections/Products'
import { VariantsCollection } from '@/collections/Variants'
import { adminOrPublishedStatus } from '@/access/adminOrPublishedStatus'
import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { customerOnlyFieldAccess } from '@/access/customerOnlyFieldAccess'
import { isAdmin } from '@/access/isAdmin'
import { isDocumentOwner } from '@/access/isDocumentOwner'
import { applyCartDiscounts } from '@/hooks/applyCartDiscounts'
import { applyOrderDiscountSideEffects } from '@/hooks/applyOrderDiscountSideEffects'
import { computeGstTaxBreakdown } from '@/hooks/computeGstTaxBreakdown'
import { createZohoInvoice } from '@/hooks/createZohoInvoice'
import { createShiprocketShipment } from '@/hooks/createShiprocketShipment'
import { flagPotentialFraud } from '@/hooks/flagPotentialFraud'
import { issueGiftCardsForOrder } from '@/hooks/issueGiftCardsForOrder'
import { sendOrderLifecycleEmails } from '@/hooks/sendOrderLifecycleEmails'
import { billingDetailsAddressFields, businessDetailsGroup } from '@/fields/businessDetails'

const generateTitle: GenerateTitle<Product | Page | Category | Guide> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Payload Ecommerce Template` : 'Payload Ecommerce Template'
}

const generateURL: GenerateURL<Product | Page | Category | Guide> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

// Render's web service disk is ephemeral and rebuilt on every deploy, so locally-uploaded
// media never survives a deploy there. R2 gives every environment (local + Render) a shared,
// persistent home for uploads instead. Only activates once all R2 env vars are set, so
// deployments without R2 configured yet keep working exactly as before.
const r2Enabled = Boolean(
  process.env.R2_BUCKET &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_ENDPOINT &&
    process.env.R2_PUBLIC_URL,
)

export const plugins: Plugin[] = [
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
      upload: true,
    },
    uploadCollections: ['media', 'datasheets'],
    formSubmissionOverrides: {
      access: {
        delete: isAdmin,
        read: isAdmin,
        update: isAdmin,
      },
      admin: {
        group: 'Content',
      },
    },
    formOverrides: {
      access: {
        delete: isAdmin,
        // Public read is required so pages can render a form's fields for
        // anonymous visitors (RSC page queries run with overrideAccess: false).
        // The `emails` field below is locked back down to admins so the
        // internal notification address/templates aren't exposed to the API.
        read: () => true,
        update: isAdmin,
        create: isAdmin,
      },
      admin: {
        group: 'Content',
      },
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          if ('name' in field && field.name === 'emails') {
            return {
              ...field,
              access: { read: adminOnlyFieldAccess },
            } as typeof field
          }
          return field
        })
      },
    },
  }),
  ecommercePlugin({
    access: {
      adminOnlyFieldAccess,
      adminOrPublishedStatus,
      customerOnlyFieldAccess,
      isAdmin,
      isDocumentOwner,
    },
    currencies: currenciesConfig,
    customers: {
      slug: 'users',
    },
    orders: {
      ordersCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        admin: {
          ...defaultCollection.admin,
          components: {
            ...defaultCollection.admin?.components,
            edit: {
              ...defaultCollection.admin?.components?.edit,
              // Invoice/shipment sync status + retry actions, shown above the save controls.
              beforeDocumentControls: ['@/components/admin/OrderIntegrationPanel#OrderIntegrationPanel'],
            },
          },
        },
        hooks: {
          ...defaultCollection.hooks,
          afterChange: [
            ...(defaultCollection.hooks?.afterChange ?? []),
            applyOrderDiscountSideEffects,
            issueGiftCardsForOrder,
            computeGstTaxBreakdown,
            createZohoInvoice,
            createShiprocketShipment,
            sendOrderLifecycleEmails,
            flagPotentialFraud,
          ],
        },
        fields: [
          ...defaultCollection.fields,
          {
            name: 'accessToken',
            type: 'text',
            unique: true,
            index: true,
            admin: {
              position: 'sidebar',
              readOnly: true,
            },
            hooks: {
              beforeValidate: [
                ({ value, operation }) => {
                  if (operation === 'create' || !value) {
                    return crypto.randomUUID()
                  }
                  return value
                },
              ],
            },
          },
          {
            name: 'trackingNumber',
            type: 'text',
            admin: {
              position: 'sidebar',
              description:
                'Carrier tracking number (AWB), shown to the customer on their order. Auto-filled by the Shiprocket integration once a courier is assigned — editable manually as a fallback.',
            },
          },
          {
            name: 'courierName',
            type: 'text',
            admin: {
              position: 'sidebar',
              readOnly: true,
              description: 'Courier Shiprocket assigned to this shipment.',
            },
          },
          {
            name: 'shipmentStatus',
            type: 'text',
            admin: {
              position: 'sidebar',
              readOnly: true,
              description: 'Latest status from Shiprocket (e.g. "Pickup Scheduled", "In Transit", "Delivered").',
            },
          },
          {
            name: 'shiprocketOrderId',
            type: 'text',
            admin: {
              position: 'sidebar',
              readOnly: true,
            },
          },
          {
            name: 'shiprocketShipmentId',
            type: 'text',
            admin: {
              position: 'sidebar',
              readOnly: true,
            },
          },
          {
            name: 'paymentMethod',
            type: 'select',
            defaultValue: 'card',
            options: [
              { label: 'Card / UPI / NetBanking (PayU)', value: 'card' },
              { label: 'Cash on Delivery', value: 'cod' },
              { label: 'Fully covered by gift card', value: 'gift-card' },
            ],
            admin: {
              position: 'sidebar',
            },
          },
          {
            name: 'discountsApplied',
            type: 'checkbox',
            defaultValue: false,
            admin: {
              position: 'sidebar',
              readOnly: true,
              description: 'Internal guard — prevents double-processing coupon/gift-card redemption.',
            },
          },
          {
            name: 'couponApplied',
            type: 'group',
            admin: {
              position: 'sidebar',
            },
            fields: [
              { name: 'code', type: 'text' },
              { name: 'discountAmount', type: 'number' },
            ],
          },
          {
            name: 'giftCardApplied',
            type: 'group',
            admin: {
              position: 'sidebar',
            },
            fields: [
              { name: 'code', type: 'text' },
              { name: 'amountApplied', type: 'number' },
            ],
          },
          {
            name: 'flaggedForReview',
            type: 'checkbox',
            defaultValue: false,
            admin: {
              position: 'sidebar',
              readOnly: true,
              description:
                'Basic app-level fraud heuristic (high-value guest order). PayU screens the payment itself separately.',
            },
          },
          {
            name: 'flagReason',
            type: 'text',
            admin: {
              position: 'sidebar',
              readOnly: true,
              condition: (data) => Boolean(data?.flaggedForReview),
            },
          },
          {
            name: 'taxBreakdown',
            type: 'group',
            admin: {
              position: 'sidebar',
              description:
                'GST split computed at order creation from SiteSettings.taxSettings — snapshotted so later rate/state changes don’t retroactively alter past invoices.',
            },
            fields: [
              {
                name: 'taxType',
                type: 'select',
                options: [
                  { label: 'Intra-state (CGST + SGST)', value: 'intra-state' },
                  { label: 'Inter-state (IGST)', value: 'inter-state' },
                ],
                admin: { readOnly: true },
              },
              { name: 'gstRatePercent', type: 'number', admin: { readOnly: true } },
              { name: 'taxableValue', type: 'number', admin: { readOnly: true } },
              { name: 'cgstAmount', type: 'number', admin: { readOnly: true } },
              { name: 'sgstAmount', type: 'number', admin: { readOnly: true } },
              { name: 'igstAmount', type: 'number', admin: { readOnly: true } },
              { name: 'totalTax', type: 'number', admin: { readOnly: true } },
            ],
          },
          {
            name: 'billingAddress',
            type: 'group',
            admin: {
              description: 'Captured at checkout — falls back to the shipping address when not separately provided.',
            },
            fields: billingDetailsAddressFields(),
          },
          businessDetailsGroup(),
          // Zoho Books (invoicing)
          {
            name: 'zohoCustomerId',
            type: 'text',
            admin: { position: 'sidebar', readOnly: true },
          },
          {
            name: 'zohoInvoiceId',
            type: 'text',
            admin: { position: 'sidebar', readOnly: true },
          },
          {
            name: 'zohoInvoiceNumber',
            type: 'text',
            admin: { position: 'sidebar', readOnly: true },
          },
          {
            name: 'zohoInvoiceStatus',
            type: 'text',
            admin: {
              position: 'sidebar',
              readOnly: true,
              description: 'Zoho’s own invoice status (draft/sent/paid/etc.), as last synced.',
            },
          },
          {
            name: 'zohoInvoiceUrl',
            type: 'text',
            admin: { position: 'sidebar', readOnly: true },
          },
          {
            name: 'zohoInvoiceCreatedAt',
            type: 'date',
            admin: { position: 'sidebar', readOnly: true },
          },
          // Shiprocket (shiprocketOrderId, shiprocketShipmentId, trackingNumber,
          // courierName, shipmentStatus already exist above)
          {
            name: 'shiprocketTrackingUrl',
            type: 'text',
            admin: { position: 'sidebar', readOnly: true },
          },
          {
            name: 'shiprocketPickupStatus',
            type: 'text',
            admin: { position: 'sidebar', readOnly: true },
          },
          {
            name: 'shiprocketDeliveryStatus',
            type: 'text',
            admin: { position: 'sidebar', readOnly: true },
          },
          {
            name: 'shiprocketEstimatedDeliveryDate',
            type: 'text',
            admin: { position: 'sidebar', readOnly: true },
          },
          {
            name: 'shiprocketCreatedAt',
            type: 'date',
            admin: { position: 'sidebar', readOnly: true },
          },
          // Integration sync bookkeeping
          {
            name: 'invoiceSyncStatus',
            type: 'select',
            defaultValue: 'pending',
            options: [
              { label: 'Pending', value: 'pending' },
              { label: 'Processing', value: 'processing' },
              { label: 'Completed', value: 'completed' },
              { label: 'Failed', value: 'failed' },
            ],
            admin: { position: 'sidebar', readOnly: true },
          },
          {
            name: 'shipmentSyncStatus',
            type: 'select',
            defaultValue: 'pending',
            options: [
              { label: 'Pending', value: 'pending' },
              { label: 'Processing', value: 'processing' },
              { label: 'Completed', value: 'completed' },
              { label: 'Failed', value: 'failed' },
            ],
            admin: { position: 'sidebar', readOnly: true },
          },
          {
            name: 'integrationError',
            type: 'group',
            admin: {
              position: 'sidebar',
              description: 'Last error message from each integration, if any — cleared on the next successful sync.',
            },
            fields: [
              { name: 'invoice', type: 'text', admin: { readOnly: true } },
              { name: 'shipment', type: 'text', admin: { readOnly: true } },
            ],
          },
          {
            name: 'lastSyncAt',
            type: 'date',
            admin: { position: 'sidebar', readOnly: true },
          },
        ],
      }),
    },
    carts: {
      cartsCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        hooks: {
          ...defaultCollection.hooks,
          beforeChange: [...(defaultCollection.hooks?.beforeChange ?? []), applyCartDiscounts],
        },
        fields: [
          ...defaultCollection.fields,
          {
            name: 'appliedCouponCode',
            type: 'text',
            admin: {
              description: 'Coupon code applied to this cart, if any.',
            },
          },
          {
            name: 'appliedGiftCardCode',
            type: 'text',
            admin: {
              description: 'Gift card code applied to this cart, if any.',
            },
          },
          {
            name: 'couponDiscountAmount',
            type: 'number',
            defaultValue: 0,
            admin: {
              readOnly: true,
              description: 'Auto-computed — amount deducted by the applied coupon.',
            },
          },
          {
            name: 'giftCardAmountApplied',
            type: 'number',
            defaultValue: 0,
            admin: {
              readOnly: true,
              description: 'Auto-computed — amount deducted by the applied gift card.',
            },
          },
          {
            name: 'abandonedRecoveryEmailSentAt',
            type: 'date',
            admin: {
              readOnly: true,
              description: 'Set once the abandoned-cart recovery email has been sent, so it only ever goes out once.',
            },
          },
        ],
      }),
    },
    transactions: {
      transactionsCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        fields: [...defaultCollection.fields, businessDetailsGroup()],
      }),
    },
    payments: {
      paymentMethods: [
        payuAdapter({
          merchantKey: process.env.PAYU_MERCHANT_KEY!,
          merchantSalt: process.env.PAYU_MERCHANT_SALT!,
          mode: process.env.PAYU_MODE === 'production' ? 'production' : 'test',
        }),
      ],
    },
    products: {
      productsCollectionOverride: ProductsCollection,
      variants: {
        variantsCollectionOverride: VariantsCollection,
      },
    },
  }),
  ...(r2Enabled
    ? [
        // R2 is S3-API-compatible, so the S3 adapter talks to it directly via
        // R2's S3 endpoint (https://<account_id>.r2.cloudflarestorage.com) — there's
        // no official Node-compatible R2 adapter (@payloadcms/storage-r2 targets the
        // Cloudflare Workers-native R2 binding, which Render can't provide).
        s3Storage({
          collections: {
            media: {
              prefix: 'media',
              disablePayloadAccessControl: true,
              generateFileURL: ({ filename }) => `${process.env.R2_PUBLIC_URL}/media/${filename}`,
            },
            datasheets: {
              prefix: 'datasheets',
              disablePayloadAccessControl: true,
              generateFileURL: ({ filename }) =>
                `${process.env.R2_PUBLIC_URL}/datasheets/${filename}`,
            },
          },
          bucket: process.env.R2_BUCKET!,
          config: {
            credentials: {
              accessKeyId: process.env.R2_ACCESS_KEY_ID!,
              secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
            },
            region: 'auto',
            endpoint: process.env.R2_ENDPOINT!,
            forcePathStyle: true,
          },
        }),
      ]
    : []),
]
