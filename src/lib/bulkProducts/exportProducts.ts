import type { Payload } from 'payload'

import ExcelJS from 'exceljs'

import type { Media, Product } from '@/payload-types'

import { getServerSideURL } from '@/utilities/getURL'
import { richTextToPlainText } from '@/utilities/richTextToPlainText'

import { buildReferenceSheets } from './buildReferenceSheets'
import { TEMPLATE_COLUMNS } from './templateColumns'

const MAX_EXPORT_ROWS = 5000

const isObject = <T>(value: unknown): value is T => typeof value === 'object' && value !== null

const joinPipe = (values: (string | number | null | undefined)[]): string =>
  values.filter((value) => value !== null && value !== undefined && value !== '').join('|')

function flattenProductToRow(product: Product, baseUrl: string): Record<string, string | number | boolean> {
  const row: Record<string, string | number | boolean> = {}

  row.sku = product.sku || ''
  row.slug = product.slug || ''
  row.status = product._status || 'draft'
  row.title = product.title || ''
  row.brand = isObject<{ title?: string | null }>(product.brand) ? product.brand.title || '' : ''
  row.categories = joinPipe(
    (product.categories || []).map((category) => (isObject<{ title?: string | null }>(category) ? category.title : undefined)),
  )
  row.tags = joinPipe(product.tags || [])
  row.highlights = joinPipe((product.highlights || []).map((item) => item.text))
  row.customSpecs = joinPipe((product.customSpecs || []).map((item) => (item.label && item.value ? `${item.label}: ${item.value}` : undefined)))
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

  // Media URLs may already be absolute (CDN-hosted, e.g. assets.picmychip.in)
  // or relative (local /media/... storage) — only prepend this site's own
  // domain in the relative case, or an already-absolute CDN URL ends up
  // double-prefixed (e.g. "https://www.picmychip.inhttps://assets...").
  row.imageUrls = joinPipe(
    (product.gallery || [])
      .map((item) => (isObject<Media>(item.image) ? item.image.url : undefined))
      .map((url) => (url ? (/^https?:\/\//i.test(url) ? url : `${baseUrl}${url}`) : undefined)),
  )

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

  // Same Instructions + Reference Lists sheets as the blank template, so an
  // exported-then-re-uploaded file carries the same column docs and live
  // category/brand values, not just raw data with no guidance.
  await buildReferenceSheets(workbook, payload)

  return workbook.xlsx.writeBuffer()
}
