import type { PaymentAdapter, PaymentAdapterArgs } from '@payloadcms/plugin-ecommerce/types'
import type { GroupField } from 'payload'

import { confirmOrder } from './confirmOrder'
import { initiatePayment } from './initiatePayment'
import { webhookEndpoint } from './endpoints/webhook'

export type ZohoAdapterArgs = {
  /**
   * Zoho Payments account identifier. Not secret — sent to the client as part of the widget
   * config (see initiatePayment.ts's return value).
   */
  accountId: string
  /**
   * Zoho Payments widget API key (from Developers Space). Not secret — this is the public key
   * the browser-side widget script authenticates with, distinct from the OAuth
   * client_id/client_secret used server-side for the REST API (see src/lib/zoho/paymentsAuth.ts).
   */
  apiKey: string
  /**
   * Zoho Payments account region, e.g. 'IN'. Passed through to the widget config as-is.
   */
  domain: string
  /**
   * Signing key for verifying the `X-Zoho-Webhook-Signature` header on the webhook fallback
   * endpoint (see endpoints/webhook.ts). Required for the webhook to work at all — without it
   * every webhook call is rejected as unverified.
   */
  webhookSigningKey: string
} & PaymentAdapterArgs

/**
 * Custom Zoho Payments adapter for `@payloadcms/plugin-ecommerce`, which ships no first-party
 * Zoho adapter. Uses Zoho's JS checkout widget (payment session created here, rendered in-page by
 * the client via zpayments.js) rather than PayU's redirect-to-hosted-page flow — closer in shape
 * to the plugin's built-in Stripe adapter, whose confirmOrder pattern (retrieve-and-verify by ID,
 * called directly by the client) this adapter's confirmOrder.ts mirrors.
 */
export const zohoAdapter = (props: ZohoAdapterArgs): PaymentAdapter => {
  const { accountId, apiKey, domain, groupOverrides, webhookSigningKey } = props
  const label = props?.label || 'Zoho Payments'

  const baseFields: GroupField['fields'] = [
    {
      name: 'paymentsSessionID',
      type: 'text',
      index: true,
      label: 'Zoho Payments Session ID',
    },
    {
      name: 'paymentID',
      type: 'text',
      label: 'Zoho Payment ID',
    },
    {
      name: 'status',
      type: 'text',
      admin: { readOnly: true },
      label: 'Zoho Payment Status',
    },
    {
      name: 'shippingAddressSnapshot',
      type: 'json',
      admin: { hidden: true },
    },
  ]

  const groupField: GroupField = {
    name: 'zoho',
    type: 'group',
    ...groupOverrides,
    admin: {
      condition: (data) => data?.paymentMethod === 'zoho',
      ...groupOverrides?.admin,
    },
    fields:
      groupOverrides?.fields && typeof groupOverrides.fields === 'function'
        ? groupOverrides.fields({ defaultFields: baseFields })
        : baseFields,
  }

  return {
    name: 'zoho',
    confirmOrder,
    endpoints: [webhookEndpoint({ confirmOrder, webhookSigningKey })],
    group: groupField,
    initiatePayment: initiatePayment({ accountId, apiKey, domain }),
    label,
  }
}
