import type { Payload } from 'payload'

import ExcelJS from 'exceljs'

import { TEMPLATE_COLUMNS } from './templateColumns'

/**
 * Adds the "Instructions" and "Reference Lists" sheets to a workbook —
 * shared by the blank template (generateTemplate.ts) and the current-products
 * export (exportProducts.ts) so a re-uploaded export carries the same column
 * documentation and live category/brand reference values as the template.
 */
export async function buildReferenceSheets(workbook: ExcelJS.Workbook, payload: Payload): Promise<void> {
  // --- Instructions ---
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

  // --- Reference Lists (live data) ---
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
}
