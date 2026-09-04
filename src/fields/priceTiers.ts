import type { Field } from 'payload'

export const priceTiers: Field = {
  name: 'priceTiers',
  type: 'array',
  labels: {
    singular: 'Price Tier',
    plural: 'Price Tiers',
  },
  fields: [
    { name: 'minQuantity', type: 'number', label: 'Min Quantity', required: true, min: 1 },
    {
      name: 'maxQuantity',
      type: 'number',
      label: 'Max Quantity',
      min: 1,
      admin: {
        description:
          'Top of this tier\'s range — this price only applies to quantities between Min and Max Quantity. You can leave this blank on all but your highest-quantity tier (it\'ll automatically stop where the next tier\'s Min Quantity begins). On your HIGHEST tier, this must be filled in for it to price anything at all — a blank Max Quantity there means that tier is inactive, not "open-ended". Any quantity not covered by an active tier falls back to the product\'s normal per-piece rate.',
      },
    },
    {
      name: 'priceInINR',
      type: 'number',
      admin: {
        // Stored/read in paise everywhere else in the app (matching every other price field) —
        // this widget just displays/edits it as rupees so admins don't have to do the math.
        components: { Field: '@/components/admin/RupeeRateField#RupeeRateField' },
        description: 'Enter in rupees (e.g. 500 for ₹500.00) — stored internally in paise.',
      },
      label: 'Per Piece Rate (INR)',
      required: true,
      min: 0,
    },
  ],
  admin: {
    description:
      'Bulk/reseller pricing tiers by quantity (e.g. hobbyist vs reseller quantities). The price actually charged at checkout resolves from these — see src/lib/priceTiers.ts.',
  },
}
