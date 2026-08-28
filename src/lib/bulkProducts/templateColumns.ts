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

// Mirrors src/fields/productSpecs/specSchemaOptions.ts
export const SPEC_SCHEMA_OPTIONS = [
  'none',
  'drone-motors',
  'sbc',
  'microcontrollers',
  'mechanical',
  'tools',
  'filaments',
] as const

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
    key: 'specSchemaType',
    group: 'Specifications',
    type: 'select',
    options: [...SPEC_SCHEMA_OPTIONS],
    notes: 'Determines which spec_* columns below apply to this row. Only fill in the spec_ columns matching the chosen schema.',
  },

  // spec_droneMotor_*
  { key: 'spec_droneMotor_motorType', group: 'Specifications', type: 'select', options: ['brushless', 'brushed'] },
  { key: 'spec_droneMotor_kvRating', group: 'Specifications', type: 'number' },
  { key: 'spec_droneMotor_statorWidthMM', group: 'Specifications', type: 'number' },
  { key: 'spec_droneMotor_statorHeightMM', group: 'Specifications', type: 'number' },
  { key: 'spec_droneMotor_weightG', group: 'Specifications', type: 'number' },
  {
    key: 'spec_droneMotor_applications',
    group: 'Specifications',
    type: 'pipeList',
    notes: 'One or more of: racing|freestyle|cinematic|industrial-agriculture, separated by |.',
  },

  // spec_sbc_*
  {
    key: 'spec_sbc_modelFamily',
    group: 'Specifications',
    type: 'select',
    options: ['raspberry-pi-zero', 'raspberry-pi-3', 'raspberry-pi-4', 'raspberry-pi-5', 'raspberry-pi-cm', 'other'],
  },
  { key: 'spec_sbc_modelFamilyOther', group: 'Specifications', type: 'text' },
  { key: 'spec_sbc_formFactor', group: 'Specifications', type: 'select', options: ['standard', 'zero', 'compute-module', 'other'] },
  { key: 'spec_sbc_formFactorOther', group: 'Specifications', type: 'text' },
  { key: 'spec_sbc_ramMB', group: 'Specifications', type: 'select', options: ['512', '1024', '2048', '4096', '8192', '16384', 'custom'] },
  { key: 'spec_sbc_ramCustomMB', group: 'Specifications', type: 'number', notes: 'Only used when spec_sbc_ramMB = custom.' },
  {
    key: 'spec_sbc_connectivity',
    group: 'Specifications',
    type: 'pipeList',
    notes: 'One or more of: wifi|bluetooth|ethernet|usb-c|usb-a, separated by |.',
  },
  { key: 'spec_sbc_gpioPinCount', group: 'Specifications', type: 'number' },
  { key: 'spec_sbc_gpioLayoutNotes', group: 'Specifications', type: 'text' },

  // spec_microcontroller_*
  {
    key: 'spec_microcontroller_family',
    group: 'Specifications',
    type: 'select',
    options: ['arduino', 'esp32', 'esp8266', 'stm32', 'pic', 'teensy', 'rp2040', 'nrf52', 'other'],
  },
  { key: 'spec_microcontroller_familyOther', group: 'Specifications', type: 'text' },
  { key: 'spec_microcontroller_clockSpeedMHz', group: 'Specifications', type: 'number' },
  { key: 'spec_microcontroller_flashSize', group: 'Specifications', type: 'number' },
  { key: 'spec_microcontroller_flashUnit', group: 'Specifications', type: 'select', options: ['KB', 'MB'] },
  { key: 'spec_microcontroller_ramSize', group: 'Specifications', type: 'number' },
  { key: 'spec_microcontroller_ramUnit', group: 'Specifications', type: 'select', options: ['KB', 'MB'] },
  { key: 'spec_microcontroller_ioCount', group: 'Specifications', type: 'number' },
  {
    key: 'spec_microcontroller_wireless',
    group: 'Specifications',
    type: 'pipeList',
    notes: 'One or more of: wifi|bluetooth|ble|lora|zigbee|none, separated by |.',
  },

  // spec_mechanical_*
  {
    key: 'spec_mechanical_componentType',
    group: 'Specifications',
    type: 'select',
    options: ['gear', 'bearing', 'coupler', 'frame', 'chassis-kit', 'fastener', 'other'],
  },
  { key: 'spec_mechanical_componentTypeOther', group: 'Specifications', type: 'text' },
  {
    key: 'spec_mechanical_material',
    group: 'Specifications',
    type: 'select',
    options: ['aluminum', 'carbon-fiber', 'abs-plastic', 'nylon', 'steel', 'brass', 'pla', 'other'],
  },
  { key: 'spec_mechanical_materialOther', group: 'Specifications', type: 'text' },
  { key: 'spec_mechanical_lengthMM', group: 'Specifications', type: 'number' },
  { key: 'spec_mechanical_widthMM', group: 'Specifications', type: 'number' },
  { key: 'spec_mechanical_heightMM', group: 'Specifications', type: 'number' },
  { key: 'spec_mechanical_boreDiameterMM', group: 'Specifications', type: 'number' },

  // spec_tool_* (measurementRanges array is intentionally excluded — add
  // those manually in the admin panel after import, they don't fit a flat row)
  {
    key: 'spec_tool_toolType',
    group: 'Specifications',
    type: 'select',
    options: ['soldering-station', 'multimeter', 'oscilloscope', 'hot-air-rework', 'hand-tool', 'other'],
  },
  { key: 'spec_tool_powerWattage', group: 'Specifications', type: 'number' },
  { key: 'spec_tool_voltageSpec', group: 'Specifications', type: 'text' },

  // spec_filament_*
  {
    key: 'spec_filament_materialType',
    group: 'Specifications',
    type: 'select',
    options: ['pla', 'petg', 'abs', 'tpu', 'nylon', 'other'],
  },
  { key: 'spec_filament_materialTypeOther', group: 'Specifications', type: 'text' },
  { key: 'spec_filament_diameterMM', group: 'Specifications', type: 'select', options: ['1.75', '2.85'] },
  { key: 'spec_filament_color', group: 'Specifications', type: 'text' },
  { key: 'spec_filament_colorHex', group: 'Specifications', type: 'text' },
  { key: 'spec_filament_spoolWeightG', group: 'Specifications', type: 'number' },
  { key: 'spec_filament_printTempMinC', group: 'Specifications', type: 'number' },
  { key: 'spec_filament_printTempMaxC', group: 'Specifications', type: 'number' },
]

export const MAX_IMPORT_ROWS = 500
