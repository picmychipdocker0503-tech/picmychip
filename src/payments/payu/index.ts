import type { PaymentAdapter, PaymentAdapterArgs } from '@payloadcms/plugin-ecommerce/types'
import type { GroupField } from 'payload'

import { callbackEndpoint } from './endpoints/callback'
import { confirmOrder } from './confirmOrder'
import { initiatePayment } from './initiatePayment'

export type PayuAdapterArgs = {
  /**
   * PayU's Merchant Key, identifying the merchant account. Not secret — sent as a plain form
   * field in the checkout redirect.
   */
  merchantKey: string
  /**
   * PayU's Merchant Salt, used to compute the request hash and verify the callback's reverse
   * hash. Never sent to the client.
   */
  merchantSalt: string
  /**
   * Which PayU environment to post payments to. Defaults to 'test'.
   */
  mode?: 'production' | 'test'
} & PaymentAdapterArgs

/**
 * Custom PayU payment adapter for `@payloadcms/plugin-ecommerce`, which ships no first-party PayU
 * adapter. Unlike Stripe/Razorpay's JS-modal flow, PayU's standard integration redirects the
 * browser away to a PayU-hosted page, then PayU POSTs the result back to a callback URL on this
 * server (see endpoints/callback.ts) — so `confirmOrder` here is never called by the client
 * directly, only by that callback endpoint.
 */
export const payuAdapter = (props: PayuAdapterArgs): PaymentAdapter => {
  const { groupOverrides, merchantKey, merchantSalt, mode = 'test' } = props
  const label = props?.label || 'PayU'

  const baseFields: GroupField['fields'] = [
    {
      name: 'txnid',
      type: 'text',
      index: true,
      label: 'PayU Transaction ID',
    },
    {
      name: 'mihpayid',
      type: 'text',
      label: 'PayU Payment ID',
    },
    {
      name: 'status',
      type: 'text',
      admin: { readOnly: true },
      label: 'PayU Status',
    },
    {
      name: 'shippingAddressSnapshot',
      type: 'json',
      admin: { hidden: true },
    },
  ]

  const groupField: GroupField = {
    name: 'payu',
    type: 'group',
    ...groupOverrides,
    admin: {
      condition: (data) => data?.paymentMethod === 'payu',
      ...groupOverrides?.admin,
    },
    fields:
      groupOverrides?.fields && typeof groupOverrides.fields === 'function'
        ? groupOverrides.fields({ defaultFields: baseFields })
        : baseFields,
  }

  const confirmOrderFn = confirmOrder({ merchantKey, merchantSalt })

  return {
    name: 'payu',
    confirmOrder: confirmOrderFn,
    endpoints: [callbackEndpoint({ confirmOrder: confirmOrderFn })],
    group: groupField,
    initiatePayment: initiatePayment({ merchantKey, merchantSalt, mode }),
    label,
  }
}
