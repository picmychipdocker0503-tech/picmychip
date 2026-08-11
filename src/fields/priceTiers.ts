import type { Field } from 'payload'

export const priceTiers: Field = {
  name: 'priceTiers',
  type: 'array',
  labels: {
    singular: 'Price Tier',
    plural: 'Price Tiers',
  },
  fields: [
    { name: 'minQuantity', type: 'number', required: true, min: 1 },
    { name: 'priceInINR', type: 'number', required: true, min: 0 },
  ],
  admin: {
    description:
      'Optional bulk/reseller pricing tiers by minimum quantity (e.g. hobbyist vs reseller quantities). Data-only for now — checkout price resolution reads this in a later phase.',
  },
}
