import type { Payload } from 'payload'

import { zohoIsConfigured } from '@/lib/zoho/auth'
import { findOrCreateZohoCustomer } from '@/lib/zoho/customers'
import { resolveTaxId } from '@/lib/zoho/taxes'
import { createZohoInvoice, findExistingInvoiceByOrderId, getInvoicePdfUrl, getZohoInvoice } from '@/lib/zoho/invoices'
import { recordCustomerPayment } from '@/lib/zoho/payments'
import type { ZohoAddress, ZohoInvoice, ZohoLineItem } from '@/lib/zoho/types'
import { IndianState, resolveIndianState } from '@/lib/indianStates'

type AddressLike = {
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  country?: string | null
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  postalCode?: string | null
  state?: string | null
} | null | undefined

const toZohoAddress = (address: AddressLike, state?: IndianState): ZohoAddress | undefined => {
  if (!address) return undefined
  return {
    attention: `${address.firstName || ''} ${address.lastName || ''}`.trim() || undefined,
    address: address.addressLine1 || '',
    street2: address.addressLine2 || undefined,
    city: address.city || '',
    state: state?.name || address.state || '',
    state_code: state?.zohoStateCode,
    zip: address.postalCode || '',
    country: address.country || 'India',
    phone: address.phone || undefined,
  }
}

/**
 * PayU's own transaction id (mihpayid — assigned once PayU confirms the
 * payment; txnid is our merchant-generated id, sent before confirmation) is
 * the reference a bookkeeper actually wants on a payment record, not our
 * internal order id — it's what shows up in PayU's own settlement reports,
 * so it's what reconciliation is actually done against.
 */
export function getPayuReference(order: { transactions?: unknown }): string | undefined {
  const transaction = Array.isArray(order.transactions) ? order.transactions[0] : undefined
  const payu = transaction && typeof transaction === 'object' ? (transaction as { payu?: { mihpayid?: string; txnid?: string } }).payu : undefined
  return payu?.mihpayid || payu?.txnid
}

/**
 * This app collects 100% of the order total upfront (via PayU, or on
 * delivery for COD) before an invoice is ever created — so by the time
 * createZohoInvoice runs, the money has already been received. Without
 * explicitly recording that in Zoho, the invoice sits with the full amount
 * showing as "Balance Due" even though nothing is actually owed. Best-effort
 * and non-fatal: a failure here doesn't undo the (already successful)
 * invoice creation, just leaves the balance showing until retried.
 */
export async function recordPaymentIfNeeded(args: {
  payload: import('payload').Payload
  order: { id: number | string; createdAt?: string; paymentMethod?: string | null; transactions?: unknown }
  customerId?: string
  invoice: ZohoInvoice
}): Promise<boolean> {
  const { payload, order, customerId, invoice } = args
  const balance = invoice.balance ?? invoice.total
  if (!customerId || !balance || balance <= 0) return false

  const isPayu = order.paymentMethod !== 'cod'
  const payuReference = isPayu ? getPayuReference(order) : undefined

  try {
    await recordCustomerPayment({
      customerId,
      invoiceId: invoice.invoice_id,
      amount: balance,
      date: new Date(order.createdAt || Date.now()).toISOString().slice(0, 10),
      referenceNumber: payuReference || String(order.id),
      // Must exactly match an existing mode name in Zoho's Settings > Payment
      // Modes — Zoho matches by exact string (case-sensitive) and silently
      // creates a new custom mode instead of erroring on a near-miss, so a
      // wrong-case guess here doesn't fail loudly, it clutters the settings
      // screen with a duplicate. Configurable rather than hard-coded so a
      // typo/rename doesn't require a code change to fix.
      paymentMode: isPayu ? process.env.ZOHO_PAYU_PAYMENT_MODE || 'PAYU' : 'cash',
      accountId: process.env.ZOHO_PAYMENT_DEPOSIT_ACCOUNT_ID || undefined,
      // No hardcoded org-specific fallback here — a bank account name is
      // only valid for the Zoho org it was configured against, and this
      // exact thing broke silently once already when the connected org
      // changed (a stale "SBI-BKC" from a previous org didn't exist in the
      // new one, so every payment-recording call threw "account not found",
      // was swallowed by the catch below, and every invoice sat with an
      // unpaid balance despite being fully paid via PayU). Leaving both
      // unset falls through to recordCustomerPayment's own documented
      // behavior: Zoho's own "Undeposited Funds" default, which always exists.
      accountName: process.env.ZOHO_PAYMENT_DEPOSIT_ACCOUNT_NAME || undefined,
    })
    return true
  } catch (err) {
    payload.logger.warn({ msg: 'Failed to record Zoho payment for invoice', err, orderId: order.id })
    return false
  }
}

/**
 * Builds Zoho line items for an order's items. Exported (not just inlined in
 * syncZohoInvoiceForOrder) so a one-off correction script can rebuild
 * line items with the current — correct — logic for an invoice that was
 * created before a pricing/tax fix landed, without duplicating this logic.
 */
export async function buildZohoLineItems(
  payload: Payload,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order: any,
  taxType: 'intra-state' | 'inter-state',
  defaultGstPercent: number,
): Promise<ZohoLineItem[]> {
  const lineItems: ZohoLineItem[] = []

  for (const item of order.items || []) {
    const productId = typeof item.product === 'object' ? item.product?.id : item.product
    if (!productId) continue

    const product =
      typeof item.product === 'object' && item.product
        ? item.product
        : await payload.findByID({ collection: 'products', id: productId, depth: 0, overrideAccess: true })

    const variant =
      item.variant && typeof item.variant === 'object'
        ? item.variant
        : item.variant
          ? await payload.findByID({ collection: 'variants', id: item.variant, depth: 0, overrideAccess: true })
          : undefined

    const gstPercent = product?.gstPercent ?? defaultGstPercent
    const taxId = await resolveTaxId(gstPercent, taxType)

    // priceInINR is GST-inclusive (same assumption as taxCalculation.ts) but
    // Zoho's line-item `rate` is the pre-tax base — it adds tax_id's rate on
    // top when computing the invoice total. Sending the inclusive price
    // straight through double-counted GST (e.g. a ₹5.00 inclusive price
    // became a ₹5.00 rate + ₹0.90 IGST = ₹5.90 total, instead of the ₹5.00
    // actually charged) and left every invoice showing a "balance due" for
    // the extra tax amount that was never actually owed.
    const taxInclusiveRate = ((variant?.priceInINR ?? product?.priceInINR ?? 0) as number) / 100
    const rate = gstPercent > 0 ? taxInclusiveRate / (1 + gstPercent / 100) : taxInclusiveRate

    lineItems.push({
      name: product?.title || 'Product',
      hsn_or_sac: product?.hsnCode || undefined,
      rate,
      quantity: item.quantity ?? 1,
      tax_id: taxId,
    })
  }

  return lineItems
}

/**
 * Same intra/inter-state comparison as computeGstTaxBreakdown — needed
 * because Zoho has separate tax_ids per type (e.g. "GST18" vs "IGST18") and
 * will reject an invoice whose line items carry the wrong one for the
 * transaction ("IGST has to be applied as this is an interstate
 * transaction").
 */
export function resolveOrderTaxType(
  sellerStateName: string | null | undefined,
  customerStateName: string | null | undefined,
): 'intra-state' | 'inter-state' {
  const sellerState = resolveIndianState(sellerStateName)
  const customerState = resolveIndianState(customerStateName)
  return sellerState && customerState && sellerState.gstCode === customerState.gstCode
    ? 'intra-state'
    : 'inter-state'
}

/**
 * Does the full Zoho invoice sync for one order: find-or-create the Zoho
 * contact, build GST-aware line items, create the invoice, and write the
 * result back onto the order. Called both by the createZohoInvoice afterChange
 * hook (automatic, on order creation) and the admin "Retry invoice" endpoint
 * (manual) — same idempotent core either way, never throws.
 */
export async function syncZohoInvoiceForOrder(payload: Payload, orderId: number | string): Promise<void> {
  if (!zohoIsConfigured) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let order: any
  try {
    order = await payload.findByID({ collection: 'orders', id: orderId, depth: 1, overrideAccess: true })
  } catch (err) {
    payload.logger.error({ msg: 'syncZohoInvoiceForOrder: order not found', err, orderId })
    return
  }

  if (!order || order.status === 'cancelled') return

  try {
    await payload.update({
      collection: 'orders',
      id: orderId,
      data: { invoiceSyncStatus: 'processing' },
      overrideAccess: true,
    })

    // Idempotency guard — checks Zoho directly (not just our local flag), so
    // a manual retry after a partial failure never creates a duplicate invoice.
    const existingInvoice = await findExistingInvoiceByOrderId(orderId)

    const billing = order.billingAddress?.addressLine1 ? order.billingAddress : order.shippingAddress
    const shipping = order.shippingAddress

    if (existingInvoice) {
      const paymentRecorded = await recordPaymentIfNeeded({
        payload,
        order,
        customerId: existingInvoice.customer_id,
        invoice: existingInvoice,
      })
      const syncedInvoice = paymentRecorded
        ? await getZohoInvoice(existingInvoice.invoice_id).catch(() => existingInvoice)
        : existingInvoice

      await payload.update({
        collection: 'orders',
        id: orderId,
        data: {
          zohoInvoiceId: syncedInvoice.invoice_id,
          zohoInvoiceNumber: syncedInvoice.invoice_number,
          zohoInvoiceStatus: syncedInvoice.status,
          zohoInvoiceUrl: getInvoicePdfUrl(syncedInvoice),
          invoiceSyncStatus: 'completed',
          integrationError: { ...order.integrationError, invoice: null },
          lastSyncAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })
      return
    }

    const billingState = resolveIndianState(billing?.state)
    const shippingState = resolveIndianState(shipping?.state)

    const gstin: string | undefined = order.businessDetails?.gstin || undefined
    const companyName: string | undefined = order.businessDetails?.companyName || undefined

    const customerName =
      `${billing?.firstName || ''} ${billing?.lastName || ''}`.trim() || order.customerEmail || 'Customer'

    const customerId = typeof order.customer === 'object' ? order.customer?.id : order.customer
    let existingContactId: string | undefined
    if (customerId) {
      const customerDoc = await payload.findByID({
        collection: 'users',
        id: customerId,
        depth: 0,
        overrideAccess: true,
      })
      existingContactId = (customerDoc as { zohoCustomerId?: string })?.zohoCustomerId || undefined
    }

    const { contact } = await findOrCreateZohoCustomer({
      existingContactId,
      contactName: customerName,
      companyName,
      email: order.customerEmail || undefined,
      phone: billing?.phone || shipping?.phone || undefined,
      gstin,
      billingAddress: toZohoAddress(billing, billingState),
      shippingAddress: toZohoAddress(shipping, shippingState),
    })

    if (customerId && contact.contact_id) {
      await payload
        .update({
          collection: 'users',
          id: customerId,
          data: { zohoCustomerId: contact.contact_id } as never,
          overrideAccess: true,
        })
        .catch((err) => payload.logger.warn({ msg: 'Could not save zohoCustomerId on user', err, customerId }))
    }

    const siteSettings = await payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true })
    const defaultGstPercent = siteSettings?.taxSettings?.gstRatePercent ?? 18

    const businessState = siteSettings?.taxSettings?.businessState || process.env.ZOHO_BUSINESS_STATE || 'Karnataka'
    const customerState = shippingState || billingState
    const taxType = resolveOrderTaxType(businessState, customerState?.name)

    const lineItems = await buildZohoLineItems(payload, order, taxType, defaultGstPercent)

    if (lineItems.length === 0) {
      throw new Error('No valid line items to invoice.')
    }

    const gstTreatment = gstin ? 'business_gst' : companyName ? 'business_none' : 'consumer'

    const invoice = await createZohoInvoice({
      customerId: contact.contact_id,
      referenceNumber: String(orderId),
      date: new Date(order.createdAt || Date.now()).toISOString().slice(0, 10),
      placeOfSupply: shippingState?.zohoStateCode || billingState?.zohoStateCode,
      gstTreatment,
      gstNo: gstin,
      lineItems,
    })

    const paymentRecorded = await recordPaymentIfNeeded({ payload, order, customerId: contact.contact_id, invoice })
    const syncedInvoice = paymentRecorded ? await getZohoInvoice(invoice.invoice_id).catch(() => invoice) : invoice

    await payload.update({
      collection: 'orders',
      id: orderId,
      data: {
        zohoCustomerId: contact.contact_id,
        zohoInvoiceId: syncedInvoice.invoice_id,
        zohoInvoiceNumber: syncedInvoice.invoice_number,
        zohoInvoiceStatus: syncedInvoice.status,
        zohoInvoiceUrl: getInvoicePdfUrl(syncedInvoice),
        zohoInvoiceCreatedAt: new Date().toISOString(),
        invoiceSyncStatus: 'completed',
        integrationError: { ...order.integrationError, invoice: null },
        lastSyncAt: new Date().toISOString(),
      },
      overrideAccess: true,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    payload.logger.error({ msg: 'Failed to sync Zoho invoice', err, orderId })
    await payload
      .update({
        collection: 'orders',
        id: orderId,
        data: {
          invoiceSyncStatus: 'failed',
          integrationError: { ...order?.integrationError, invoice: message },
          lastSyncAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })
      .catch(() => {})
  }
}
