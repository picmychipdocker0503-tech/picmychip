import type { Payload } from 'payload'

import { zohoIsConfigured } from '@/lib/zoho/auth'
import { findOrCreateZohoCustomer } from '@/lib/zoho/customers'
import { resolveTaxId } from '@/lib/zoho/taxes'
import { createZohoInvoice, findExistingInvoiceByOrderId, getInvoicePdfUrl } from '@/lib/zoho/invoices'
import type { ZohoAddress, ZohoLineItem } from '@/lib/zoho/types'
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
      await payload.update({
        collection: 'orders',
        id: orderId,
        data: {
          zohoInvoiceId: existingInvoice.invoice_id,
          zohoInvoiceNumber: existingInvoice.invoice_number,
          zohoInvoiceStatus: existingInvoice.status,
          zohoInvoiceUrl: getInvoicePdfUrl(existingInvoice),
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
      const taxId = await resolveTaxId(gstPercent)
      const rate = ((variant?.priceInINR ?? product?.priceInINR ?? 0) as number) / 100

      lineItems.push({
        name: product?.title || 'Product',
        hsn_or_sac: product?.hsnCode || undefined,
        rate,
        quantity: item.quantity ?? 1,
        tax_id: taxId,
      })
    }

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
      billingAddress: toZohoAddress(billing, billingState),
      shippingAddress: toZohoAddress(shipping, shippingState),
    })

    await payload.update({
      collection: 'orders',
      id: orderId,
      data: {
        zohoCustomerId: contact.contact_id,
        zohoInvoiceId: invoice.invoice_id,
        zohoInvoiceNumber: invoice.invoice_number,
        zohoInvoiceStatus: invoice.status,
        zohoInvoiceUrl: getInvoicePdfUrl(invoice),
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
