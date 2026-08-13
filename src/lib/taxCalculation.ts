import { resolveIndianState } from './indianStates'

export type TaxLineItem = {
  gstPercent: number
  /** Nominal (listed) price × quantity, in paise — before any discount proration. */
  nominal: number
}

export type TaxBreakdown = {
  taxType: 'intra-state' | 'inter-state'
  gstRatePercent: number
  taxableValue: number
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  totalTax: number
}

/**
 * Computes the GST split for an order from its line items. Each item's
 * nominal (listed) subtotal is prorated against the order's actual charged
 * `amount` first, so a coupon/gift-card discount doesn't leave the order
 * over-taxed relative to what was actually collected. Prices are assumed
 * GST-inclusive. Falls back to a single blended rate against the full amount
 * when there are no resolvable line items.
 */
export function computeOrderTaxBreakdown(args: {
  items: TaxLineItem[]
  amount: number
  defaultGstPercent: number
  businessState?: string | null
  customerState?: string | null
}): TaxBreakdown {
  const { items, amount, defaultGstPercent } = args
  const nominalTotal = items.reduce((sum, item) => sum + item.nominal, 0)

  let taxableValue = 0
  let totalTax = 0
  let weightedGstPercent = 0

  if (items.length > 0 && nominalTotal > 0) {
    for (const item of items) {
      const chargedAmount = (item.nominal / nominalTotal) * amount
      const itemTaxable = chargedAmount / (1 + item.gstPercent / 100)
      taxableValue += itemTaxable
      totalTax += chargedAmount - itemTaxable
      weightedGstPercent += (item.nominal / nominalTotal) * item.gstPercent
    }
  } else {
    taxableValue = amount / (1 + defaultGstPercent / 100)
    totalTax = amount - taxableValue
    weightedGstPercent = defaultGstPercent
  }

  const businessState = resolveIndianState(args.businessState)
  const customerState = resolveIndianState(args.customerState)
  const isIntraState = Boolean(businessState) && Boolean(customerState) && businessState!.gstCode === customerState!.gstCode

  return {
    taxType: isIntraState ? 'intra-state' : 'inter-state',
    gstRatePercent: weightedGstPercent,
    taxableValue,
    cgstAmount: isIntraState ? totalTax / 2 : 0,
    sgstAmount: isIntraState ? totalTax / 2 : 0,
    igstAmount: isIntraState ? 0 : totalTax,
    totalTax,
  }
}
