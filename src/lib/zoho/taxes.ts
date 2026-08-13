import { zohoFetch } from './auth'

type ZohoTax = {
  tax_id: string
  tax_name: string
  tax_percentage: number
  tax_type?: string
  tax_specific_type?: string
}

export type GstTaxType = 'intra-state' | 'inter-state'

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
 * Resolves a GST percentage + intra/inter-state transaction type to a Zoho
 * tax_id. A given rate typically has TWO separate entries in Zoho — e.g.
 * "GST18" (a `tax_group` combining CGST+SGST, for intra-state) and "IGST18"
 * (a single `tax` with `tax_specific_type: 'igst'`, for inter-state) — Zoho
 * does not auto-swap between them; picking the wrong one for the transaction
 * gets the invoice rejected with "IGST has to be applied as this is an
 * interstate transaction" (or the reverse). This picks by declared type, not
 * just percentage.
 *
 * Checks the ZOHO_TAX_ID_MAP override first (`"<percent>-inter"`/
 * `"<percent>-intra"` keys, falling back to a plain `"<percent>"` key for
 * orgs with only one tax per rate), then matches against the org's
 * configured tax rates. Returns undefined (not a thrown error) when nothing
 * matches — callers decide whether an untaxed line item is acceptable.
 */
export async function resolveTaxId(gstPercent: number, taxType: GstTaxType): Promise<string | undefined> {
  const overrides = getOverrideMap()
  const typeSuffix = taxType === 'inter-state' ? 'inter' : 'intra'
  const override = overrides[`${gstPercent}-${typeSuffix}`] ?? overrides[String(gstPercent)]
  if (override) return override

  const taxes = await getZohoTaxes()
  const percentMatches = taxes.filter((tax) => Math.abs(tax.tax_percentage - gstPercent) < 0.01)

  const typed =
    taxType === 'inter-state'
      ? percentMatches.find((tax) => tax.tax_specific_type === 'igst')
      : percentMatches.find((tax) => tax.tax_type === 'tax_group') ||
        percentMatches.find((tax) => tax.tax_specific_type === 'cgst' || tax.tax_specific_type === 'sgst')

  return (typed ?? percentMatches[0])?.tax_id
}
