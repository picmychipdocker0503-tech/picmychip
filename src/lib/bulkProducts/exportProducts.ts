import type { Payload } from 'payload'

import ExcelJS from 'exceljs'

import type { Media, Product } from '@/payload-types'

import { getServerSideURL } from '@/utilities/getURL'
import { richTextToPlainText } from '@/utilities/richTextToPlainText'

import { TEMPLATE_COLUMNS } from './templateColumns'

const MAX_EXPORT_ROWS = 5000

const isObject = <T>(value: unknown): value is T => typeof value === 'object' && value !== null

/** Reads a (possibly deeply-nested) path like "mechanical.dimensions.lengthMM"
 * off an arbitrary object, returning undefined if any segment is missing. */
const getPath = (obj: unknown, path: string[]): unknown =>
  path.reduce<unknown>(
    (acc, key) => (isObject<Record<string, unknown>>(acc) ? acc[key] : undefined),
    obj,
  )

const DIMENSION_FIELDS = new Set(['lengthMM', 'widthMM', 'heightMM', 'boreDiameterMM'])

function specColumnValue(product: Product, schemaKey: string, fieldKey: string): unknown {
  const specs = product.specs as Record<string, unknown> | undefined
  if (!specs) return undefined

  if (schemaKey === 'mechanical' && DIMENSION_FIELDS.has(fieldKey)) {
    return getPath(specs, ['mechanical', 'dimensions', fieldKey])
  }
  return getPath(specs, [schemaKey, fieldKey])
}

const joinPipe = (values: (string | number | null | undefined)[]): string =>
  values.filter((value) => value !== null && value !== undefined && value !== '').join('|')

function flattenProductToRow(product: Product, baseUrl: string): Record<string, string | number | boolean> {
  const row: Record<string, string | number | boolean> = {}

  row.sku = product.sku || ''
  row.slug = product.slug || ''
  row.title = product.title || ''
  row.brand = isObject<{ title?: string | null }>(product.brand) ? product.brand.title || '' : ''
  row.categories = joinPipe(
    (product.categories || []).map((category) => (isObject<{ title?: string | null }>(category) ? category.title : undefined)),
  )
  row.tags = joinPipe(product.tags || [])
  row.highlights = joinPipe((product.highlights || []).map((item) => item.text))
  row.featured = Boolean(product.featured)
  row.hsnCode = product.hsnCode || ''
  row.description = product.description ? richTextToPlainText(product.description) : ''

  if (typeof product.priceInINR === 'number') row.priceInINR = product.priceInINR / 100
  if (typeof product.compareAtPriceInINR === 'number') row.compareAtPriceInINR = product.compareAtPriceInINR / 100
  if (typeof product.gstPercent === 'number') row.gstPercent = product.gstPercent
  row.onSale = Boolean(product.onSale)
  if (product.saleType) row.saleType = product.saleType
  if (typeof product.discountValue === 'number') row.discountValue = product.discountValue
  if (product.saleEndDate) row.saleEndDate = String(product.saleEndDate).slice(0, 10)
  row.isClearance = Boolean(product.isClearance)
  row.clearanceReason = product.clearanceReason || ''

  if (typeof product.inventory === 'number') row.inventory = product.inventory
  if (typeof product.lowStockThreshold === 'number') row.lowStockThreshold = product.lowStockThreshold
  if (typeof product.weightInGrams === 'number') row.weightInGrams = product.weightInGrams
  if (typeof product.leadTimeDays === 'number') row.leadTimeDays = product.leadTimeDays

  row.metaTitle = product.meta?.title || ''
  row.metaDescription = product.meta?.description || ''

  row.googleMerchant_excludeFromFeed = Boolean(product.googleMerchant?.excludeFromFeed)
  row.googleMerchant_googleProductCategory = product.googleMerchant?.googleProductCategory || ''
  row.googleMerchant_gtin = product.googleMerchant?.gtin || ''
  row.googleMerchant_mpn = product.googleMerchant?.mpn || ''
  row.googleMerchant_condition = product.googleMerchant?.condition || ''

  row.imageUrls = joinPipe(
    (product.gallery || [])
      .map((item) => (isObject<Media>(item.image) ? item.image.url : undefined))
      .map((url) => (url ? `${baseUrl}${url}` : undefined)),
  )

  if (product.specSchemaType) row.specSchemaType = product.specSchemaType

  for (const col of TEMPLATE_COLUMNS) {
    if (!col.key.startsWith('spec_')) continue
    const withoutPrefix = col.key.slice('spec_'.length)
    const underscoreIndex = withoutPrefix.indexOf('_')
    const schemaKey = withoutPrefix.slice(0, underscoreIndex)
    const fieldKey = withoutPrefix.slice(underscoreIndex + 1)

    const value = specColumnValue(product, schemaKey, fieldKey)
    if (value === undefined || value === null) continue

    if (Array.isArray(value)) {
      row[col.key] = joinPipe(value)
    } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      row[col.key] = value
    }
  }

  return row
}

export async function generateProductsExport(payload: Payload): Promise<ExcelJS.Buffer> {
  const baseUrl = getServerSideURL()

  const { docs: products } = await payload.find({
    collection: 'products',
    depth: 1,
    limit: MAX_EXPORT_ROWS,
    overrideAccess: true,
    pagination: false,
    sort: 'title',
  })

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Picmychip Admin'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Products')
  sheet.columns = TEMPLATE_COLUMNS.map((col) => ({
    header: col.key,
    key: col.key,
    width: Math.max(18, col.key.length + 2),
  }))
  sheet.getRow(1).font = { bold: true }
  sheet.views = [{ state: 'frozen', ySplit: 1 }]

  for (const product of products) {
    sheet.addRow(flattenProductToRow(product, baseUrl))
  }

  return workbook.xlsx.writeBuffer()
}
