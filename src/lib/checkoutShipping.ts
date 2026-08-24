export type CheckoutShippingMethodId = 'express' | 'standard'

export type CheckoutShippingMethod = {
  id: CheckoutShippingMethodId
  label: string
  amount: number
  eta: string
}

export type CheckoutShippingRates = {
  standardShippingRate?: number | null
  expressShippingRate?: number | null
}

const DEFAULT_STANDARD_RATE_INR = 200
const DEFAULT_EXPRESS_RATE_INR = 300

/**
 * Builds the checkout's shipping method list from the admin-configured rates
 * in Site Settings (rupees — see SiteSettings.shippingSettings), falling
 * back to the original defaults when a rate isn't set. `rates` is optional
 * so callers that only need the method ids/labels (not an accurate charge —
 * e.g. confirmOrder.ts validating an id already priced at initiatePayment
 * time) don't need to fetch Site Settings just to call this.
 */
export function getCheckoutShippingMethods(rates?: CheckoutShippingRates): CheckoutShippingMethod[] {
  const standardRate = rates?.standardShippingRate ?? DEFAULT_STANDARD_RATE_INR
  const expressRate = rates?.expressShippingRate ?? DEFAULT_EXPRESS_RATE_INR

  return [
    { id: 'express', label: 'Express Shipping', amount: Math.round(expressRate * 100), eta: '3-5 business days' },
    { id: 'standard', label: 'Standard Shipping', amount: Math.round(standardRate * 100), eta: '5-7 days' },
  ]
}

export function getCheckoutShippingMethod(
  id?: string | null,
  rates?: CheckoutShippingRates,
): CheckoutShippingMethod | undefined {
  return getCheckoutShippingMethods(rates).find((method) => method.id === id)
}

export function requireCheckoutShippingMethod(
  id?: string | null,
  rates?: CheckoutShippingRates,
): CheckoutShippingMethod {
  const method = getCheckoutShippingMethod(id, rates)
  if (!method) throw new Error('Please select a valid shipping method.')
  return method
}
