import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { INDIAN_STATES, resolveIndianState } from '@/lib/indianStates'
import { computeOrderTaxBreakdown } from '@/lib/taxCalculation'
import { findExistingInvoiceByOrderId, getInvoicePdfUrl } from '@/lib/zoho/invoices'
import { recordCustomerPayment } from '@/lib/zoho/payments'
import { resolveTaxId } from '@/lib/zoho/taxes'

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
})
