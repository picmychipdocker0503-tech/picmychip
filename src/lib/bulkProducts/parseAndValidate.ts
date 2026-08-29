import type { Payload } from 'payload'

import ExcelJS from 'exceljs'

import { getServerSideURL } from '@/utilities/getURL'
import { richTextToPlainText } from '@/utilities/richTextToPlainText'

import { textToLexical } from './textToLexical'
import { MAX_IMPORT_ROWS, TEMPLATE_COLUMNS, type ColumnDef } from './templateColumns'

export type RowAction = 'create' | 'update' | 'unchanged' | 'error'

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

const slugify = (input: string): string =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** Recursively strips `id` keys (Payload auto-assigns one to every array
 * sub-row) so a freshly-parsed row can be compared against a stored
 * document without every array field always looking "changed". */
const stripIds = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stripIds)
  if (value && typeof value === 'object') {
    const { id: _id, ...rest } = value as Record<string, unknown>
    return Object.fromEntries(Object.entries(rest).map(([key, val]) => [key, stripIds(val)]))
  }
  return value
}

const relationshipId = (value: unknown): unknown =>
  value && typeof value === 'object' && 'id' in (value as Record<string, unknown>) ? (value as { id: unknown }).id : value

/**
 * Subset comparison, not full deep-equality — every key present in
 * `newValue` must match, but extra keys only present on `currentValue` are
 * ignored. Needed because Payload's stored group fields (meta,
 * googleMerchant, specs) always include every sub-field (null when unset),
 * while a parsed sheet row only includes the sub-fields that were actually
 * filled in — and `payload.update` only touches keys present in its data,
 * leaving the rest as-is, so this mirrors what an update would really do.
 */
const partialEquals = (newValue: unknown, currentValue: unknown): boolean => {
  if (Array.isArray(newValue)) {
    if (!Array.isArray(currentValue) || newValue.length !== currentValue.length) return false
    return newValue.every((item, i) => partialEquals(item, currentValue[i]))
  }
  if (newValue && typeof newValue === 'object') {
    if (!currentValue || typeof currentValue !== 'object') return false
    return Object.entries(newValue).every(([key, value]) => partialEquals(value, (currentValue as Record<string, unknown>)[key]))
  }
  return newValue === currentValue
}

/**
 * True when every field the sheet row actually provided (`data`'s keys —
 * blank cells never make it into `data` in the first place) already matches
 * what's stored on `existingDoc`. An exported-then-reuploaded row with no
 * edits is the common case, and skipping the write entirely (rather than
 * running a no-op payload.update) avoids its afterChange hooks — revalidate,
 * search sync, etc. — firing for literally nothing on every import.
 */
const toAbsoluteURL = (url: string, baseUrl: string): string => (/^https?:\/\//i.test(url) ? url : `${baseUrl}${url}`)

const isRowUnchanged = (data: Record<string, unknown>, existingDoc: Record<string, unknown>, imageUrls: string[], baseUrl: string): boolean => {
  // A blank imageUrls cell means "leave the gallery alone" — only a
  // non-blank cell is a candidate to compare against the current gallery.
  if (imageUrls.length > 0) {
    const currentGallery = Array.isArray(existingDoc.gallery) ? (existingDoc.gallery as { image?: unknown }[]) : []
    const currentImageUrls = currentGallery
      .map((item) => (item.image && typeof item.image === 'object' && 'url' in item.image ? (item.image as { url?: string }).url : undefined))
      .filter((url): url is string => Boolean(url))
      .map((url) => toAbsoluteURL(url, baseUrl))

    if (JSON.stringify(imageUrls) !== JSON.stringify(currentImageUrls)) return false
  }

  for (const [key, newValue] of Object.entries(data)) {
    if (key === 'description') {
      const currentPlain = existingDoc.description ? richTextToPlainText(existingDoc.description) : ''
      const newPlain = richTextToPlainText(newValue)
      if (currentPlain.trim() !== newPlain.trim()) return false
      continue
    }

    if (key === 'brand') {
      if (relationshipId(existingDoc.brand) !== newValue) return false
      continue
    }

    if (key === 'categories') {
      const currentIds = Array.isArray(existingDoc.categories) ? existingDoc.categories.map(relationshipId) : []
      if (JSON.stringify(currentIds) !== JSON.stringify(newValue)) return false
      continue
    }

    if (!partialEquals(stripIds(newValue), stripIds(existingDoc[key]))) return false
  }
  return true
}

export async function parseAndValidateBulkProducts(
  payload: Payload,
  buffer: Buffer,
): Promise<{ rows: ParsedRow[]; truncated: boolean }> {
  const allRows = await readProductsSheet(buffer)
  const truncated = allRows.length > MAX_IMPORT_ROWS
  const rows = allRows.slice(0, MAX_IMPORT_ROWS)

  // --- Batch-resolve every lookup upfront (one query each, not one per row
  // or one per category) — with 500 rows the previous per-row querying meant
  // thousands of sequential DB round-trips, which is what made the preview
  // step slow. ---
  const skus = [...new Set(rows.map((r) => r.raw.sku?.trim()).filter((v): v is string => Boolean(v)))]
  const slugs = [...new Set(rows.map((r) => r.raw.slug?.trim()).filter((v): v is string => Boolean(v)))]

  const [existingBySkuDocs, existingBySlugDocs, allCategories, allBrands] = await Promise.all([
    skus.length
      ? payload.find({
          collection: 'products',
          depth: 0,
          limit: skus.length,
          overrideAccess: true,
          pagination: false,
          select: { sku: true },
          where: { sku: { in: skus } },
        })
      : Promise.resolve({ docs: [] as { id: number; sku?: string | null }[] }),
    slugs.length
      ? payload.find({
          collection: 'products',
          depth: 0,
          limit: slugs.length,
          overrideAccess: true,
          pagination: false,
          select: { slug: true },
          where: { slug: { in: slugs } },
        })
      : Promise.resolve({ docs: [] as { id: number; slug?: string | null }[] }),
    payload.find({
      collection: 'categories',
      depth: 0,
      limit: 1000,
      overrideAccess: true,
      pagination: false,
      select: { title: true, slug: true },
    }),
    payload.find({
      collection: 'brands',
      depth: 0,
      limit: 1000,
      overrideAccess: true,
      pagination: false,
      select: { title: true, slug: true },
    }),
  ])

  const existingBySku = new Map(existingBySkuDocs.docs.filter((d) => d.sku).map((d) => [d.sku as string, d.id]))
  const existingBySlug = new Map(existingBySlugDocs.docs.filter((d) => d.slug).map((d) => [d.slug as string, d.id]))

  const categoryByName = new Map<string, number>()
  for (const category of allCategories.docs) {
    if (category.title) categoryByName.set(category.title.toLowerCase(), category.id)
    if (category.slug) categoryByName.set(category.slug.toLowerCase(), category.id)
  }

  const brandByName = new Map<string, number>()
  for (const brand of allBrands.docs) {
    if (brand.title) brandByName.set(brand.title.toLowerCase(), brand.id)
    if (brand.slug) brandByName.set(brand.slug.toLowerCase(), brand.id)
  }

  const results: ParsedRow[] = []

  for (const { rowNumber, raw } of rows) {
    const errors: string[] = []
    const sku = raw.sku?.trim() || undefined
    const titleRaw = raw.title?.trim() || undefined

    // --- Match against an existing product ---
    let existingId: number | undefined = sku ? existingBySku.get(sku) : undefined
    if (!existingId && raw.slug?.trim()) existingId = existingBySlug.get(raw.slug.trim())
    const existing = existingId ? { id: existingId } : undefined

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
      if (['brand', 'categories', 'imageUrls', 'slug', 'sku', 'status', 'title'].includes(col.key)) continue

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

    // --- Status (Payload's actual field is `_status`, not `status`) ---
    if (raw.status?.trim()) {
      const normalized = raw.status.trim().toLowerCase()
      if (normalized === 'draft' || normalized === 'published') {
        data._status = normalized
      } else {
        errors.push(`"status" must be "draft" or "published" — got "${raw.status}"`)
      }
    }

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
    // An explicitly-provided slug is used verbatim, never re-slugified —
    // Payload's own slugField() may already format slugs differently than
    // this file's slugify() (e.g. collapsing repeated separators), and for
    // an update row the value came straight from an export of the current,
    // already-correct slug. Re-running it through a different algorithm
    // here would silently change a live product URL on every bulk update.
    // Auto-derivation only kicks in for a genuinely new product with no
    // slug column filled in at all.
    if (raw.slug?.trim()) {
      data.slug = raw.slug.trim()
    } else if (action === 'create' && titleRaw) {
      data.slug = slugify(titleRaw)
    }

    // --- Brand (resolve by title or slug) ---
    if (raw.brand?.trim()) {
      const brandName = raw.brand.trim()
      const brandId = brandByName.get(brandName.toLowerCase())
      if (brandId) {
        data.brand = brandId
      } else {
        errors.push(`Brand "${brandName}" not found — check the Reference Lists sheet.`)
      }
    }

    // --- Categories (resolve each by title or slug) ---
    if (raw.categories?.trim()) {
      const names = splitPipeList(raw.categories)
      const categoryIds: number[] = []
      for (const name of names) {
        const categoryId = categoryByName.get(name.toLowerCase())
        if (categoryId) {
          categoryIds.push(categoryId)
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

    // --- Custom Specs (pipeList of "Label: Value" -> array of { label, value }) ---
    if (raw.customSpecs?.trim()) {
      const customSpecs: { label: string; value: string }[] = []
      for (const item of splitPipeList(raw.customSpecs)) {
        const colonIndex = item.indexOf(':')
        if (colonIndex === -1) {
          errors.push(`"customSpecs" entry "${item}" must be in "Label: Value" format.`)
          continue
        }
        const label = item.slice(0, colonIndex).trim()
        const value = item.slice(colonIndex + 1).trim()
        if (!label || !value) {
          errors.push(`"customSpecs" entry "${item}" must be in "Label: Value" format.`)
          continue
        }
        customSpecs.push({ label, value })
      }
      if (customSpecs.length > 0) data.customSpecs = customSpecs
    }

    // --- Image URLs (validated for shape only — downloaded during commit) ---
    const imageUrls = raw.imageUrls?.trim() ? splitPipeList(raw.imageUrls) : []
    for (const url of imageUrls) {
      if (!/^https?:\/\//i.test(url)) errors.push(`Image URL "${url}" is not a valid http(s) URL.`)
    }

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

  // --- Downgrade "update" to "unchanged" wherever the row's data already
  // matches what's stored — one batch fetch for every update-candidate,
  // not a query per row. ---
  const updateCandidateIds = [...new Set(results.filter((r) => r.action === 'update' && r.productId).map((r) => r.productId as number))]

  if (updateCandidateIds.length > 0) {
    const baseUrl = getServerSideURL()
    const { docs: existingDocs } = await payload.find({
      collection: 'products',
      depth: 1,
      limit: updateCandidateIds.length,
      overrideAccess: true,
      pagination: false,
      where: { id: { in: updateCandidateIds } },
    })
    const existingDocById = new Map(existingDocs.map((doc) => [doc.id, doc as unknown as Record<string, unknown>]))

    for (const row of results) {
      if (row.action !== 'update' || !row.productId || !row.data) continue
      const existingDoc = existingDocById.get(row.productId)
      if (existingDoc && isRowUnchanged(row.data, existingDoc, row.imageUrls, baseUrl)) {
        row.action = 'unchanged'
      }
    }
  }

  return { rows: results, truncated }
}
