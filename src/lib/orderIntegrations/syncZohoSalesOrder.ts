import type { Payload } from 'payload'
import { sql } from '@payloadcms/db-postgres'

import { restoreInventoryForOrderItems } from '@/lib/inventory'
import { zohoIsConfigured } from '@/lib/zoho/auth'
import {
  findOrCreateZohoCustomer,
  getZohoGstTreatment,
  getZohoIdentityKey,
  markZohoContactActive,
} from '@/lib/zoho/customers'
import { findOrCreateZohoItem } from '@/lib/zoho/items'
import { getZohoOrganizationState } from '@/lib/zoho/organization'
import { resolveTaxId } from '@/lib/zoho/taxes'
import { getInvoicePdfUrl, getZohoInvoice } from '@/lib/zoho/invoices'
import { recordPaymentIfNeeded } from './syncZohoInvoice'
import { findCreditNoteForInvoice, getCreditNoteUrl } from '@/lib/zoho/creditNotes'
import {
  convertSalesOrderToInvoice,
  createZohoSalesOrder,
  findExistingSalesOrderByOrderId,
  formatEcomReferenceNumber,
  getZohoSalesOrder,
  updateZohoSalesOrderLineItems,
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

// Zoho rejects any address subfield over 100 characters ("Please ensure
// that the "billing_address" has less than 100 characters") — confirmed
// live once this app started sending the order's own address instead of
// relying on whatever was already on the contact. The checkout form has no
// character limit on addressLine1, so a long single-line address (common
// with "near <landmark>" style entries) can exceed it. Truncating outright
// would silently drop real street-address detail that could affect
// delivery, so overflow past 100 chars spills into `street2` (prepended to
// whatever addressLine2 already had) instead of being discarded.
const ZOHO_ADDRESS_LINE_MAX = 100

// Addresses store the checkout form's ISO 3166-1 alpha-2 country code (e.g.
// "IN"), never a name — so `address.country || 'India'` below could never
// actually fall through to the name; it always sent the bare code, which
// Zoho doesn't recognize as a country and rejects with a misleading "less
// than 100 characters" error (confirmed live: a short, valid address still
// failed with that exact message once addressLine1 truncation stopped being
// the cause). Same code list as the checkout form's country select
// (@payloadcms/plugin-ecommerce's defaultCountries) — mirrored here rather
// than imported since that export lives under the plugin's client bundle.
const COUNTRY_CODE_TO_NAME: Record<string, string> = {
  AT: 'Austria', AU: 'Australia', BE: 'Belgium', BG: 'Bulgaria', BR: 'Brazil',
  CA: 'Canada', CH: 'Switzerland', CY: 'Cyprus', CZ: 'Czech Republic', DE: 'Germany',
  DK: 'Denmark', EE: 'Estonia', ES: 'Spain', FI: 'Finland', FR: 'France',
  GB: 'United Kingdom', GR: 'Greece', HK: 'Hong Kong', HU: 'Hungary', IE: 'Ireland',
  IN: 'India', IT: 'Italy', JP: 'Japan', LT: 'Lithuania', LU: 'Luxembourg',
  LV: 'Latvia', MT: 'Malta', MX: 'Mexico', MY: 'Malaysia', NL: 'Netherlands',
  NO: 'Norway', NZ: 'New Zealand', PL: 'Poland', PT: 'Portugal', RO: 'Romania',
  SE: 'Sweden', SG: 'Singapore', SI: 'Slovenia', SK: 'Slovakia', US: 'United States',
}

const toCountryName = (country?: string | null): string => {
  if (!country) return 'India'
  return COUNTRY_CODE_TO_NAME[country.toUpperCase()] || country
}

// Confirmed live by extensive testing directly against Zoho's /salesorders
// API (bisecting field-by-field, repeated to rule out a fluke): a Sales
// Order's own billing/shipping address throws {"code":15,"message":"...
// billing_address... less than 100 characters"} — a mislabeled error not
// actually about 100 characters — whenever more than 4 address fields are
// populated together and `address` (line 1) is more than ~12 characters. A
// Contact's billing_address has no such limit (confirmed separately — the
// identical full payload saves there without issue). Rather than fight that
// (dropping fields on Sales Orders loses real address detail either way),
// Sales Orders are no longer sent an address at all — see
// syncZohoSalesOrderForOrderUnguarded, which omits billingAddress/
// shippingAddress from salesOrderArgs entirely and lets Zoho inherit it from
// the Contact. That's safe now that each billing identity (Individual /
// Unregistered / Registered Business+GSTIN, see getZohoIdentityKey) gets its
// own dedicated Contact that's never shared across identities — so the
// Contact's address is always accurate for whichever identity placed this
// order. This function is still used to build the Contact's own address,
// which has no length bug to work around.
export const toZohoAddress = (address: AddressLike, state?: IndianState): ZohoAddress | undefined => {
  if (!address) return undefined

  const line1 = address.addressLine1 || ''
  const overflow = line1.length > ZOHO_ADDRESS_LINE_MAX ? line1.slice(ZOHO_ADDRESS_LINE_MAX) : ''
  const street2 = [overflow, address.addressLine2].filter(Boolean).join(', ').slice(0, ZOHO_ADDRESS_LINE_MAX)

  const zohoAddress: ZohoAddress = {
    attention: `${address.firstName || ''} ${address.lastName || ''}`.trim().slice(0, ZOHO_ADDRESS_LINE_MAX) || undefined,
    address: line1.slice(0, ZOHO_ADDRESS_LINE_MAX),
    street2: street2 || undefined,
    city: (address.city || '').slice(0, ZOHO_ADDRESS_LINE_MAX),
    state: (state?.name || address.state || '').slice(0, ZOHO_ADDRESS_LINE_MAX),
    state_code: state?.zohoStateCode,
    zip: address.postalCode || '',
    country: toCountryName(address.country),
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

    // The Zoho item's description is never the full multi-paragraph spec
    // content — that made both the item record and every invoice line item
    // referencing it unreadable (confirmed live: a single cable's
    // description ran to a dozen lines of connector/impedance/frequency
    // specs, repeated on every invoice). When brand + SKU are both
    // available, a short two-line "SKU: … / Brand: …" is sent instead;
    // otherwise the description is left blank entirely — the product's own
    // richText description is never used here.
    let shortDescription: string | undefined
    if (product?.sku && product?.brand) {
      const brandTitle =
        typeof product.brand === 'object' && product.brand
          ? product.brand.title
          : (
              await payload
                .findByID({ collection: 'brands', id: product.brand, depth: 0, overrideAccess: true })
                .catch(() => undefined)
            )?.title
      if (brandTitle) {
        shortDescription = `SKU: ${product.sku}\nBrand: ${brandTitle}`
      }
    }

    let itemId: string | undefined
    try {
      const result = await findOrCreateZohoItem({
        zohoItemId: product?.zohoItemId || undefined,
        name: product?.title || 'Product',
        sku: product?.sku || undefined,
        // Explicit '' (not undefined) when there's no brand/SKU to build the
        // short form from — an explicit empty string is what actually
        // clears an existing item's description; omitting the field
        // entirely would leave a previously-set long description in place.
        description: shortDescription ?? '',
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
  const customerType: 'individual' | 'company' | undefined = order.businessDetails?.customerType || undefined
  const customerName =
    `${billing?.firstName || ''} ${billing?.lastName || ''}`.trim() || order.customerEmail || 'Customer'

  // Account identity, not order details, decides which Zoho contact to
  // reuse — but identity (Individual / Unregistered Business / a specific
  // Registered Business's GSTIN, see getZohoIdentityKey) always wins first:
  // the same account placing an order as themselves and another on behalf
  // of a registered company gets two separate Zoho contacts, never one
  // shared/overwritten record. zohoContacts (order fetched at depth: 1, so
  // this is the full customer doc when set) is a list of exactly that —
  // one contact id per identity this account has ordered under — checked
  // here for an entry matching THIS order's identity before falling back to
  // findOrCreateZohoCustomer's own email/GSTIN/phone matching. Only a
  // brand-new identity for this account reaches contact creation, where
  // localCustomerId makes the Display Name collision-proof (see
  // getUniqueDisplayName) instead of an email/phone suffix, which used to
  // let concurrent first orders from the same new account race into two
  // contacts.
  const customer = order.customer && typeof order.customer === 'object' ? order.customer : undefined
  const customerId = customer?.id as string | number | undefined
  const identityKey = getZohoIdentityKey({ customerType, gstin })
  const zohoContacts = (customer?.zohoContacts as { identityKey: string; contactId: string }[] | undefined) ?? []
  const existingContactId = zohoContacts.find((c) => c.identityKey === identityKey)?.contactId

  const { contact } = await findOrCreateZohoCustomer({
    existingContactId,
    localCustomerId: customerId,
    contactName: customerName,
    firstName: billing?.firstName || undefined,
    lastName: billing?.lastName || undefined,
    companyName,
    email: order.customerEmail || undefined,
    phone: billing?.phone || shipping?.phone || undefined,
    gstin,
    customerType,
    billingAddress: toZohoAddress(billing, billingState),
    shippingAddress: toZohoAddress(shipping, shippingState),
  })

  if (customerId && existingContactId !== contact.contact_id) {
    const nextZohoContacts = [
      ...zohoContacts.filter((c) => c.identityKey !== identityKey),
      { identityKey, contactId: contact.contact_id },
    ]
    await payload
      .update({
        collection: 'users',
        id: customerId,
        data: { zohoContacts: nextZohoContacts },
        overrideAccess: true,
        context: { disableRevalidate: true },
      })
      .catch((err) => {
        payload.logger.error({ msg: 'Failed to persist zohoContacts on customer', err, customerId })
      })
  }

  return { contactId: contact.contact_id }
}

/**
 * Compares only the *product* line items (matched by Zoho item_id) between
 * a freshly-built list and what a sales order currently has in Zoho —
 * ignoring the shipping line, which never carries an item_id on either side
 * and would otherwise always look "different" (this app never sets one when
 * building it; Zoho returns an empty string for it). Order-independent and
 * quantity-sensitive: catches an item removed entirely, added, or its
 * quantity changed.
 */
function zohoLineItemsDiffer(local: ZohoLineItem[], remote: ZohoLineItem[]): boolean {
  const toQuantityMap = (items: ZohoLineItem[]) => {
    const map = new Map<string, number>()
    for (const item of items) {
      if (!item.item_id) continue
      map.set(item.item_id, (map.get(item.item_id) ?? 0) + (item.quantity ?? 0))
    }
    return map
  }

  const localMap = toQuantityMap(local)
  const remoteMap = toQuantityMap(remote)
  if (localMap.size !== remoteMap.size) return true

  for (const [itemId, quantity] of localMap) {
    if (remoteMap.get(itemId) !== quantity) return true
  }
  return false
}

/**
 * A sales order's line rates are always rebuilt from the product's CURRENT
 * priceInINR at sync time (see buildZohoLineItems) — there's no per-order
 * price snapshot — so Zoho's own `total` is the freshest number available
 * once a sales order exists, strictly more current than order.amount, which
 * is only ever set once at checkout and otherwise never touched again.
 * Returns an `{ amount }` patch only when they actually differ, so an
 * unrelated retry doesn't churn the field for no reason.
 */
function zohoAmountPatch(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order: any,
  salesOrder: ZohoSalesOrder,
): { amount?: number } {
  const zohoAmountPaise = Math.round((salesOrder.total ?? 0) * 100)
  if (zohoAmountPaise > 0 && zohoAmountPaise !== order.amount) {
    return { amount: zohoAmountPaise }
  }
  return {}
}

function isInactiveZohoCustomerError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return message.includes('"code":3021') || message.toLowerCase().includes('customer is inactive')
}

/**
 * Writes back whatever a Zoho invoice already linked to this sales order
 * looks like — used both right after our own "accept" conversion and when
 * detecting that someone converted the sales order directly in Zoho Books.
 */
async function applyLinkedInvoice(payload: Payload, orderId: number | string, salesOrder: ZohoSalesOrder) {
  const linked = salesOrder.invoices?.[0]
  if (!linked) return

  let invoice = await getZohoInvoice(linked.invoice_id)

  // This app collects 100% of the order total upfront (PayU, or COD on
  // delivery) before an invoice ever exists — so the moment a sales order
  // converts to an invoice (whether via the admin's "Accept" action or
  // detected here after being converted directly in Zoho Books), the money
  // has already been received and the payment should record automatically,
  // not require a separate manual step. Best-effort: a failure here doesn't
  // undo the (already successful) invoice — it just leaves the balance
  // showing until the next sync picks it up again.
  if (invoice.customer_id && (invoice.balance ?? invoice.total) > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order: any = await payload.findByID({ collection: 'orders', id: orderId, depth: 1, overrideAccess: true })
    const paymentRecorded = await recordPaymentIfNeeded({
      payload,
      order,
      customerId: invoice.customer_id,
      invoice,
    })
    if (paymentRecorded) {
      invoice = await getZohoInvoice(invoice.invoice_id).catch(() => invoice)
    }
  }

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

// Guards against two concurrent syncs for the same order creating two Zoho
// Sales Orders — findExistingSalesOrderByOrderId only protects against a
// sync that starts *after* a previous one finished; two overlapping calls
// (confirmed live: the automatic createZohoSalesOrder hook racing the admin
// "Retry" endpoint, order 65 ended up with both SO-00039 and SO-00040 under
// the same reference_number) can both pass that check before either has
// actually created anything. Centralized here, not in the hook, so every
// caller — the hook, the retry endpoint, the resync script — is covered by
// the same guard instead of each needing its own.
//
// This in-memory Set only protects a single process, though — Vercel can run
// multiple concurrent serverless instances for the same order, each with its
// own empty Set (confirmed live: order 70 got two Sales Orders, SO-00046 and
// SO-00047, six seconds apart, from what were evidently two separate
// invocations this guard never saw each other). claimSyncSlot below is the
// cross-process version of the same guard, backing this one up.
const syncsInFlight = new Set<string>()

/**
 * Cross-process mutex substitute via an atomic conditional UPDATE — the
 * database, not process memory, is the only thing every concurrent
 * serverless invocation actually shares. Only the invocation whose UPDATE
 * actually flips the row (i.e. the query returns a row) wins the claim; a
 * concurrent invocation sees 0 rows affected and backs off instead of also
 * creating a Sales Order. The staleness window lets a genuinely stuck
 * "processing" status (e.g. an invocation that crashed mid-sync) be
 * reclaimed by a later attempt rather than wedging every future sync for
 * that order forever.
 */
async function claimSyncSlot(payload: Payload, orderId: number | string): Promise<boolean> {
  const db = (payload.db as unknown as { drizzle: { execute: (query: unknown) => Promise<{ rows?: unknown[] }> } })
    .drizzle
  const result = await db.execute(sql`
    UPDATE orders
    SET sales_order_sync_status = 'processing'
    WHERE id = ${orderId}
      AND (sales_order_sync_status IS DISTINCT FROM 'processing' OR updated_at < now() - interval '3 minutes')
    RETURNING id
  `)
  return (result.rows?.length ?? 0) > 0
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

  const key = String(orderId)
  if (syncsInFlight.has(key)) return
  syncsInFlight.add(key)

  try {
    await syncZohoSalesOrderForOrderUnguarded(payload, orderId)
  } finally {
    syncsInFlight.delete(key)
  }
}

async function syncZohoSalesOrderForOrderUnguarded(payload: Payload, orderId: number | string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let order: any
  try {
    order = await payload.findByID({ collection: 'orders', id: orderId, depth: 1, overrideAccess: true })
  } catch (err) {
    payload.logger.error({ msg: 'syncZohoSalesOrderForOrder: order not found', err, orderId })
    return
  }

  if (!order || order.status === 'cancelled') return

  const claimed = await claimSyncSlot(payload, orderId)
  if (!claimed) {
    payload.logger.info({ msg: 'Zoho sales order sync already in progress elsewhere, skipping', orderId })
    return
  }

  try {
    // Idempotency guard — checks Zoho directly, not just our local flag, so
    // a retried hook or manual retry never produces a duplicate sales order.
    // amount is stored in paise (matches priceInINR elsewhere); Zoho's own
    // total is in rupees.
    let salesOrder = await findExistingSalesOrderByOrderId(
      orderId,
      (order.amount ?? 0) / 100,
      order.zohoSalesOrderId || undefined,
    )

    const siteSettings = await payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true })
    const defaultGstPercent = siteSettings?.taxSettings?.gstRatePercent ?? 18

    const billing = order.billingAddress?.addressLine1 ? order.billingAddress : order.shippingAddress
    const shipping = order.shippingAddress
    const billingState = resolveIndianState(billing?.state)
    const shippingState = resolveIndianState(shipping?.state)
    const customerState = shippingState || billingState
    // The org's registered state is asked from Zoho itself rather than
    // trusted from Site Settings/env — those go stale the moment the
    // connected Zoho org changes (confirmed live: a leftover
    // ZOHO_BUSINESS_STATE from a previous org caused every sales order to
    // get the intra/inter-state tax backwards and be rejected either way).
    const sellerState = (await getZohoOrganizationState()) || siteSettings?.taxSettings?.businessState
    const taxType = resolveOrderTaxType(sellerState, customerState?.name)

    // Computed unconditionally (not just for a brand-new sales order) so an
    // existing one can be checked for drift below — e.g. an item removed
    // from the order in our own admin after the sales order was already
    // created in Zoho. Only runs on order creation or an explicit admin
    // Retry, never on every order save, so the extra Zoho item/tax lookups
    // this does are not a hot-path cost.
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

    if (!salesOrder) {
      const { contactId } = await resolveCustomerForOrder(payload, order)

      const gstin: string | undefined = order.businessDetails?.gstin || undefined
      const gstTreatment = getZohoGstTreatment({ customerType: order.businessDetails?.customerType, gstin })

      // No billingAddress/shippingAddress here — see toZohoAddress's comment.
      // Zoho inherits the Sales Order's address from the Contact, which is
      // now always correct for this identity.
      const salesOrderArgs = {
        customerId: contactId,
        referenceNumber: formatEcomReferenceNumber(orderId),
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
    } else if (salesOrder.invoices?.length || salesOrder.status === 'void') {
      // Already invoiced (or voided) — line items can no longer be safely
      // rewritten here (a credit note or manual edit in Zoho Books is the
      // correct tool at that point). Just keep status/metadata (and amount,
      // if Zoho's total has since drifted) fresh.
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
          ...zohoAmountPatch(order, salesOrder),
        },
        overrideAccess: true,
      })
    } else if (zohoLineItemsDiffer(lineItems, salesOrder.line_items ?? [])) {
      // The order changed locally (e.g. an item removed in the admin) since
      // this sales order was created — push the corrected line items so
      // Zoho Books matches what this app now considers the order to be.
      salesOrder = await updateZohoSalesOrderLineItems(salesOrder.salesorder_id, lineItems)

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
          // Zoho's own total (built from the line items just pushed above)
          // is authoritative here, not a locally-recomputed one — avoids the
          // two ever disagreeing over rounding or a Zoho-side adjustment.
          ...zohoAmountPatch(order, salesOrder),
        },
        overrideAccess: true,
      })
    } else {
      // Items match, but a retry still re-pulls Zoho's own total — the sales
      // order's line rates are always rebuilt from CURRENT product prices
      // (there's no per-order price snapshot), so a product price change
      // since this sales order was last synced is exactly the kind of drift
      // this catches: order.amount otherwise stays frozen at whatever was
      // charged at checkout forever, even after a manual Retry.
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
          ...zohoAmountPatch(order, salesOrder),
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

export async function refreshZohoCreditNoteForOrder(payload: Payload, orderId: number | string): Promise<void> {
  if (!zohoIsConfigured) return

  const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 0, overrideAccess: true })
  if (!order?.zohoInvoiceId) return

  const creditNote = await findCreditNoteForInvoice(order.zohoInvoiceId)
  if (!creditNote) return

  await payload.update({
    collection: 'orders',
    id: orderId,
    data: {
      zohoCreditNoteId: creditNote.creditnote_id,
      zohoCreditNoteNumber: creditNote.creditnote_number,
      zohoCreditNoteStatus: creditNote.status,
      zohoCreditNoteAmount: creditNote.total,
      zohoCreditNoteUrl: getCreditNoteUrl(creditNote),
      zohoCreditNoteCreatedAt: new Date().toISOString(),
      lastSyncAt: new Date().toISOString(),
    },
    overrideAccess: true,
  })
}
/**
 * Zoho Books never pushes changes to this app — so a sales order voided or
 * edited directly in Zoho Books' UI is invisible here until something
 * actively checks. This is that check, called both when an admin opens the
 * order in the admin panel and right before "Accept" (see
 * acceptZohoSalesOrder below and /api/admin/orders/[id]/check-zoho-status).
 *
 * Two cases:
 *   - The whole sales order was voided: the local order is cancelled, which
 *     restocks every line item via the existing restoreInventoryOnCancellation
 *     afterChange hook, and an auto-approved return request is created so
 *     any payment already collected is refunded the same way an approved
 *     customer return is (PayU auto-refund; COD/gift-card flagged
 *     manual-required — see processReturnRefund).
 *   - Individual line items were removed or had their quantity reduced by
 *     editing the sales order (not voided): only the removed/reduced
 *     quantity is restocked and the local order's items are updated to
 *     match. The order's stated amount/tax is intentionally NOT
 *     recalculated here (that needs re-deriving tax/shipping allocation,
 *     out of scope) — flagged in integrationError.salesOrder as a note for
 *     manual review instead of silently guessing a new total.
 *
 * Idempotent either way: re-running against an already-reconciled order
 * finds nothing left to change and returns { changed: false }.
 */
export async function reconcileOrderWithZohoSalesOrder(
  payload: Payload,
  orderId: number | string,
  salesOrder: ZohoSalesOrder,
): Promise<{ changed: boolean; voided: boolean }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order: any = await payload.findByID({ collection: 'orders', id: orderId, depth: 1, overrideAccess: true })
  if (!order) return { changed: false, voided: false }

  const alreadyTerminal = order.status === 'cancelled' || order.status === 'refunded'

  if (alreadyTerminal) {
    if (order.zohoSalesOrderStatus !== salesOrder.status) {
      await payload.update({
        collection: 'orders',
        id: orderId,
        overrideAccess: true,
        data: { zohoSalesOrderStatus: salesOrder.status },
      })
    }
    return { changed: false, voided: salesOrder.status === 'void' }
  }

  if (salesOrder.status === 'void') {
    await payload.update({
      collection: 'orders',
      id: orderId,
      overrideAccess: true,
      data: { status: 'cancelled', zohoSalesOrderStatus: salesOrder.status },
    })

    await payload
      .create({
        collection: 'return-requests',
        overrideAccess: true,
        data: {
          order: Number(orderId),
          customerEmail: order.customerEmail || 'unknown@picmychip.in',
          reason: 'zoho-void',
          description: `Sales order ${salesOrder.salesorder_number || salesOrder.salesorder_id} was voided in Zoho Books — order auto-cancelled and stock restored.`,
          status: 'approved',
        },
      })
      .catch((err) => {
        payload.logger.error({
          msg: 'Failed to create auto-refund return request for voided Zoho sales order',
          err,
          orderId,
        })
      })

    return { changed: true, voided: true }
  }

  const zohoQuantityByItemId = new Map<string, number>()
  for (const lineItem of salesOrder.line_items ?? []) {
    if (!lineItem.item_id) continue
    zohoQuantityByItemId.set(lineItem.item_id, (zohoQuantityByItemId.get(lineItem.item_id) ?? 0) + (lineItem.quantity ?? 0))
  }

  const restockItems: {
    product?: number | string | { id: number | string } | null
    variant?: number | string | { id: number | string } | null
    quantity: number
  }[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nextItems: any[] = []
  let itemsChanged = false

  for (const item of order.items || []) {
    const product = typeof item.product === 'object' ? item.product : undefined
    const zohoItemId: string | undefined = product?.zohoItemId || undefined
    const oldQuantity = item.quantity ?? 0

    // Never synced to Zoho (no item id) — nothing to reconcile it against.
    if (!zohoItemId) {
      nextItems.push(item)
      continue
    }

    const zohoQuantity = zohoQuantityByItemId.get(zohoItemId) ?? 0
    if (zohoQuantity >= oldQuantity) {
      nextItems.push(item)
      continue
    }

    const delta = oldQuantity - zohoQuantity
    restockItems.push({ product: item.product, variant: item.variant, quantity: delta })
    itemsChanged = true
    if (zohoQuantity > 0) nextItems.push({ ...item, quantity: zohoQuantity })
    // zohoQuantity === 0 → line item was removed entirely from the sales order, drop it locally too.
  }

  if (!itemsChanged) {
    const amountPatch = zohoAmountPatch(order, salesOrder)
    if (order.zohoSalesOrderStatus !== salesOrder.status || Object.keys(amountPatch).length > 0) {
      await payload.update({
        collection: 'orders',
        id: orderId,
        overrideAccess: true,
        data: { zohoSalesOrderStatus: salesOrder.status, ...amountPatch },
      })
    }
    return { changed: false, voided: false }
  }

  await restoreInventoryForOrderItems(payload, restockItems)

  await payload.update({
    collection: 'orders',
    id: orderId,
    overrideAccess: true,
    data: {
      // items is included here, which computeGstTaxBreakdown (beforeChange
      // on orders) picks up to recalculate `amount` itself from the reduced
      // item list — see that hook for the details/caveats.
      items: nextItems,
      zohoSalesOrderStatus: salesOrder.status,
      integrationError: {
        ...order.integrationError,
        salesOrder: `Some items were removed or had their quantity reduced in Zoho Books sales order ${salesOrder.salesorder_number || salesOrder.salesorder_id} — updated here to match, restocked, and the order amount recalculated.`,
      },
    },
  })

  return { changed: true, voided: false }
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

    const reconciled = await reconcileOrderWithZohoSalesOrder(payload, orderId, current)
    if (reconciled.voided) {
      throw new Error(
        'This sales order was voided in Zoho Books — the order has been cancelled and stock restored. It cannot be accepted.',
      )
    }

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
