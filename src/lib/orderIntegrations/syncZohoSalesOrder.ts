import type { Payload } from 'payload'

import { zohoIsConfigured } from '@/lib/zoho/auth'
import { findOrCreateZohoCustomer } from '@/lib/zoho/customers'
import { getZohoOrganizationState } from '@/lib/zoho/organization'
import { resolveTaxId } from '@/lib/zoho/taxes'
import { getInvoicePdfUrl, getZohoInvoice } from '@/lib/zoho/invoices'
import {
  convertSalesOrderToInvoice,
  createZohoSalesOrder,
  findExistingSalesOrderByOrderId,
  getZohoSalesOrder,
} from '@/lib/zoho/salesOrders'
import type { ZohoAddress, ZohoLineItem, ZohoSalesOrder } from '@/lib/zoho/types'
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

export const toZohoAddress = (address: AddressLike, state?: IndianState): ZohoAddress | undefined => {
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
 * Same intra/inter-state comparison as computeGstTaxBreakdown — needed
 * because Zoho has separate tax_ids per type (e.g. "GST18" vs "IGST18") and
 * will reject a sales order/invoice whose line items carry the wrong one for
 * the transaction ("IGST has to be applied as this is an interstate
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
 * Builds Zoho line items for an order's items (name, HSN/SAC, GST-exclusive
 * rate, tax_id) — shared by sales order creation and, for a one-off
 * correction, direct invoice edits.
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
    // top when computing the total.
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

async function resolveCustomerForOrder(
  payload: Payload,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order: any,
): Promise<{ contactId: string }> {
  const billing = order.billingAddress?.addressLine1 ? order.billingAddress : order.shippingAddress
  const shipping = order.shippingAddress
  const billingState = resolveIndianState(billing?.state)
  const shippingState = resolveIndianState(shipping?.state)

  const gstin: string | undefined = order.businessDetails?.gstin || undefined
  const companyName: string | undefined = order.businessDetails?.companyName || undefined
  const customerName =
    `${billing?.firstName || ''} ${billing?.lastName || ''}`.trim() || order.customerEmail || 'Customer'

  const customerId = typeof order.customer === 'object' ? order.customer?.id : order.customer
  let existingContactId: string | undefined
  if (customerId) {
    const customerDoc = await payload.findByID({ collection: 'users', id: customerId, depth: 0, overrideAccess: true })
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
      .update({ collection: 'users', id: customerId, data: { zohoCustomerId: contact.contact_id } as never, overrideAccess: true })
      .catch((err) => payload.logger.warn({ msg: 'Could not save zohoCustomerId on user', err, customerId }))
  }

  return { contactId: contact.contact_id }
}

/**
 * Writes back whatever a Zoho invoice already linked to this sales order
 * looks like — used both right after our own "accept" conversion and when
 * detecting that someone converted the sales order directly in Zoho Books.
 */
async function applyLinkedInvoice(payload: Payload, orderId: number | string, salesOrder: ZohoSalesOrder) {
  const linked = salesOrder.invoices?.[0]
  if (!linked) return

  const invoice = await getZohoInvoice(linked.invoice_id)

  await payload.update({
    collection: 'orders',
    id: orderId,
    data: {
      zohoInvoiceId: invoice.invoice_id,
      zohoInvoiceNumber: invoice.invoice_number,
      zohoInvoiceStatus: invoice.status,
      zohoInvoiceUrl: getInvoicePdfUrl(invoice),
      zohoInvoiceCreatedAt: new Date().toISOString(),
      invoiceSyncStatus: 'completed',
    },
    overrideAccess: true,
  })
}

/**
 * Creates the Zoho Sales Order for an order (the first step — every order
 * becomes a sales order, not an invoice, so stock/availability can be
 * confirmed before billing). Also detects and pulls in an invoice if the
 * sales order has *already* been converted — whether by a previous call to
 * acceptZohoSalesOrder, or directly by staff inside Zoho Books itself.
 * Idempotent and never throws — called both by the createZohoSalesOrder
 * afterChange hook and the admin "Retry" endpoint.
 */
export async function syncZohoSalesOrderForOrder(payload: Payload, orderId: number | string): Promise<void> {
  if (!zohoIsConfigured) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let order: any
  try {
    order = await payload.findByID({ collection: 'orders', id: orderId, depth: 1, overrideAccess: true })
  } catch (err) {
    payload.logger.error({ msg: 'syncZohoSalesOrderForOrder: order not found', err, orderId })
    return
  }

  if (!order || order.status === 'cancelled') return

  try {
    await payload.update({
      collection: 'orders',
      id: orderId,
      data: { salesOrderSyncStatus: 'processing' },
      overrideAccess: true,
    })

    // Idempotency guard — checks Zoho directly, not just our local flag, so
    // a retried hook or manual retry never produces a duplicate sales order.
    let salesOrder = await findExistingSalesOrderByOrderId(orderId)

    if (!salesOrder) {
      const { contactId } = await resolveCustomerForOrder(payload, order)

      const siteSettings = await payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true })
      const defaultGstPercent = siteSettings?.taxSettings?.gstRatePercent ?? 18

      const billing = order.billingAddress?.addressLine1 ? order.billingAddress : order.shippingAddress
      const shipping = order.shippingAddress
      const customerState = resolveIndianState(shipping?.state) || resolveIndianState(billing?.state)
      // The org's registered state is asked from Zoho itself rather than
      // trusted from Site Settings/env — those go stale the moment the
      // connected Zoho org changes (confirmed live: a leftover
      // ZOHO_BUSINESS_STATE from a previous org caused every sales order to
      // get the intra/inter-state tax backwards and be rejected either way).
      const sellerState = (await getZohoOrganizationState()) || siteSettings?.taxSettings?.businessState
      const taxType = resolveOrderTaxType(sellerState, customerState?.name)

      const lineItems = await buildZohoLineItems(payload, order, taxType, defaultGstPercent)
      if (lineItems.length === 0) throw new Error('No valid line items for a sales order.')

      const gstin: string | undefined = order.businessDetails?.gstin || undefined
      const companyName: string | undefined = order.businessDetails?.companyName || undefined
      const gstTreatment = gstin ? 'business_gst' : companyName ? 'business_none' : undefined

      salesOrder = await createZohoSalesOrder({
        customerId: contactId,
        referenceNumber: String(orderId),
        date: new Date(order.createdAt || Date.now()).toISOString().slice(0, 10),
        placeOfSupply: customerState?.zohoStateCode,
        gstTreatment,
        gstNo: gstin,
        lineItems,
      })

      await payload.update({
        collection: 'orders',
        id: orderId,
        data: {
          zohoCustomerId: contactId,
          zohoSalesOrderId: salesOrder.salesorder_id,
          zohoSalesOrderNumber: salesOrder.salesorder_number,
          zohoSalesOrderStatus: salesOrder.status,
          salesOrderSyncStatus: 'completed',
          integrationError: { ...order.integrationError, salesOrder: null },
          lastSyncAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })
    } else {
      await payload.update({
        collection: 'orders',
        id: orderId,
        data: {
          zohoSalesOrderId: salesOrder.salesorder_id,
          zohoSalesOrderNumber: salesOrder.salesorder_number,
          zohoSalesOrderStatus: salesOrder.status,
          salesOrderSyncStatus: 'completed',
          integrationError: { ...order.integrationError, salesOrder: null },
          lastSyncAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })
    }

    // Someone may have already accepted/converted this sales order straight
    // inside Zoho Books — pick that up here so it doesn't require a
    // separate "Accept" click on our side too.
    if (salesOrder.invoices?.length) {
      await applyLinkedInvoice(payload, orderId, salesOrder)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    payload.logger.error({ msg: 'Failed to sync Zoho sales order', err, orderId })
    await payload
      .update({
        collection: 'orders',
        id: orderId,
        data: {
          salesOrderSyncStatus: 'failed',
          integrationError: { ...order?.integrationError, salesOrder: message },
          lastSyncAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })
      .catch(() => {})
  }
}

/**
 * The "Accept" action: converts the order's sales order into an invoice —
 * called from the admin panel once stock/availability has been confirmed.
 * Idempotent: if the sales order already has a linked invoice (e.g. it was
 * converted directly in Zoho Books since the last sync), this just re-pulls
 * that invoice instead of converting again.
 */
export async function acceptZohoSalesOrder(payload: Payload, orderId: number | string): Promise<void> {
  if (!zohoIsConfigured) throw new Error('Zoho is not configured.')

  const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 0, overrideAccess: true })
  if (!order?.zohoSalesOrderId) {
    throw new Error('This order has no Zoho sales order yet — try Retry first.')
  }

  await payload.update({
    collection: 'orders',
    id: orderId,
    data: { invoiceSyncStatus: 'processing' },
    overrideAccess: true,
  })

  try {
    const current = await getZohoSalesOrder(order.zohoSalesOrderId)

    if (!current.invoices?.length) {
      await convertSalesOrderToInvoice(order.zohoSalesOrderId)
    }

    const refreshed = await getZohoSalesOrder(order.zohoSalesOrderId)
    await payload.update({
      collection: 'orders',
      id: orderId,
      data: { zohoSalesOrderStatus: refreshed.status },
      overrideAccess: true,
    })
    await applyLinkedInvoice(payload, orderId, refreshed)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await payload.update({
      collection: 'orders',
      id: orderId,
      data: {
        invoiceSyncStatus: 'failed',
        integrationError: { ...order.integrationError, invoice: message },
        lastSyncAt: new Date().toISOString(),
      },
      overrideAccess: true,
    })
    throw err
  }
}
