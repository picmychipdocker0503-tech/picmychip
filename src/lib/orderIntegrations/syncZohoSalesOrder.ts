import type { Payload } from 'payload'

import { invoiceReadyEmailHtml, sendMail } from '@/lib/email'
import { IndianState, resolveIndianState } from '@/lib/indianStates'
import { zohoIsConfigured } from '@/lib/zoho/auth'
import { findCreditNoteForInvoice, getCreditNoteUrl } from '@/lib/zoho/creditNotes'
import { findOrCreateZohoCustomer, getZohoGstTreatment, markZohoContactActive } from '@/lib/zoho/customers'
import { getInvoicePdfUrl, getZohoInvoice } from '@/lib/zoho/invoices'
import { findOrCreateZohoItem } from '@/lib/zoho/items'
import { getZohoOrganizationState } from '@/lib/zoho/organization'
import { recordCustomerPayment } from '@/lib/zoho/payments'
import {
  convertSalesOrderToInvoice,
  createZohoSalesOrder,
  findExistingSalesOrderByOrderId,
  getZohoSalesOrder,
} from '@/lib/zoho/salesOrders'
import { resolveTaxId } from '@/lib/zoho/taxes'
import type { ZohoAddress, ZohoLineItem, ZohoSalesOrder } from '@/lib/zoho/types'
import { getServerSideURL } from '@/utilities/getURL'
import { richTextToPlainText } from '@/utilities/richTextToPlainText'

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
  const zohoAddress: ZohoAddress = {
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
  // Belt-and-suspenders: ZohoAddress has no email field by type, but this
  // guarantees it even if a caller ever spreads extra fields in — a Zoho
  // billing/shipping address must never carry the customer's email.
  delete (zohoAddress as Record<string, unknown>).email
  delete (zohoAddress as Record<string, unknown>).email_id
  delete (zohoAddress as Record<string, unknown>).customer_email
  return zohoAddress
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
 * rate, tax_id, and a matched-or-created Zoho catalog item_id) — shared by
 * sales order creation and, for a one-off correction, direct invoice edits.
 *
 * Every item is resolved against Zoho's Items catalog (find-or-create, never
 * duplicated) and every rate is resolved against Zoho's configured taxes
 * *before* anything is created — a failure on either aborts the whole sync
 * (thrown, not swallowed) so a Sales Order is never created with an
 * incomplete or mis-taxed item list. Processed sequentially, not in
 * parallel, so nothing races to create the same item twice within one order.
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

    if (gstPercent > 0 && !taxId) {
      payload.logger.error({
        msg: 'No Zoho tax configuration found for product',
        productId,
        sku: product?.sku,
        itemName: product?.title,
        hsnCode: product?.hsnCode,
        gstPercent,
        taxType,
      })
      throw new Error(
        `No Zoho tax configuration found for ${gstPercent}% (${taxType}) — configure it in Zoho Books Settings → Taxes.`,
      )
    }

    // priceInINR is GST-exclusive — Zoho's line-item `rate` is the pre-tax
    // base too, so it's used directly; Zoho adds tax_id's rate on top.
    const rate = ((variant?.priceInINR ?? product?.priceInINR ?? 0) as number) / 100

    let itemId: string | undefined
    try {
      const result = await findOrCreateZohoItem({
        zohoItemId: product?.zohoItemId || undefined,
        name: product?.title || 'Product',
        sku: product?.sku || undefined,
        description: richTextToPlainText(product?.description) || undefined,
        hsnCode: product?.hsnCode || undefined,
        taxId,
        rate,
      })
      itemId = result.itemId

      if (product?.id && result.itemId !== product?.zohoItemId) {
        await payload.update({
          collection: 'products',
          id: product.id,
          data: { zohoItemId: result.itemId },
          overrideAccess: true,
          context: { disableRevalidate: true },
        })
      }
    } catch (err) {
      payload.logger.error({
        msg: 'Failed to resolve/create Zoho item',
        productId,
        sku: product?.sku,
        itemName: product?.title,
        hsnCode: product?.hsnCode,
        gstPercent,
        zohoItemId: product?.zohoItemId,
        err,
      })
      throw err
    }

    lineItems.push({
      name: product?.title || 'Product',
      hsn_or_sac: product?.hsnCode || undefined,
      rate,
      quantity: item.quantity ?? 1,
      tax_id: taxId,
      item_id: itemId,
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

  // Matched on THIS order's own email/GSTIN/phone only — deliberately does
  // NOT check a cached zohoCustomerId on the logged-in account. That
  // shortcut used to force every order from the same account onto one
  // shared Zoho contact regardless of what billing name/phone was actually
  // entered — confirmed live: a logged-in account placing orders under two
  // different real names ("Keerthan Kumar P" vs "Praveen kumar.D") had them
  // collapse into a single contact, and each re-sync flipped its name to
  // whichever order ran last, showing the wrong customer on the others'
  // sales orders. One Zoho contact per distinct set of order details is what
  // a repeat customer naturally gets anyway, since they'd enter the same
  // details each time; this only diverges — correctly — when they don't.
  const { contact } = await findOrCreateZohoCustomer({
    contactName: customerName,
    firstName: billing?.firstName || undefined,
    lastName: billing?.lastName || undefined,
    companyName,
    email: order.customerEmail || undefined,
    phone: billing?.phone || shipping?.phone || undefined,
    gstin,
    billingAddress: toZohoAddress(billing, billingState),
    shippingAddress: toZohoAddress(shipping, shippingState),
  })

  return { contactId: contact.contact_id }
}

function isInactiveZohoCustomerError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return message.includes('"code":3021') || message.toLowerCase().includes('customer is inactive')
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function findOrderForZohoSync(payload: Payload, orderId: number | string) {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      return await payload.findByID({ collection: 'orders', id: orderId, depth: 1, overrideAccess: true })
    } catch (err) {
      if (attempt === 5) throw err
      await sleep(1000)
    }
  }
}

function getInvoiceDownloadUrl(order: {
  id: number | string
  accessToken?: string | null
  customerEmail?: string | null
}): string {
  const params = new URLSearchParams()
  if (order.customerEmail) params.set('email', order.customerEmail)
  if (order.accessToken) params.set('accessToken', order.accessToken)

  const query = params.toString()
  return `${getServerSideURL()}/api/orders/${order.id}/invoice-pdf${query ? `?${query}` : ''}`
}

/**
 * Writes back whatever a Zoho invoice already linked to this sales order
 * looks like — used both right after our own "accept" conversion and when
 * detecting that someone converted the sales order directly in Zoho Books.
 */
async function applyLinkedInvoice(payload: Payload, orderId: number | string, salesOrder: ZohoSalesOrder) {
  const linked = salesOrder.invoices?.[0]
  if (!linked) return

  const existingOrder = await payload.findByID({ collection: 'orders', id: orderId, depth: 0, overrideAccess: true })
  const invoiceWasAlreadyLinked = Boolean(existingOrder.zohoInvoiceId)
  const invoice = await getZohoInvoice(linked.invoice_id)
  const paymentResult = await recordPayuPaymentAgainstInvoice(payload, orderId, invoice)
  const updatedInvoice = paymentResult.recorded ? await getZohoInvoice(linked.invoice_id) : invoice
  const invoiceUrl = getInvoicePdfUrl(updatedInvoice)

  await payload.update({
    collection: 'orders',
    id: orderId,
    data: {
      zohoInvoiceId: updatedInvoice.invoice_id,
      zohoInvoiceNumber: updatedInvoice.invoice_number,
      zohoInvoiceStatus: updatedInvoice.status,
      zohoInvoiceUrl: invoiceUrl,
      zohoInvoiceCreatedAt: new Date().toISOString(),
      ...(paymentResult.referenceNumber ? { paymentReference: paymentResult.referenceNumber } : {}),
      ...(paymentResult.recorded ? { zohoPaymentRecordedAt: new Date().toISOString() } : {}),
      invoiceSyncStatus: 'completed',
    },
    overrideAccess: true,
  })

  const email =
    existingOrder.customerEmail || (typeof existingOrder.customer === 'object' ? existingOrder.customer?.email : undefined)

  if (email && !invoiceWasAlreadyLinked) {
    const invoiceDownloadUrl = getInvoiceDownloadUrl(existingOrder)

    await sendMail(payload, {
      to: email,
      subject: `Invoice ready for order #${orderId}`,
      html: invoiceReadyEmailHtml({
        id: orderId,
        invoiceNumber: updatedInvoice.invoice_number,
        invoiceUrl: invoiceDownloadUrl,
      }),
      emailType: 'INVOICE_READY',
      eventId: `INVOICE_READY_${orderId}_${updatedInvoice.invoice_number || updatedInvoice.invoice_id}`,
    })
  }
}

async function recordPayuPaymentAgainstInvoice(
  payload: Payload,
  orderId: number | string,
  invoice: { balance?: number; customer_id?: string; invoice_id: string; status?: string; total: number },
): Promise<{ recorded: boolean; referenceNumber?: string }> {
  if (invoice.status?.toLowerCase() === 'paid' || invoice.balance === 0) return { recorded: false }

  const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 1, overrideAccess: true })
  const transactionRefs = order.transactions || []

  for (const ref of transactionRefs) {
    const transaction =
      typeof ref === 'object' && ref
        ? ref
        : await payload.findByID({ collection: 'transactions', id: ref, depth: 0, overrideAccess: true })

    if (!transaction || transaction.paymentMethod !== 'payu') continue
    if (transaction.status !== 'succeeded') continue

    const payu = transaction.payu
    const referenceNumber = payu?.mihpayid || payu?.txnid
    if (!referenceNumber) continue

    const invoiceBalance = typeof invoice.balance === 'number' ? invoice.balance : invoice.total
    const paidAmount = typeof transaction.amount === 'number' ? transaction.amount / 100 : invoiceBalance
    const amount = Math.min(invoiceBalance, paidAmount)

    if (!invoice.customer_id || amount <= 0) {
      return { recorded: false, referenceNumber }
    }

    try {
      await recordCustomerPayment({
        customerId: invoice.customer_id,
        invoiceId: invoice.invoice_id,
        amount,
        date: new Date(order.createdAt || Date.now()).toISOString().slice(0, 10),
        referenceNumber,
        paymentMode: process.env.ZOHO_PAYMENT_MODE || 'payu',
        accountId: process.env.ZOHO_PAYMENT_ACCOUNT_ID || undefined,
        accountName: process.env.ZOHO_PAYMENT_ACCOUNT_NAME || undefined,
      })

      return { recorded: true, referenceNumber }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.toLowerCase().includes('payment') && message.toLowerCase().includes('already')) {
        return { recorded: false, referenceNumber }
      }
      throw err
    }
  }

  return { recorded: false }
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
export async function syncZohoSalesOrderForOrder(
  payload: Payload,
  orderId: number | string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialOrder?: any,
): Promise<void> {
  if (!zohoIsConfigured) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let order: any = initialOrder
  try {
    if (!order) {
      order = await findOrderForZohoSync(payload, orderId)
    }
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
      if (order.shippingAmount && order.shippingAmount > 0) {
        const shippingTaxId = await resolveTaxId(defaultGstPercent, taxType)
        lineItems.push({
          name: order.shippingMethod === 'express' ? 'Express Shipping' : 'Standard Shipping',
          hsn_or_sac: '9968',
          rate: order.shippingAmount / 100,
          quantity: 1,
          tax_id: shippingTaxId,
        })
      }
      if (lineItems.length === 0) throw new Error('No valid line items for a sales order.')

      const gstin: string | undefined = order.businessDetails?.gstin || undefined
      const gstTreatment = getZohoGstTreatment({ companyName: order.businessDetails?.companyName, gstin })

      const salesOrderArgs = {
        customerId: contactId,
        referenceNumber: String(orderId),
        date: new Date(order.createdAt || Date.now()).toISOString().slice(0, 10),
        placeOfSupply: customerState?.zohoStateCode,
        gstTreatment,
        gstNo: gstin,
        lineItems,
      }

      try {
        salesOrder = await createZohoSalesOrder(salesOrderArgs)
      } catch (err) {
        if (!isInactiveZohoCustomerError(err)) throw err
        await markZohoContactActive(contactId)
        salesOrder = await createZohoSalesOrder(salesOrderArgs)
      }

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
 * Lightweight invoice refresh for customer/admin views. This never creates a
 * sales order or converts one; it only pulls back an invoice that already
 * exists in Zoho Books after staff accepted it there manually.
 */
export async function refreshZohoInvoiceForOrder(
  payload: Payload,
  orderId: number | string,
): Promise<void> {
  if (!zohoIsConfigured) return

  try {
    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 0,
      overrideAccess: true,
    })

    if (!order?.zohoSalesOrderId || order.zohoInvoiceId) return

    const salesOrder = await getZohoSalesOrder(order.zohoSalesOrderId)

    await payload.update({
      collection: 'orders',
      id: orderId,
      data: { zohoSalesOrderStatus: salesOrder.status, lastSyncAt: new Date().toISOString() },
      overrideAccess: true,
    })

    if (salesOrder.invoices?.length) {
      await applyLinkedInvoice(payload, orderId, salesOrder)
    }
  } catch (err) {
    payload.logger.error({ msg: 'Failed to refresh Zoho invoice status', err, orderId })
  }
}

export async function refreshZohoCreditNoteForOrder(
  payload: Payload,
  orderId: number | string,
): Promise<void> {
  if (!zohoIsConfigured) return

  try {
    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 0,
      overrideAccess: true,
    })

    if (!order?.zohoInvoiceId || order.zohoCreditNoteId) return
    if (order.status !== 'cancelled' && order.status !== 'refunded') return

    const creditNote = await findCreditNoteForInvoice(order.zohoInvoiceId)
    if (!creditNote) return

    await payload.update({
      collection: 'orders',
      id: orderId,
      data: {
        zohoCreditNoteId: creditNote.creditnote_id,
        zohoCreditNoteNumber: creditNote.creditnote_number,
        zohoCreditNoteStatus: creditNote.status,
        zohoCreditNoteAmount: typeof creditNote.total === 'number' ? creditNote.total : undefined,
        zohoCreditNoteUrl: getCreditNoteUrl(creditNote),
        zohoCreditNoteCreatedAt: new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
      },
      overrideAccess: true,
    })
  } catch (err) {
    payload.logger.error({ msg: 'Failed to refresh Zoho credit note status', err, orderId })
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
