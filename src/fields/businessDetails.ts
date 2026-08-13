import type { Field } from 'payload'

/**
 * Address subfields mirroring the ecommerce plugin's own shippingAddress
 * shape (title/firstName/lastName/company/addressLine1/addressLine2/city/
 * state/postalCode/country/phone) — kept as a standalone definition (rather
 * than reused from the plugin) since Order has no billing address of its own
 * today, and Transaction's existing billingAddress field is plugin-owned.
 *
 * A factory, not a static array — Payload sanitizes field configs in place
 * per collection, so the same object/array reference must never be handed to
 * more than one collection (same reasoning as core's own `slugField()`).
 */
export const billingDetailsAddressFields = (): Field[] => [
  { name: 'title', type: 'text' },
  { name: 'firstName', type: 'text' },
  { name: 'lastName', type: 'text' },
  { name: 'company', type: 'text' },
  { name: 'addressLine1', type: 'text' },
  { name: 'addressLine2', type: 'text' },
  { name: 'city', type: 'text' },
  { name: 'state', type: 'text' },
  { name: 'postalCode', type: 'text' },
  { name: 'country', type: 'text' },
  { name: 'phone', type: 'text' },
]

/**
 * GST/business identity captured at checkout — used to build the Zoho
 * Invoice customer/contact and to decide gst_treatment (registered vs
 * unregistered). Used on both the Orders and Transactions overrides so
 * PayU's initiatePayment→confirmOrder flow can carry it end to end — a
 * factory for the same in-place-sanitization reason as above.
 */
export const businessDetailsGroup = (): Field => ({
  name: 'businessDetails',
  type: 'group',
  admin: {
    description: 'Optional GST/company details provided at checkout, used for the Zoho tax invoice.',
  },
  fields: [
    { name: 'companyName', type: 'text' },
    { name: 'gstin', type: 'text', label: 'GSTIN' },
    { name: 'panNumber', type: 'text', label: 'PAN' },
  ],
})
