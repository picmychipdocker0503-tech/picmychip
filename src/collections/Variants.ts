import type { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'

import { priceTiers } from '@/fields/priceTiers'

export const VariantsCollection: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  fields: [...defaultCollection.fields, priceTiers],
})
