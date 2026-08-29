import type { Payload } from 'payload'

import ExcelJS from 'exceljs'

import { buildReferenceSheets } from './buildReferenceSheets'
import { TEMPLATE_COLUMNS } from './templateColumns'

const EXAMPLE_ROWS: Record<string, string | number | boolean>[] = [
  {
    sku: 'EXAMPLE-SKU-001',
    status: 'published',
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
    customSpecs: 'Impedance: 50 Ohm|Connector Type: SMA Male|Cable Length: 300mm',
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

  // --- Sheets 2-3: Instructions + Reference Lists ---
  await buildReferenceSheets(workbook, payload)

  return workbook.xlsx.writeBuffer()
}
