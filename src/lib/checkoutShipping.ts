export type CheckoutShippingMethodId = 'express' | 'standard'

export type CheckoutShippingMethod = {
  id: CheckoutShippingMethodId
  label: string
  amount: number
  eta: string
}

export const checkoutShippingMethods: CheckoutShippingMethod[] = [
  { id: 'express', label: 'Express Shipping', amount: 30000, eta: '3-5 business days' },
  { id: 'standard', label: 'Standard Shipping', amount: 20000, eta: '5-7 days' },
]

export function getCheckoutShippingMethod(id?: string | null): CheckoutShippingMethod | undefined {
  return checkoutShippingMethods.find((method) => method.id === id)
}

export function requireCheckoutShippingMethod(id?: string | null): CheckoutShippingMethod {
  const method = getCheckoutShippingMethod(id)
  if (!method) throw new Error('Please select a valid shipping method.')
  return method
}
