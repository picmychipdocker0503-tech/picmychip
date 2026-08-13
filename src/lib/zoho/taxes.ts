import { zohoFetch } from './auth'

type ZohoTax = {
  tax_id: string
  tax_name: string
  tax_percentage: number
  tax_type?: string
}

// Taxes must already be configured in the merchant's Zoho org (GST rates/groups
// are set up once, by hand, in Zoho's own Settings → Taxes screen — the API has
// no reliable way to create a compliant CGST+SGST/IGST tax group from scratch).
// This resolves a GST percentage to the matching Zoho tax_id, so nothing in this
// codebase hard-codes a rate or an ID.
let cachedTaxes: { fetchedAt: number; taxes: ZohoTax[] } | null = null
const CACHE_TTL_MS = 5 * 60 * 1000

async function getZohoTaxes(): Promise<ZohoTax[]> {
  if (cachedTaxes && Date.now() - cachedTaxes.fetchedAt < CACHE_TTL_MS) {
    return cachedTaxes.taxes
  }

  const data = await zohoFetch<{ taxes: ZohoTax[] }>('/settings/taxes')
  cachedTaxes = { taxes: data.taxes || [], fetchedAt: Date.now() }
  return cachedTaxes.taxes
}

function getOverrideMap(): Record<string, string> {
  const raw = process.env.ZOHO_TAX_ID_MAP
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, string>
  } catch {
    return {}
  }
}

/**
 * Resolves a GST percentage (e.g. 18) to a Zoho tax_id. Checks the
 * ZOHO_TAX_ID_MAP env override first, then falls back to matching against
 * the org's configured tax rates by percentage. Returns undefined (not a
 * thrown error) when nothing matches — callers decide whether an untaxed
 * line item is acceptable or should fail the sync.
 */
export async function resolveTaxId(gstPercent: number): Promise<string | undefined> {
  const override = getOverrideMap()[String(gstPercent)]
  if (override) return override

  const taxes = await getZohoTaxes()
  const match = taxes.find((tax) => Math.abs(tax.tax_percentage - gstPercent) < 0.01)
  return match?.tax_id
}
