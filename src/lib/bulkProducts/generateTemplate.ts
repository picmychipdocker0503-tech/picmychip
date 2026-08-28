import type { Payload } from 'payload'

import ExcelJS from 'exceljs'

import { TEMPLATE_COLUMNS } from './templateColumns'

const EXAMPLE_ROWS: Record<string, string | number | boolean>[] = [
  {
    sku: 'EXAMPLE-SKU-001',
    title: 'Example — SMA Male to SMA Male RF Cable 300mm',
    brand: '',
    categories: 'RF Cables',
    tags: 'rf|coaxial|sma',
    highlights: '50 Ohm impedance|Gold-plated connectors',
    featured: false,
    hsnCode: '85444299',
    description: 'A short plain-text description of the product goes here.',
    priceInINR: 499,
    gstPercent: 18,
    inventory: 100,
    lowStockThreshold: 5,
    weightInGrams: 50,
    metaTitle: 'SMA Male to SMA Male RF Cable 300mm',
    metaDescription: 'Spec-verified 50 Ohm RF coaxial cable assembly.',
    imageUrls: 'https://example.com/images/cable-front.jpg|https://example.com/images/cable-side.jpg',
    specSchemaType: 'none',
  },
  {
    sku: 'EXISTING-SKU-002',
    title: '(leave blank cells unchanged — this row updates an existing product by SKU)',
    priceInINR: 549,
    inventory: 80,
  },
]

export async function generateBulkProductsTemplate(payload: Payload): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Picmychip Admin'
  workbook.created = new Date()

  // --- Sheet 1: Products ---
  const productsSheet = workbook.addWorksheet('Products')
  productsSheet.columns = TEMPLATE_COLUMNS.map((col) => ({
    header: col.key,
    key: col.key,
    width: Math.max(18, col.key.length + 2),
  }))
  productsSheet.getRow(1).font = { bold: true }
  productsSheet.views = [{ state: 'frozen', ySplit: 1 }]

  for (const row of EXAMPLE_ROWS) {
    productsSheet.addRow(row)
  }

  // --- Sheet 2: Instructions ---
  const instructionsSheet = workbook.addWorksheet('Instructions')
  instructionsSheet.columns = [
    { header: 'Column', key: 'column', width: 34 },
    { header: 'Group', key: 'group', width: 16 },
    { header: 'Type', key: 'type', width: 12 },
    { header: 'Required', key: 'required', width: 10 },
    { header: 'Valid values', key: 'values', width: 40 },
    { header: 'Notes', key: 'notes', width: 60 },
  ]
  instructionsSheet.getRow(1).font = { bold: true }

  instructionsSheet.addRow({
    column: '— How this import works —',
    notes:
      'SKU (or Slug, if SKU is blank) is matched against existing products. A match UPDATES that product; no match CREATES a new one. ' +
      'On an UPDATE row, a BLANK cell leaves that field unchanged — only fill in the columns you actually want to change. ' +
      'Prices are entered in rupees. Multiple values (categories, tags, highlights, image URLs, etc.) are separated by the | (pipe) character.',
  })
  instructionsSheet.addRow({})

  for (const col of TEMPLATE_COLUMNS) {
    instructionsSheet.addRow({
      column: col.key,
      group: col.group,
      type: col.type,
      required: col.required ? 'Yes' : '',
      values: col.options ? col.options.join(', ') : '',
      notes: col.notes || '',
    })
  }

  // --- Sheet 3: Reference Lists (live data) ---
  const referenceSheet = workbook.addWorksheet('Reference Lists')
  referenceSheet.columns = [
    { header: 'Categories (title)', key: 'categoryTitle', width: 30 },
    { header: 'Categories (slug)', key: 'categorySlug', width: 30 },
    { header: '', key: 'spacer', width: 4 },
    { header: 'Brands (title)', key: 'brandTitle', width: 30 },
    { header: 'Brands (slug)', key: 'brandSlug', width: 30 },
  ]
  referenceSheet.getRow(1).font = { bold: true }

  const [{ docs: categories }, { docs: brands }] = await Promise.all([
    payload.find({
      collection: 'categories',
      depth: 0,
      limit: 1000,
      overrideAccess: true,
      pagination: false,
      sort: 'title',
      select: { title: true, slug: true },
    }),
    payload.find({
      collection: 'brands',
      depth: 0,
      limit: 1000,
      overrideAccess: true,
      pagination: false,
      sort: 'title',
      select: { title: true, slug: true },
    }),
  ])

  const rowCount = Math.max(categories.length, brands.length)
  for (let i = 0; i < rowCount; i += 1) {
    referenceSheet.addRow({
      categoryTitle: categories[i]?.title ?? '',
      categorySlug: categories[i]?.slug ?? '',
      brandTitle: brands[i]?.title ?? '',
      brandSlug: brands[i]?.slug ?? '',
    })
  }

  return workbook.xlsx.writeBuffer()
}
