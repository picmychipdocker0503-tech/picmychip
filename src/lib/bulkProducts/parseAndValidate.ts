import type { Payload } from 'payload'

import ExcelJS from 'exceljs'

import { textToLexical } from './textToLexical'
import { MAX_IMPORT_ROWS, TEMPLATE_COLUMNS, type ColumnDef } from './templateColumns'

export type RowAction = 'create' | 'update' | 'error'

export type ParsedRow = {
  rowNumber: number
  action: RowAction
  sku?: string
  title?: string
  errors: string[]
  /** Existing product id, when action === 'update'. */
  productId?: number
  /** Fully-resolved payload ready for payload.create/update — undefined when action === 'error'. */
  data?: Record<string, unknown>
  imageUrls: string[]
}

const DIMENSION_FIELDS = new Set(['lengthMM', 'widthMM', 'heightMM', 'boreDiameterMM'])

const splitPipeList = (value: string): string[] =>
  value
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)

const matchOption = (options: string[] | undefined, value: string): string | undefined => {
  if (!options) return value
  const normalized = value.trim().toLowerCase()
  return options.find((option) => option.toLowerCase() === normalized)
}

const parseBoolean = (value: string): boolean => /^(true|yes|1)$/i.test(value.trim())

const cellToString = (value: ExcelJS.CellValue): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object' && 'result' in (value as object)) {
    // Formula cell — use its computed result.
    return String((value as { result: unknown }).result ?? '')
  }
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).trim()
}

async function readProductsSheet(buffer: Buffer): Promise<{ rowNumber: number; raw: Record<string, string> }[]> {
  const workbook = new ExcelJS.Workbook()
  // ExcelJS's type defs lag behind Node's Buffer<ArrayBufferLike> generic —
  // the runtime value is a normal Buffer either way.
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer)

  const sheet = workbook.getWorksheet('Products')
  if (!sheet) throw new Error('No "Products" sheet found in the uploaded file — use the downloaded template.')

  const headerRow = sheet.getRow(1)
  const columnIndexToKey = new Map<number, string>()
  const knownKeys = new Set(TEMPLATE_COLUMNS.map((col) => col.key))

  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const header = cellToString(cell.value)
    if (knownKeys.has(header)) columnIndexToKey.set(colNumber, header)
  })

  const rows: { rowNumber: number; raw: Record<string, string> }[] = []

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return

    const raw: Record<string, string> = {}
    let hasAnyValue = false

    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const key = columnIndexToKey.get(colNumber)
      if (!key) return
      const value = cellToString(cell.value)
      raw[key] = value
      if (value) hasAnyValue = true
    })

    if (hasAnyValue) rows.push({ rowNumber, raw })
  })

  return rows
}

function coerceScalar(col: ColumnDef, raw: string): { value: unknown; error?: string } {
  const trimmed = raw.trim()
  if (!trimmed) return { value: undefined }

  switch (col.type) {
    case 'number': {
      const num = Number(trimmed)
      if (Number.isNaN(num)) return { value: undefined, error: `"${col.key}" must be a number, got "${raw}"` }
      return { value: num }
    }
    case 'boolean':
      return { value: parseBoolean(trimmed) }
    case 'date': {
      const date = new Date(trimmed)
      if (Number.isNaN(date.getTime())) return { value: undefined, error: `"${col.key}" must be a valid date (YYYY-MM-DD), got "${raw}"` }
      return { value: date.toISOString() }
    }
    case 'select': {
      const matched = matchOption(col.options, trimmed)
      if (!matched) return { value: undefined, error: `"${col.key}" must be one of: ${col.options?.join(', ')} — got "${raw}"` }
      return { value: matched }
    }
    case 'pipeList':
      return { value: splitPipeList(trimmed) }
    default:
      return { value: trimmed }
  }
}

function buildSpecs(raw: Record<string, string>, errors: string[]): Record<string, unknown> {
  const specs: Record<string, Record<string, unknown>> = {}

  for (const col of TEMPLATE_COLUMNS) {
    if (!col.key.startsWith('spec_')) continue
    const rawValue = raw[col.key]
    if (!rawValue) continue

    const withoutPrefix = col.key.slice('spec_'.length)
    const underscoreIndex = withoutPrefix.indexOf('_')
    const schemaKey = withoutPrefix.slice(0, underscoreIndex)
    const fieldKey = withoutPrefix.slice(underscoreIndex + 1)

    const { value, error } = coerceScalar(col, rawValue)
    if (error) {
      errors.push(error)
      continue
    }
    if (value === undefined) continue

    specs[schemaKey] = specs[schemaKey] || {}

    if (schemaKey === 'mechanical' && DIMENSION_FIELDS.has(fieldKey)) {
      const dimensions = (specs.mechanical.dimensions as Record<string, unknown>) || {}
      dimensions[fieldKey] = value
      specs.mechanical.dimensions = dimensions
    } else {
      specs[schemaKey][fieldKey] = value
    }
  }

  return specs
}

const slugify = (input: string): string =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export async function parseAndValidateBulkProducts(
  payload: Payload,
  buffer: Buffer,
): Promise<{ rows: ParsedRow[]; truncated: boolean }> {
  const allRows = await readProductsSheet(buffer)
  const truncated = allRows.length > MAX_IMPORT_ROWS
  const rows = allRows.slice(0, MAX_IMPORT_ROWS)

  const results: ParsedRow[] = []

  for (const { rowNumber, raw } of rows) {
    const errors: string[] = []
    const sku = raw.sku?.trim() || undefined
    const titleRaw = raw.title?.trim() || undefined

    // --- Match against an existing product ---
    let existing: { id: number } | undefined
    if (sku) {
      const found = await payload.find({
        collection: 'products',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        where: { sku: { equals: sku } },
        select: {},
      })
      existing = found.docs[0]
    }
    if (!existing && raw.slug?.trim()) {
      const found = await payload.find({
        collection: 'products',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        where: { slug: { equals: raw.slug.trim() } },
        select: {},
      })
      existing = found.docs[0]
    }

    const action: RowAction = existing ? 'update' : 'create'

    if (action === 'create') {
      if (!titleRaw) errors.push('Title is required for a new product.')
      if (!raw.hsnCode?.trim()) errors.push('HSN Code is required for a new product.')
    }

    // --- Scalar/select/number/boolean/date fields ---
    const data: Record<string, unknown> = {}
    const meta: Record<string, unknown> = {}
    const googleMerchant: Record<string, unknown> = {}

    for (const col of TEMPLATE_COLUMNS) {
      if (col.key.startsWith('spec_')) continue
      if (['brand', 'categories', 'imageUrls', 'slug', 'sku', 'title'].includes(col.key)) continue

      const rawValue = raw[col.key]
      if (!rawValue) continue

      const { value, error } = coerceScalar(col, rawValue)
      if (error) {
        errors.push(error)
        continue
      }
      if (value === undefined) continue

      if (col.key.startsWith('googleMerchant_')) {
        googleMerchant[col.key.replace('googleMerchant_', '')] = value
      } else if (col.key === 'metaTitle') {
        meta.title = value
      } else if (col.key === 'metaDescription') {
        meta.description = value
      } else {
        data[col.key] = value
      }
    }

    if (Object.keys(meta).length > 0) data.meta = meta
    if (Object.keys(googleMerchant).length > 0) data.googleMerchant = googleMerchant

    if (titleRaw) data.title = titleRaw
    if (sku) data.sku = sku

    if (raw.description?.trim()) data.description = textToLexical(raw.description.trim())

    if (raw.priceInINR) {
      const rupees = Number(raw.priceInINR)
      if (!Number.isNaN(rupees)) data.priceInINR = Math.round(rupees * 100)
    }
    if (raw.compareAtPriceInINR) {
      const rupees = Number(raw.compareAtPriceInINR)
      if (!Number.isNaN(rupees)) data.compareAtPriceInINR = Math.round(rupees * 100)
    }

    // --- Slug ---
    if (raw.slug?.trim()) {
      data.slug = slugify(raw.slug.trim())
    } else if (action === 'create' && titleRaw) {
      data.slug = slugify(titleRaw)
    }

    // --- Brand (resolve by title or slug) ---
    if (raw.brand?.trim()) {
      const brandName = raw.brand.trim()
      const found = await payload.find({
        collection: 'brands',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        where: { or: [{ title: { equals: brandName } }, { slug: { equals: brandName } }] },
      })
      if (found.docs[0]) {
        data.brand = found.docs[0].id
      } else {
        errors.push(`Brand "${brandName}" not found — check the Reference Lists sheet.`)
      }
    }

    // --- Categories (resolve each by title or slug) ---
    if (raw.categories?.trim()) {
      const names = splitPipeList(raw.categories)
      const categoryIds: number[] = []
      for (const name of names) {
        const found = await payload.find({
          collection: 'categories',
          depth: 0,
          limit: 1,
          overrideAccess: true,
          where: { or: [{ title: { equals: name } }, { slug: { equals: name } }] },
        })
        if (found.docs[0]) {
          categoryIds.push(found.docs[0].id)
        } else {
          errors.push(`Category "${name}" not found — check the Reference Lists sheet.`)
        }
      }
      if (categoryIds.length > 0) data.categories = categoryIds
    }

    // --- Highlights (pipeList of text -> array of { text }) ---
    if (raw.highlights?.trim()) {
      data.highlights = splitPipeList(raw.highlights).map((text) => ({ text }))
    }

    // --- Image URLs (validated for shape only — downloaded during commit) ---
    const imageUrls = raw.imageUrls?.trim() ? splitPipeList(raw.imageUrls) : []
    for (const url of imageUrls) {
      if (!/^https?:\/\//i.test(url)) errors.push(`Image URL "${url}" is not a valid http(s) URL.`)
    }

    // --- Specs ---
    const specs = buildSpecs(raw, errors)
    if (Object.keys(specs).length > 0) data.specs = specs

    results.push({
      rowNumber,
      action: errors.length > 0 ? 'error' : action,
      sku,
      title: titleRaw,
      errors,
      productId: existing?.id,
      data: errors.length > 0 ? undefined : data,
      imageUrls,
    })
  }

  return { rows: results, truncated }
}
