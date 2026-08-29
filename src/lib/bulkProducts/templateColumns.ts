/**
 * Single source of truth for the bulk product Excel template's columns —
 * both the template generator (generateTemplate.ts) and the uploaded-file
 * parser (parseAndValidate.ts) read this list, so the two can never drift
 * out of sync with each other.
 */

export type ColumnType = 'text' | 'number' | 'boolean' | 'select' | 'pipeList' | 'date'

export type ColumnDef = {
  /** Header text in the sheet — also the key on the parsed row object. */
  key: string
  group: string
  type: ColumnType
  required?: boolean
  /** Valid values for `type: 'select'`. */
  options?: string[]
  /** Shown in the Instructions sheet — explains the column and any quirks. */
  notes?: string
}

export const TEMPLATE_COLUMNS: ColumnDef[] = [
  // Identity / matching
  {
    key: 'sku',
    group: 'Identity',
    type: 'text',
    notes: 'Primary match key. If this matches an existing product\'s SKU, that product is UPDATED instead of a new one being created.',
  },
  {
    key: 'slug',
    group: 'Identity',
    type: 'text',
    notes: 'Secondary match key (used only if SKU is blank or has no match). Auto-generated from Title if left blank on a new product.',
  },

  // Basics
  {
    key: 'status',
    group: 'Basics',
    type: 'select',
    options: ['draft', 'published'],
    notes: 'Publish status. Defaults to "draft" on a new product if left blank. Leave blank on an update row to keep the current status unchanged.',
  },
  { key: 'title', group: 'Basics', type: 'text', required: true, notes: 'Required.' },
  { key: 'brand', group: 'Basics', type: 'text', notes: 'Brand name (must match an existing Brand\'s title exactly, case-insensitive) — see the Reference Lists sheet.' },
  { key: 'categories', group: 'Basics', type: 'pipeList', notes: 'One or more category names separated by | (pipe) — e.g. "Connectors|Cables". Must match existing category titles — see Reference Lists.' },
  { key: 'tags', group: 'Basics', type: 'pipeList', notes: 'Free-text tags separated by | (pipe).' },
  { key: 'highlights', group: 'Basics', type: 'pipeList', notes: 'Bullet-point highlights separated by | (pipe), max 8.' },
  { key: 'featured', group: 'Basics', type: 'boolean' },
  { key: 'hsnCode', group: 'Basics', type: 'text', required: true, notes: 'Required — HSN/SAC code for GST invoicing.' },

  // Content
  { key: 'description', group: 'Content', type: 'text', notes: 'Plain text only — becomes a single paragraph. Rich formatting is not supported via bulk import; edit in the admin panel afterward for that.' },

  // Pricing
  { key: 'priceInINR', group: 'Pricing', type: 'number', notes: 'Enter in RUPEES (e.g. 499.50) — converted automatically. Do not enter paise.' },
  { key: 'compareAtPriceInINR', group: 'Pricing', type: 'number', notes: 'Optional "was" price, in rupees.' },
  { key: 'gstPercent', group: 'Pricing', type: 'number', notes: 'Defaults to 18 if left blank on a new product.' },
  { key: 'onSale', group: 'Pricing', type: 'boolean' },
  { key: 'saleType', group: 'Pricing', type: 'select', options: ['percentage', 'fixed'] },
  { key: 'discountValue', group: 'Pricing', type: 'number', notes: 'Percentage (0-90) or ₹ amount off, depending on Sale Type.' },
  { key: 'saleEndDate', group: 'Pricing', type: 'date', notes: 'Format: YYYY-MM-DD.' },
  { key: 'isClearance', group: 'Pricing', type: 'boolean' },
  { key: 'clearanceReason', group: 'Pricing', type: 'text' },

  // Inventory
  { key: 'inventory', group: 'Inventory', type: 'number' },
  { key: 'lowStockThreshold', group: 'Inventory', type: 'number', notes: 'Defaults to 5 if left blank on a new product.' },
  { key: 'weightInGrams', group: 'Inventory', type: 'number', notes: 'Defaults to 50 if left blank on a new product.' },
  { key: 'leadTimeDays', group: 'Inventory', type: 'number' },

  // SEO
  { key: 'metaTitle', group: 'SEO', type: 'text' },
  { key: 'metaDescription', group: 'SEO', type: 'text' },

  // Google Merchant
  { key: 'googleMerchant_excludeFromFeed', group: 'Google Merchant', type: 'boolean' },
  { key: 'googleMerchant_googleProductCategory', group: 'Google Merchant', type: 'text', notes: 'e.g. "Electronics > Electronics Accessories".' },
  { key: 'googleMerchant_gtin', group: 'Google Merchant', type: 'text' },
  { key: 'googleMerchant_mpn', group: 'Google Merchant', type: 'text', notes: 'Falls back to SKU when blank.' },
  { key: 'googleMerchant_condition', group: 'Google Merchant', type: 'text' },

  // Images
  {
    key: 'imageUrls',
    group: 'Images',
    type: 'pipeList',
    notes: 'One or more direct image URLs separated by | (pipe). First URL becomes the primary image. Downloaded and attached automatically. Leave blank on an update row to keep the existing gallery unchanged.',
  },

  // Specifications
  {
    key: 'customSpecs',
    group: 'Specifications',
    type: 'pipeList',
    notes:
      'Custom label/value spec rows, separated by | (pipe) — each one written as "Label: Value", e.g. "Resistance: 475 kOhm|Tolerance: 5%|Package: 0603". Shown in the Specifications table on every product regardless of category. Leave blank on an update row to keep existing rows unchanged.',
  },
]

export const MAX_IMPORT_ROWS = 500
