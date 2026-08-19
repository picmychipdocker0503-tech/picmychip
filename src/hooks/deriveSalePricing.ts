import type { CollectionBeforeChangeHook } from 'payload'

const MAX_PERCENT_DISCOUNT = 90

/**
 * Computes `salePriceInINR` from `priceInINR` + `discountValue`/`saleType`
 * whenever `onSale` is checked, validates the discount is sane, and clears
 * `onSale` if `saleEndDate` has already passed — so an admin who edits an
 * expired sale for any reason can't accidentally leave it looking active.
 */
export const deriveSalePricing: CollectionBeforeChangeHook = ({ data }) => {
  if (!data) return data

  const price = typeof data.priceInINR === 'number' ? data.priceInINR : undefined

  if (price !== undefined && price <= 0) {
    throw new Error('Price must be greater than 0.')
  }

  const saleExpired = Boolean(data.saleEndDate && new Date(data.saleEndDate).getTime() < Date.now())
  const onSale = Boolean(data.onSale) && !saleExpired

  if (!onSale || price === undefined) {
    return { ...data, onSale, salePriceInINR: null }
  }

  const discountValue = typeof data.discountValue === 'number' ? data.discountValue : 0

  let salePriceInINR: number

  if (data.saleType === 'percentage') {
    if (discountValue <= 0 || discountValue > MAX_PERCENT_DISCOUNT) {
      throw new Error(`Percentage discount must be between 0 and ${MAX_PERCENT_DISCOUNT}.`)
    }
    salePriceInINR = Math.max(1, Math.round(price * (1 - discountValue / 100)))
  } else if (data.saleType === 'fixed') {
    if (discountValue <= 0 || discountValue >= price) {
      throw new Error('Fixed discount must be greater than 0 and less than the price.')
    }
    salePriceInINR = Math.round(price - discountValue)
  } else {
    throw new Error('Select a sale type (Percentage Off or Fixed Amount Off) when Sale Pricing is enabled.')
  }

  return { ...data, onSale, salePriceInINR }
}
