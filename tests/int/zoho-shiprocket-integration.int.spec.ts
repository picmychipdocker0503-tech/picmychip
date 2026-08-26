import type { Payload } from 'payload'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { INDIAN_STATES, resolveIndianState } from '@/lib/indianStates'
import { computeOrderTaxAddOn, computeOrderTaxBreakdown } from '@/lib/taxCalculation'
import { findOrCreateZohoCustomer, getZohoDisplayName } from '@/lib/zoho/customers'
import { findExistingInvoiceByOrderId, getInvoicePdfUrl } from '@/lib/zoho/invoices'
import { findOrCreateZohoItem } from '@/lib/zoho/items'
import { recordCustomerPayment } from '@/lib/zoho/payments'
import {
  convertSalesOrderToInvoice,
  createZohoSalesOrder,
  findExistingSalesOrderByOrderId,
} from '@/lib/zoho/salesOrders'
import { resolveTaxId } from '@/lib/zoho/taxes'
import { buildZohoLineItems, resolveOrderTaxType, toZohoAddress } from '@/lib/orderIntegrations/syncZohoSalesOrder'
import { ProductsCollection } from '@/collections/Products'

describe('resolveIndianState', () => {
  it('resolves canonical names case-insensitively and trims whitespace', () => {
    expect(resolveIndianState('karnataka')?.gstCode).toBe('29')
    expect(resolveIndianState('  Maharashtra ')?.zohoStateCode).toBe('MH')
  })

  it('returns undefined for unrecognized or missing input', () => {
    expect(resolveIndianState('Narnia')).toBeUndefined()
    expect(resolveIndianState(undefined)).toBeUndefined()
    expect(resolveIndianState(null)).toBeUndefined()
  })

  it('has a unique GST code per state/UT', () => {
    const gstCodes = new Set(INDIAN_STATES.map((s) => s.gstCode))
    expect(gstCodes.size).toBe(INDIAN_STATES.length)
  })
})

describe('computeOrderTaxBreakdown', () => {
  it('splits CGST+SGST evenly for intra-state orders', () => {
    const result = computeOrderTaxBreakdown({
      items: [{ gstPercent: 18, nominal: 11800 }],
      amount: 11800,
      defaultGstPercent: 18,
      businessState: 'Karnataka',
      customerState: 'Karnataka',
    })

    expect(result.taxType).toBe('intra-state')
    expect(result.taxableValue).toBeCloseTo(10000, 0)
    expect(result.cgstAmount).toBeCloseTo(900, 0)
    expect(result.sgstAmount).toBeCloseTo(900, 0)
    expect(result.igstAmount).toBe(0)
  })

  it('applies IGST for inter-state orders', () => {
    const result = computeOrderTaxBreakdown({
      items: [{ gstPercent: 18, nominal: 11800 }],
      amount: 11800,
      defaultGstPercent: 18,
      businessState: 'Karnataka',
      customerState: 'Maharashtra',
    })

    expect(result.taxType).toBe('inter-state')
    expect(result.cgstAmount).toBe(0)
    expect(result.sgstAmount).toBe(0)
    expect(result.igstAmount).toBeCloseTo(1800, 0)
  })

  it('prorates per-item tax against a discounted charged amount, not the nominal total', () => {
    // Two ₹100 items at different GST rates, but only ₹150 was actually charged (25% off).
    const result = computeOrderTaxBreakdown({
      items: [
        { gstPercent: 18, nominal: 100 },
        { gstPercent: 28, nominal: 100 },
      ],
      amount: 150,
      defaultGstPercent: 18,
      businessState: 'Karnataka',
      customerState: 'Karnataka',
    })

    // Taxable value + tax must reconstruct the actual charged amount, not the ₹200 nominal total.
    expect(result.taxableValue + result.totalTax).toBeCloseTo(150, 5)
  })

  it('falls back to a single blended rate when there are no resolvable line items', () => {
    const result = computeOrderTaxBreakdown({
      items: [],
      amount: 11800,
      defaultGstPercent: 18,
      businessState: 'Karnataka',
      customerState: 'Karnataka',
    })

    expect(result.gstRatePercent).toBe(18)
    expect(result.taxableValue).toBeCloseTo(10000, 0)
  })

  it('treats an unrecognized state as inter-state rather than guessing', () => {
    const result = computeOrderTaxBreakdown({
      items: [{ gstPercent: 18, nominal: 11800 }],
      amount: 11800,
      defaultGstPercent: 18,
      businessState: 'Karnataka',
      customerState: 'Somewhere Else',
    })

    expect(result.taxType).toBe('inter-state')
  })
})

describe('computeOrderTaxAddOn', () => {
  it('splits CGST+SGST evenly for intra-state orders, adding tax on top of the base', () => {
    const result = computeOrderTaxAddOn({
      items: [{ gstPercent: 18, nominal: 10000 }],
      amount: 10000,
      defaultGstPercent: 18,
      businessState: 'Karnataka',
      customerState: 'Karnataka',
    })

    expect(result.taxType).toBe('intra-state')
    expect(result.taxableValue).toBeCloseTo(10000, 5)
    expect(result.cgstAmount).toBeCloseTo(900, 5)
    expect(result.sgstAmount).toBeCloseTo(900, 5)
    expect(result.igstAmount).toBe(0)
    expect(result.totalTax).toBeCloseTo(1800, 5)
  })

  it('applies IGST for inter-state orders', () => {
    const result = computeOrderTaxAddOn({
      items: [{ gstPercent: 18, nominal: 10000 }],
      amount: 10000,
      defaultGstPercent: 18,
      businessState: 'Karnataka',
      customerState: 'Maharashtra',
    })

    expect(result.taxType).toBe('inter-state')
    expect(result.cgstAmount).toBe(0)
    expect(result.sgstAmount).toBe(0)
    expect(result.igstAmount).toBeCloseTo(1800, 5)
  })

  it('prorates per-item tax against a discounted base amount, not the nominal total', () => {
    // Two ₹100 items at different GST rates, but only ₹75 base remains after a 25% coupon.
    const result = computeOrderTaxAddOn({
      items: [
        { gstPercent: 18, nominal: 100 },
        { gstPercent: 28, nominal: 100 },
      ],
      amount: 75,
      defaultGstPercent: 18,
      businessState: 'Karnataka',
      customerState: 'Karnataka',
    })

    expect(result.taxableValue).toBeCloseTo(75, 5)
    // Blended rate is the average of 18% and 28%, applied to the discounted base.
    expect(result.totalTax).toBeCloseTo(75 * 0.23, 5)
  })

  it('falls back to a single blended rate when there are no resolvable line items', () => {
    const result = computeOrderTaxAddOn({
      items: [],
      amount: 10000,
      defaultGstPercent: 18,
      businessState: 'Karnataka',
      customerState: 'Karnataka',
    })

    expect(result.gstRatePercent).toBe(18)
    expect(result.taxableValue).toBeCloseTo(10000, 5)
    expect(result.totalTax).toBeCloseTo(1800, 5)
  })

  it('is the exact inverse of computeOrderTaxBreakdown for a single blended rate (matches how the no-line-item fallback behaves in both directions)', () => {
    const baseAmount = 18000
    const gstPercent = 18

    const addOn = computeOrderTaxAddOn({
      items: [],
      amount: baseAmount,
      defaultGstPercent: gstPercent,
      businessState: 'Karnataka',
      customerState: 'Maharashtra',
    })

    const inclusiveAmount = baseAmount + addOn.totalTax

    const decomposed = computeOrderTaxBreakdown({
      items: [],
      amount: inclusiveAmount,
      defaultGstPercent: gstPercent,
      businessState: 'Karnataka',
      customerState: 'Maharashtra',
    })

    // Single blended rate is the only case where add-then-decompose round-trips exactly —
    // with multiple differing per-item rates, decomposing an inclusive total via
    // nominal-weighted proration does NOT reconstruct the same split (each rate's true
    // share of the inclusive total differs from its share of the pre-tax base). This is
    // why computeGstTaxBreakdown.ts recomputes with computeOrderTaxAddOn against the
    // reconstructed discounted base, rather than decomposing doc.amount.
    expect(decomposed.taxableValue).toBeCloseTo(baseAmount, 5)
    expect(decomposed.totalTax).toBeCloseTo(addOn.totalTax, 5)
    expect(decomposed.igstAmount).toBeCloseTo(addOn.igstAmount, 5)
  })
})

const jsonResponse = (body: unknown, ok = true) =>
  ({
    ok,
    status: ok ? 200 : 400,
    json: async () => body,
  }) as Response

describe('Zoho Books API integration (mocked fetch)', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.ZOHO_CLIENT_ID = 'test-client-id'
    process.env.ZOHO_CLIENT_SECRET = 'test-client-secret'
    process.env.ZOHO_REFRESH_TOKEN = 'test-refresh-token'
    process.env.ZOHO_ORGANIZATION_ID = 'test-org-id'
    delete process.env.ZOHO_TAX_ID_MAP
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    process.env = { ...originalEnv }
  })

  it('resolves the correct tax_id for intra- vs inter-state — a rate can have two entries in Zoho', async () => {
    // Mirrors a real Zoho Books org: "GST18" is a tax_group (CGST+SGST) for
    // intra-state, "IGST18" is a separate tax with tax_specific_type 'igst'
    // for inter-state. Picking the wrong one gets the invoice rejected by
    // Zoho with "IGST has to be applied as this is an interstate transaction".
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/oauth/v2/token')) return jsonResponse({ access_token: 'token', expires_in: 3600 })
        if (url.includes('/settings/taxes')) {
          return jsonResponse({
            code: 0,
            taxes: [
              { tax_id: 'sgst-tax', tax_name: 'GST', tax_percentage: 2.5, tax_type: 'tax', tax_specific_type: 'sgst' },
              { tax_id: 'gst18-group', tax_name: 'GST18', tax_percentage: 18, tax_type: 'tax_group' },
              { tax_id: 'igst18-tax', tax_name: 'IGST18', tax_percentage: 18, tax_type: 'tax', tax_specific_type: 'igst' },
              { tax_id: 'igst5-tax', tax_name: 'IGST5', tax_percentage: 5, tax_type: 'tax', tax_specific_type: 'igst' },
            ],
          })
        }
        throw new Error(`Unexpected fetch: ${url}`)
      }),
    )

    await expect(resolveTaxId(18, 'intra-state')).resolves.toBe('gst18-group')
    await expect(resolveTaxId(18, 'inter-state')).resolves.toBe('igst18-tax')
    await expect(resolveTaxId(5, 'inter-state')).resolves.toBe('igst5-tax')
    await expect(resolveTaxId(28, 'intra-state')).resolves.toBeUndefined()
  })

  it('ZOHO_TAX_ID_MAP overrides auto-detection without hitting the network', async () => {
    process.env.ZOHO_TAX_ID_MAP = JSON.stringify({ '18-inter': 'manual-override-id' })
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    await expect(resolveTaxId(18, 'inter-state')).resolves.toBe('manual-override-id')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('findExistingInvoiceByOrderId is the idempotency guard — finds an invoice already created for this order', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/oauth/v2/token')) return jsonResponse({ access_token: 'token', expires_in: 3600 })
        if (url.includes('reference_number=42')) {
          return jsonResponse({
            code: 0,
            invoices: [{ invoice_id: 'inv-1', invoice_number: 'INV-000001', status: 'sent', total: 118 }],
          })
        }
        // Full-detail fetch — the list response above is abbreviated and
        // lacks fields (customer_id, balance) that payment recording needs.
        if (url.includes('/invoices/inv-1')) {
          return jsonResponse({
            code: 0,
            invoice: {
              invoice_id: 'inv-1',
              invoice_number: 'INV-000001',
              status: 'sent',
              total: 118,
              balance: 118,
              customer_id: 'contact-1',
            },
          })
        }
        if (url.includes('reference_number=999')) {
          return jsonResponse({ code: 0, invoices: [] })
        }
        throw new Error(`Unexpected fetch: ${url}`)
      }),
    )

    await expect(findExistingInvoiceByOrderId(42)).resolves.toMatchObject({ invoice_id: 'inv-1', balance: 118 })
    await expect(findExistingInvoiceByOrderId(999)).resolves.toBeUndefined()
  })

  it('requests the Zoho Books API path with organization_id as a query param, not a header', async () => {
    const calledUrls: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        calledUrls.push(url)
        if (url.includes('/oauth/v2/token')) return jsonResponse({ access_token: 'token', expires_in: 3600 })
        return jsonResponse({ code: 0, invoices: [] })
      }),
    )

    await findExistingInvoiceByOrderId(7)

    const apiCallUrl = calledUrls.find((url) => url.includes('/invoices'))
    expect(apiCallUrl).toContain('/books/v3/invoices')
    expect(apiCallUrl).toContain('organization_id=test-org-id')
  })

  it('getInvoicePdfUrl prefers Zoho-provided invoice_url, falls back to a deep link', () => {
    expect(
      getInvoicePdfUrl({
        invoice_id: '1',
        invoice_number: 'INV-1',
        status: 'sent',
        total: 100,
        invoice_url: 'https://example.com/inv',
      }),
    ).toBe('https://example.com/inv')

    expect(getInvoicePdfUrl({ invoice_id: '123', invoice_number: 'INV-1', status: 'sent', total: 100 })).toContain(
      '123',
    )
  })

  it('records a customer payment into a bank account resolved by exact account name', async () => {
    let postedBody: Record<string, unknown> | undefined

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes('/oauth/v2/token')) return jsonResponse({ access_token: 'token', expires_in: 3600 })
        if (url.includes('/chartofaccounts')) {
          return jsonResponse({
            code: 0,
            chartofaccounts: [
              { account_id: 'cash-1', account_name: 'Cash', account_type: 'cash', is_active: true },
              { account_id: 'sbi-bkc-id', account_name: 'SBI-BKC', account_type: 'bank', is_active: true },
            ],
          })
        }
        if (url.includes('/customerpayments')) {
          postedBody = JSON.parse(String(init?.body))
          return jsonResponse({ code: 0, payment: { payment_id: 'payment-1' } })
        }
        throw new Error(`Unexpected fetch: ${url}`)
      }),
    )

    await recordCustomerPayment({
      customerId: 'contact-1',
      invoiceId: 'inv-1',
      amount: 5,
      date: '2026-08-13',
      referenceNumber: 'payu-ref',
      paymentMode: 'PAYU',
      accountName: 'SBI-BKC',
    })

    expect(postedBody).toMatchObject({
      account_id: 'sbi-bkc-id',
      payment_mode: 'PAYU',
      reference_number: 'payu-ref',
    })
  })

  it('resolveOrderTaxType mirrors computeOrderTaxBreakdown\'s intra/inter-state logic', () => {
    expect(resolveOrderTaxType('Karnataka', 'Karnataka')).toBe('intra-state')
    expect(resolveOrderTaxType('Karnataka', 'Maharashtra')).toBe('inter-state')
    expect(resolveOrderTaxType('Karnataka', 'Somewhere Else')).toBe('inter-state')
  })

  it('createZohoSalesOrder posts to /salesorders with the given line items', async () => {
    let postedBody: Record<string, unknown> | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes('/oauth/v2/token')) return jsonResponse({ access_token: 'token', expires_in: 3600 })
        if (url.includes('/salesorders')) {
          postedBody = JSON.parse(String(init?.body))
          return jsonResponse({
            code: 0,
            salesorder: { salesorder_id: 'so-1', salesorder_number: 'SO-00001', status: 'draft', total: 100 },
          })
        }
        throw new Error(`Unexpected fetch: ${url}`)
      }),
    )

    const result = await createZohoSalesOrder({
      customerId: 'contact-1',
      referenceNumber: '42',
      date: '2026-08-14',
      lineItems: [{ name: '1KΩ Resistor', hsn_or_sac: '8533', rate: 4.24, quantity: 10 }],
    })

    expect(result.salesorder_id).toBe('so-1')
    expect(postedBody).toMatchObject({ reference_number: '42' })
    expect((postedBody?.line_items as unknown[])[0]).toMatchObject({ hsn_or_sac: '8533' })
  })

  it('convertSalesOrderToInvoice posts to /invoices/fromsalesorder with the sales order id', async () => {
    const calledUrls: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        calledUrls.push(url)
        if (url.includes('/oauth/v2/token')) return jsonResponse({ access_token: 'token', expires_in: 3600 })
        return jsonResponse({
          code: 0,
          invoice: { invoice_id: 'inv-9', invoice_number: 'INV-000009', status: 'draft', total: 100 },
        })
      }),
    )

    const invoice = await convertSalesOrderToInvoice('so-1')

    expect(invoice.invoice_id).toBe('inv-9')
    const callUrl = calledUrls.find((url) => url.includes('/invoices/fromsalesorder'))
    expect(callUrl).toContain('salesorder_id=so-1')
  })

  it('findExistingSalesOrderByOrderId is the idempotency guard, including any already-linked invoices', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/oauth/v2/token')) return jsonResponse({ access_token: 'token', expires_in: 3600 })
        if (url.includes('reference_number=42')) {
          return jsonResponse({
            code: 0,
            salesorders: [{ salesorder_id: 'so-1', salesorder_number: 'SO-00001', reference_number: '42' }],
          })
        }
        if (url.includes('/salesorders/so-1')) {
          return jsonResponse({
            code: 0,
            salesorder: {
              salesorder_id: 'so-1',
              salesorder_number: 'SO-00001',
              reference_number: '42',
              status: 'invoiced',
              invoiced_status: 'invoiced',
              total: 100,
              invoices: [{ invoice_id: 'inv-9', invoice_number: 'INV-000009', status: 'draft', total: 100, balance: 100 }],
            },
          })
        }
        if (url.includes('reference_number=999')) {
          return jsonResponse({ code: 0, salesorders: [] })
        }
        throw new Error(`Unexpected fetch: ${url}`)
      }),
    )

    const found = await findExistingSalesOrderByOrderId(42, 100)
    expect(found?.invoices?.[0]?.invoice_id).toBe('inv-9')
    await expect(findExistingSalesOrderByOrderId(999, 100)).resolves.toBeUndefined()
  })

  it('findExistingSalesOrderByOrderId rejects a reference_number match whose total belongs to a different sale', async () => {
    // Confirmed live: orders 77/78 got linked to an unrelated sales order
    // ("sri sakthi industries") that simply happened to share a
    // reference_number with our own order id in the same Zoho org — trusting
    // reference_number alone silently adopted someone else's sale instead of
    // ever creating the real one.
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/oauth/v2/token')) return jsonResponse({ access_token: 'token', expires_in: 3600 })
        if (url.includes('reference_number=77')) {
          return jsonResponse({
            code: 0,
            salesorders: [{ salesorder_id: 'so-collision', salesorder_number: 'SO-00053', reference_number: '77' }],
          })
        }
        if (url.includes('/salesorders/so-collision')) {
          return jsonResponse({
            code: 0,
            salesorder: {
              salesorder_id: 'so-collision',
              salesorder_number: 'SO-00053',
              reference_number: '77',
              status: 'invoiced',
              invoiced_status: 'invoiced',
              total: 11.8,
            },
          })
        }
        throw new Error(`Unexpected fetch: ${url}`)
      }),
    )

    await expect(findExistingSalesOrderByOrderId(77, 499.5)).resolves.toBeUndefined()
  })

  it('Products.defaultPopulate includes every field the Zoho sales-order sync reads off a relationship-populated product', async () => {
    // Confirmed live: order.items[].product is populated via relationship depth
    // (not an explicit select), which uses defaultPopulate — a field missing here
    // silently comes back undefined even though the product has it set. This bit
    // hsnCode (Zoho items were created with blank HSN) and would silently bite
    // zohoItemId/gstPercent/sku/description the same way if ever dropped again.
    const config = await ProductsCollection({ defaultCollection: { fields: [] } } as never)
    const populate = config.defaultPopulate as Record<string, unknown>
    for (const field of ['hsnCode', 'zohoItemId', 'gstPercent', 'sku', 'priceInINR', 'description']) {
      expect(populate).toHaveProperty(field, true)
    }
  })

  it('toZohoAddress never includes an email field', () => {
    const address = toZohoAddress({
      firstName: 'Jane',
      lastName: 'Doe',
      addressLine1: '123 Main St',
      city: 'Chennai',
      state: 'Tamil Nadu',
      postalCode: '600001',
      country: 'India',
      phone: '9876543210',
    } as never)

    expect(address).toBeDefined()
    expect(address).not.toHaveProperty('email')
    expect(JSON.stringify(address)).not.toContain('@')
  })

  it('findOrCreateZohoItem reuses an existing item found by SKU — no POST /items call', async () => {
    const posted: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes('/oauth/v2/token')) return jsonResponse({ access_token: 'token', expires_in: 3600 })
        if (url.includes('/items?sku=RES-100')) {
          // Already fully up to date (matching hsn_or_sac/rate) — itemNeedsUpdate must not fire.
          return jsonResponse({
            code: 0,
            items: [{ item_id: 'item-1', name: '100 Ohm Resistor', sku: 'RES-100', rate: 5, hsn_or_sac: '8533' }],
          })
        }
        if (url.includes('/items') && init?.method === 'POST') posted.push(url)
        throw new Error(`Unexpected fetch: ${url}`)
      }),
    )

    const result = await findOrCreateZohoItem({
      name: '100 Ohm Resistor',
      sku: 'RES-100',
      hsnCode: '8533',
      taxId: 'gst18-group',
      rate: 5,
    })

    expect(result).toEqual({ itemId: 'item-1', wasCreated: false })
    expect(posted).toHaveLength(0)
  })

  it('findOrCreateZohoItem creates a missing item with the product HSN and tax rate, and returns the new item_id', async () => {
    let postedBody: Record<string, unknown> | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes('/oauth/v2/token')) return jsonResponse({ access_token: 'token', expires_in: 3600 })
        if (init?.method === 'POST' && url.includes('/items')) {
          const body = JSON.parse(init.body as string)
          postedBody = body
          return jsonResponse({ code: 0, item: { item_id: 'item-new', name: body.name, rate: body.rate } })
        }
        if (url.includes('/items?')) return jsonResponse({ code: 0, items: [] })
        throw new Error(`Unexpected fetch: ${url}`)
      }),
    )

    const result = await findOrCreateZohoItem({
      name: 'Hand Crimper Tool Rectangular Contacts',
      sku: 'CRIMP-1001',
      hsnCode: '82032000',
      taxId: 'gst18-group',
      rate: 250,
    })

    expect(result).toEqual({ itemId: 'item-new', wasCreated: true })
    expect(postedBody).toMatchObject({
      name: 'Hand Crimper Tool Rectangular Contacts',
      sku: 'CRIMP-1001',
      hsn_or_sac: '82032000',
      tax_id: 'gst18-group',
      rate: 250,
    })
  })

  it('findOrCreateZohoItem patches a found item that is missing HSN — reuse must not perpetuate stale/incomplete data', async () => {
    // Confirmed live: items created before a product's HSN was populated (or via
    // Products.defaultPopulate missing hsnCode when order.items[].product was
    // relationship-populated) stayed HSN-blank forever, since the original version
    // of this function only ever set fields on brand-new items, never on a found one.
    const putBodies: Record<string, unknown>[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes('/oauth/v2/token')) return jsonResponse({ access_token: 'token', expires_in: 3600 })
        if (url.includes('/items?sku=')) {
          return jsonResponse({ code: 0, items: [{ item_id: 'item-stale', name: 'Widget', sku: 'W-1', rate: 10, hsn_or_sac: '' }] })
        }
        if (init?.method === 'PUT' && url.includes('/items/item-stale')) {
          putBodies.push(JSON.parse(init.body as string))
          return jsonResponse({ code: 0, item: { item_id: 'item-stale', name: 'Widget', sku: 'W-1', rate: 10, hsn_or_sac: '8536' } })
        }
        throw new Error(`Unexpected fetch: ${url}`)
      }),
    )

    const result = await findOrCreateZohoItem({ name: 'Widget', sku: 'W-1', hsnCode: '8536', rate: 10 })

    expect(result).toEqual({ itemId: 'item-stale', wasCreated: false })
    expect(putBodies).toHaveLength(1)
    expect(putBodies[0]).toMatchObject({ hsn_or_sac: '8536' })
  })

  it('findOrCreateZohoItem leaves an up-to-date item alone — no wasted PUT on every call', async () => {
    let putCount = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes('/oauth/v2/token')) return jsonResponse({ access_token: 'token', expires_in: 3600 })
        if (url.includes('/items?sku=')) {
          return jsonResponse({ code: 0, items: [{ item_id: 'item-ok', name: 'Widget', sku: 'W-2', rate: 10, hsn_or_sac: '8536' }] })
        }
        if (init?.method === 'PUT') putCount++
        throw new Error(`Unexpected fetch: ${url}`)
      }),
    )

    const result = await findOrCreateZohoItem({ name: 'Widget', sku: 'W-2', hsnCode: '8536', rate: 10 })

    expect(result).toEqual({ itemId: 'item-ok', wasCreated: false })
    expect(putCount).toBe(0)
  })

  it('findOrCreateZohoItem recovers from a creation failure by re-searching, rather than creating a duplicate', async () => {
    let searchCount = 0
    let postCount = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes('/oauth/v2/token')) return jsonResponse({ access_token: 'token', expires_in: 3600 })
        if (url.includes('/items') && init?.method === 'POST') {
          postCount++
          return jsonResponse({ code: 1, message: 'An item with this name already exists.' }, false)
        }
        if (url.includes('/items?')) {
          searchCount++
          // First search (before create) finds nothing; second search (the
          // recovery path, after the failed create) finds what a concurrent
          // request must have just created.
          return searchCount === 1
            ? jsonResponse({ code: 0, items: [] })
            : jsonResponse({ code: 0, items: [{ item_id: 'item-race', name: 'Widget', rate: 10 }] })
        }
        throw new Error(`Unexpected fetch: ${url}`)
      }),
    )

    const result = await findOrCreateZohoItem({ name: 'Widget', rate: 10 })

    expect(result).toEqual({ itemId: 'item-race', wasCreated: false })
    expect(postCount).toBe(1)
  })

  it('buildZohoLineItems throws — before touching the Zoho Items API — when a taxable product has no matching Zoho tax', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/oauth/v2/token')) return jsonResponse({ access_token: 'token', expires_in: 3600 })
        // 33% deliberately doesn't match any rate mocked by other tests in this file —
        // resolveTaxId's cache is module-level and persists across tests, so an "empty
        // taxes" response here wouldn't reliably override a rate another test already
        // cached, but no test configures a 33% tax either way.
        if (url.includes('/settings/taxes')) return jsonResponse({ code: 0, taxes: [] })
        throw new Error(`Unexpected fetch: ${url}`)
      }),
    )

    const fakePayload = { logger: { error: vi.fn() } } as unknown as Payload
    const order = {
      items: [{ product: { id: 1, title: 'Widget', gstPercent: 33, priceInINR: 1000, hsnCode: '1234' }, quantity: 1 }],
    }

    await expect(buildZohoLineItems(fakePayload, order, 'intra-state', 33)).rejects.toThrow(
      /No Zoho tax configuration found for 33%/,
    )
  })

  it('buildZohoLineItems allows a genuinely 0% GST product through with no error, and no tax_id if none is configured', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes('/oauth/v2/token')) return jsonResponse({ access_token: 'token', expires_in: 3600 })
        if (url.includes('/settings/taxes')) return jsonResponse({ code: 0, taxes: [] })
        if (init?.method === 'POST' && url.includes('/items')) {
          return jsonResponse({ code: 0, item: { item_id: 'item-zero', name: 'Exempt Widget', rate: 10 } })
        }
        if (url.includes('/items?')) return jsonResponse({ code: 0, items: [] })
        throw new Error(`Unexpected fetch: ${url}`)
      }),
    )

    const fakePayload = { logger: { error: vi.fn() }, update: vi.fn() } as unknown as Payload
    const order = {
      items: [{ product: { id: 2, title: 'Exempt Widget', gstPercent: 0, priceInINR: 1000, hsnCode: '9999' }, quantity: 1 }],
    }

    const lineItems = await buildZohoLineItems(fakePayload, order, 'intra-state', 18)
    expect(lineItems).toHaveLength(1)
    expect(lineItems[0].tax_id).toBeUndefined()
    expect(lineItems[0].item_id).toBe('item-zero')
  })

  it('findOrCreateZohoCustomer treats an email-matched contact with a conflicting GSTIN as a different billing identity', async () => {
    // Simulates the live bug: one login email, two distinct billing
    // identities — a business address (with a GSTIN, already on file in
    // Zoho under this email) and a personal address (no GSTIN). The
    // personal order must NOT reuse/mutate the business contact.
    const putBodies: Record<string, unknown>[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes('/oauth/v2/token')) return jsonResponse({ access_token: 'token', expires_in: 3600 })
        if (url.includes('/contacts?email=')) {
          return jsonResponse({
            code: 0,
            contacts: [
              {
                contact_id: 'contact-business',
                contact_name: 'Praveen kumar.D',
                company_name: 'sri sakthi industries',
                gst_no: '33ABPFS7872Q1Z1',
              },
            ],
          })
        }
        if (url.includes('/contacts?search_text=')) {
          return jsonResponse({ code: 0, contacts: [] }) // no other contact matches by GSTIN/phone
        }
        if (url.includes('/contacts') && init?.method === 'POST') {
          const body = JSON.parse(init.body as string)
          return jsonResponse({ code: 0, contact: { contact_id: 'contact-personal', contact_name: body.contact_name } })
        }
        if (url.includes('/contacts/') && init?.method === 'PUT') {
          putBodies.push(JSON.parse(init.body as string))
          return jsonResponse({ code: 0, contact: { contact_id: 'contact-business', contact_name: 'Keerthan Kumar P' } })
        }
        throw new Error(`Unexpected fetch: ${url}`)
      }),
    )

    const result = await findOrCreateZohoCustomer({
      contactName: 'Keerthan Kumar P',
      email: 'praveendevendran@gmail.com',
      // no gstin, no companyName — this order's own address has neither
    })

    expect(result.contact.contact_id).toBe('contact-personal')
    expect(result.wasCreated).toBe(true)
    // The business contact must never be mutated by this order's sync.
    expect(putBodies).toHaveLength(0)
  })

  it('findOrCreateZohoCustomer reuses and activates an inactive email-matched customer', async () => {
    const calls: { url: string; method?: string; body?: unknown }[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push({ url, method: init?.method, body: init?.body ? JSON.parse(init.body as string) : undefined })
        if (url.includes('/oauth/v2/token')) return jsonResponse({ access_token: 'token', expires_in: 3600 })
        if (url.includes('/contacts?email=')) {
          expect(url).toContain('filter_by=Status.All')
          return jsonResponse({
            code: 0,
            contacts: [{ contact_id: 'contact-1', contact_name: 'Keerthan Kumar P', status: 'inactive' }],
          })
        }
        if (url.includes('/contacts/contact-1/active') && init?.method === 'POST') {
          return jsonResponse({ code: 0, message: 'The contact has been marked as active.' })
        }
        throw new Error(`Unexpected fetch: ${url}`)
      }),
    )

    const result = await findOrCreateZohoCustomer({
      contactName: 'Keerthan Kumar P',
      email: 'praveendevendran@gmail.com',
    })

    expect(result).toMatchObject({ wasCreated: false, wasUpdated: false })
    expect(result.contact.contact_id).toBe('contact-1')
    expect(calls.some((call) => call.url.includes('/contacts/contact-1/active') && call.method === 'POST')).toBe(true)
    expect(calls.some((call) => call.url.includes('/contacts') && call.method === 'POST' && !call.url.includes('/active'))).toBe(false)
  })

  it('findOrCreateZohoCustomer recovers from an already-exists create race by reusing the existing email contact', async () => {
    let emailSearchCount = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes('/oauth/v2/token')) return jsonResponse({ access_token: 'token', expires_in: 3600 })
        if (url.includes('/contacts?email=')) {
          emailSearchCount += 1
          return jsonResponse({
            code: 0,
            contacts:
              emailSearchCount === 1
                ? []
                : [{ contact_id: 'contact-1', contact_name: 'Keerthan Kumar P', status: 'active' }],
          })
        }
        if (url.includes('/contacts?search_text=')) return jsonResponse({ code: 0, contacts: [] })
        if (url.includes('/contacts') && init?.method === 'POST') {
          return jsonResponse(
            {
              code: 3062,
              message:
                'The customer "Keerthan Kumar P (praveendevendran@gmail.com)" already exists. Please specify a different name.',
            },
            false,
          )
        }
        throw new Error(`Unexpected fetch: ${url}`)
      }),
    )

    const result = await findOrCreateZohoCustomer({
      contactName: 'Keerthan Kumar P',
      email: 'praveendevendran@gmail.com',
    })

    expect(result.contact.contact_id).toBe('contact-1')
    expect(result.wasCreated).toBe(false)
  })

  it('findOrCreateZohoCustomer reuses the exact duplicate customer named by Zoho when email search misses it', async () => {
    const postBodies: Record<string, unknown>[] = []
    const putBodies: Record<string, unknown>[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes('/oauth/v2/token')) return jsonResponse({ access_token: 'token', expires_in: 3600 })
        if (url.includes('/contacts?email=')) return jsonResponse({ code: 0, contacts: [] })
        if (
          url.includes('/contacts?search_text=') &&
          new URL(url).searchParams.get('search_text') === 'Keerthan Kumar P (praveendevendran@gmail.com)'
        ) {
          return jsonResponse({
            code: 0,
            contacts: [
              {
                contact_id: 'contact-disambiguated',
                contact_name: 'Keerthan Kumar P (praveendevendran@gmail.com)',
                status: 'active',
              },
            ],
          })
        }
        if (url.includes('/contacts?search_text=')) return jsonResponse({ code: 0, contacts: [] })
        if (url.includes('/contacts/contact-disambiguated') && init?.method === 'PUT') {
          const body = JSON.parse(init.body as string)
          putBodies.push(body)
          return jsonResponse({ code: 0, contact: { contact_id: 'contact-disambiguated', contact_name: body.contact_name } })
        }
        if (url.includes('/contacts') && init?.method === 'POST') {
          postBodies.push(JSON.parse(init.body as string))
          return jsonResponse(
            {
              code: 3062,
              message:
                'The customer "Keerthan Kumar P (praveendevendran@gmail.com)" already exists. Please specify a different name.',
            },
            false,
          )
        }
        throw new Error(`Unexpected fetch: ${url}`)
      }),
    )

    const result = await findOrCreateZohoCustomer({
      contactName: 'Keerthan Kumar P',
      email: 'praveendevendran@gmail.com',
    })

    expect(postBodies).toHaveLength(0)
    expect(putBodies).toHaveLength(1)
    expect(putBodies[0]).toMatchObject({ contact_name: 'Keerthan Kumar P' })
    expect(result.contact.contact_id).toBe('contact-disambiguated')
    expect(result.wasCreated).toBe(false)
  })

  it('findOrCreateZohoCustomer finds a duplicate contact by searching the email when exact display-name search misses', async () => {
    const postBodies: Record<string, unknown>[] = []
    const putBodies: Record<string, unknown>[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        const searchText = url.includes('/contacts?search_text=') ? new URL(url).searchParams.get('search_text') : null
        if (url.includes('/oauth/v2/token')) return jsonResponse({ access_token: 'token', expires_in: 3600 })
        if (url.includes('/contacts?email=')) return jsonResponse({ code: 0, contacts: [] })
        if (searchText === 'Keerthan Kumar P (praveendevendran@gmail.com)') {
          return jsonResponse({ code: 0, contacts: [] })
        }
        if (searchText === 'praveendevendran@gmail.com') {
          return jsonResponse({
            code: 0,
            contacts: [
              {
                contact_id: 'contact-by-email-search',
                contact_name: 'Keerthan Kumar P (praveendevendran@gmail.com)',
                status: 'active',
              },
            ],
          })
        }
        if (url.includes('/contacts/contact-by-email-search') && init?.method === 'PUT') {
          const body = JSON.parse(init.body as string)
          putBodies.push(body)
          return jsonResponse({ code: 0, contact: { contact_id: 'contact-by-email-search', contact_name: body.contact_name } })
        }
        if (url.includes('/contacts?search_text=')) return jsonResponse({ code: 0, contacts: [] })
        if (url.includes('/contacts') && init?.method === 'POST') {
          postBodies.push(JSON.parse(init.body as string))
          return jsonResponse(
            {
              code: 3062,
              message:
                'The customer "Keerthan Kumar P (praveendevendran@gmail.com)" already exists. Please specify a different name.',
            },
            false,
          )
        }
        throw new Error(`Unexpected fetch: ${url}`)
      }),
    )

    const result = await findOrCreateZohoCustomer({
      contactName: 'Keerthan Kumar P',
      email: 'praveendevendran@gmail.com',
    })

    expect(postBodies).toHaveLength(0)
    expect(putBodies[0]).toMatchObject({ contact_name: 'Keerthan Kumar P' })
    expect(result.contact.contact_id).toBe('contact-by-email-search')
    expect(result.wasCreated).toBe(false)
  })

  describe('getZohoDisplayName', () => {
    it.each([
      ['ABC Electronics Pvt Ltd', 'Raj Kumar', 'ABC Electronics Pvt Ltd'],
      [undefined, 'Raj Kumar', 'Raj Kumar'],
      ['', 'Raj Kumar', 'Raj Kumar'],
      ['   ', 'Raj Kumar', 'Raj Kumar'],
      [null, 'Raj Kumar', 'Raj Kumar'],
      ['  ABC Electronics Pvt Ltd  ', 'Raj Kumar', 'ABC Electronics Pvt Ltd'], // trimmed
    ])('companyName=%j, contactName=%j -> %j', (companyName, contactName, expected) => {
      expect(getZohoDisplayName({ companyName, contactName })).toBe(expected)
    })
  })

  it('findOrCreateZohoCustomer sends the company name as Display Name (contact_name), keeping the primary contact person separate', async () => {
    let postedBody: Record<string, unknown> | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes('/oauth/v2/token')) return jsonResponse({ access_token: 'token', expires_in: 3600 })
        if (url.includes('/contacts?email=')) return jsonResponse({ code: 0, contacts: [] })
        if (url.includes('/contacts?search_text=')) return jsonResponse({ code: 0, contacts: [] })
        if (url.includes('/contacts') && init?.method === 'POST') {
          const body = JSON.parse(init.body as string)
          postedBody = body
          return jsonResponse({ code: 0, contact: { contact_id: 'contact-1', contact_name: body.contact_name } })
        }
        throw new Error(`Unexpected fetch: ${url}`)
      }),
    )

    await findOrCreateZohoCustomer({
      contactName: 'Raj Kumar',
      firstName: 'Raj',
      lastName: 'Kumar',
      companyName: 'ABC Electronics Pvt Ltd',
      email: 'raj@example.com',
      phone: '9876543210',
    })

    expect(postedBody).toMatchObject({
      contact_name: 'ABC Electronics Pvt Ltd', // Display Name = company name
      company_name: 'ABC Electronics Pvt Ltd',
    })
    expect(postedBody?.contact_persons).toEqual([
      {
        first_name: 'Raj',
        last_name: 'Kumar',
        email: 'raj@example.com',
        phone: '9876543210',
        is_primary_contact: true,
      },
    ])
    // The company name must never leak into the primary contact's own name.
    expect((postedBody?.contact_persons as { first_name: string }[])[0].first_name).not.toBe('ABC Electronics Pvt Ltd')
  })

  it('findOrCreateZohoCustomer updates the Display Name to the company name once one is added, reusing the existing contact', async () => {
    const putBodies: Record<string, unknown>[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes('/oauth/v2/token')) return jsonResponse({ access_token: 'token', expires_in: 3600 })
        if (url.includes('/contacts?email=')) {
          return jsonResponse({
            code: 0,
            contacts: [{ contact_id: 'contact-1', contact_name: 'Raj Kumar', company_name: undefined, gst_no: undefined }],
          })
        }
        if (url.includes('/contacts/contact-1') && init?.method === 'PUT') {
          const body = JSON.parse(init.body as string)
          putBodies.push(body)
          return jsonResponse({ code: 0, contact: { contact_id: 'contact-1', contact_name: body.contact_name } })
        }
        throw new Error(`Unexpected fetch: ${url}`)
      }),
    )

    const result = await findOrCreateZohoCustomer({
      contactName: 'Raj Kumar',
      companyName: 'ABC Electronics Pvt Ltd',
      email: 'raj@example.com',
    })

    expect(result.contact.contact_id).toBe('contact-1') // same contact reused, not duplicated
    expect(result.wasUpdated).toBe(true)
    expect(putBodies[0]).toMatchObject({ contact_name: 'ABC Electronics Pvt Ltd', company_name: 'ABC Electronics Pvt Ltd' })
  })

  it('findOrCreateZohoCustomer reverts the Display Name to the contact name once the company name is removed', async () => {
    const putBodies: Record<string, unknown>[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes('/oauth/v2/token')) return jsonResponse({ access_token: 'token', expires_in: 3600 })
        if (url.includes('/contacts?email=')) {
          return jsonResponse({
            code: 0,
            contacts: [{ contact_id: 'contact-1', contact_name: 'ABC Electronics Pvt Ltd', company_name: 'ABC Electronics Pvt Ltd' }],
          })
        }
        if (url.includes('/contacts/contact-1') && init?.method === 'PUT') {
          const body = JSON.parse(init.body as string)
          putBodies.push(body)
          return jsonResponse({ code: 0, contact: { contact_id: 'contact-1', contact_name: body.contact_name } })
        }
        throw new Error(`Unexpected fetch: ${url}`)
      }),
    )

    const result = await findOrCreateZohoCustomer({
      contactName: 'Raj Kumar',
      companyName: undefined,
      email: 'raj@example.com',
    })

    expect(result.contact.contact_id).toBe('contact-1')
    expect(putBodies[0]).toMatchObject({ contact_name: 'Raj Kumar' })
    expect(putBodies[0].company_name).toBeUndefined()
  })
})
