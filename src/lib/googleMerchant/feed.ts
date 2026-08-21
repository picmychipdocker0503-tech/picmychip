import type { Brand, Media, Product } from '@/payload-types'
import type { Payload } from 'payload'

import { getServerSideURL } from '@/utilities/getURL'
import { richTextToPlainText } from '@/utilities/richTextToPlainText'

type MerchantProduct = Product & {
  _status?: string | null
}

const MAX_PRODUCTS_PER_PAGE = 100

function cleanText(value?: string | null): string {
  return (value || '').replace(/\s+/g, ' ').trim()
}

function escapeXml(value?: string | number | null): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function absoluteUrl(pathOrUrl?: string | null): string | undefined {
  if (!pathOrUrl) return undefined
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  return `${getServerSideURL()}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`
}

function getImageUrl(product: MerchantProduct): string | undefined {
  const galleryImage = product.gallery?.find((item) => typeof item.image === 'object')?.image
  const metaImage = typeof product.meta?.image === 'object' ? product.meta.image : undefined
  const image = (galleryImage || metaImage) as Media | undefined
  return absoluteUrl(image?.url)
}

function getAdditionalImageUrls(product: MerchantProduct): string[] {
  return (
    product.gallery
      ?.map((item) => (typeof item.image === 'object' ? absoluteUrl(item.image.url) : undefined))
      .filter((url): url is string => Boolean(url))
      .slice(1, 11) ?? []
  )
}

function getBrand(product: MerchantProduct): string | undefined {
  return typeof product.brand === 'object' && product.brand
    ? cleanText((product.brand as Brand).title)
    : undefined
}

function getDescription(product: MerchantProduct): string {
  return cleanText(
    product.meta?.description ||
      richTextToPlainText(product.description) ||
      product.highlights?.map((highlight) => highlight.text).join('. ') ||
      product.title,
  ).slice(0, 5000)
}

function getAvailability(product: MerchantProduct): string {
  if (product.stockStatus === 'out-of-stock') return 'out_of_stock'
  if (product.stockStatus === 'backorder') return 'backorder'
  return 'in_stock'
}

function getPrice(product: MerchantProduct): number | undefined {
  const activeSale =
    product.onSale &&
    product.salePriceInINR &&
    (!product.saleEndDate || new Date(product.saleEndDate).getTime() > Date.now())

  return (activeSale ? product.salePriceInINR : product.priceInINR) ?? undefined
}

function tag(name: string, value?: string | number | null): string {
  if (value === undefined || value === null || value === '') return ''
  return `<${name}>${escapeXml(value)}</${name}>`
}

function getIdentifierExists(product: MerchantProduct): 'yes' | 'no' {
  const merchant = product.googleMerchant
  if (merchant?.gtin || merchant?.mpn || product.sku || getBrand(product)) return 'yes'
  return 'no'
}

function productToXml(product: MerchantProduct): string | undefined {
  const price = getPrice(product)
  const imageUrl = getImageUrl(product)
  if (!price || !imageUrl || !product.slug) return undefined

  const merchant = product.googleMerchant
  const brand = getBrand(product)
  const mpn = cleanText(merchant?.mpn || product.sku)
  const productUrl = `${getServerSideURL()}/products/${product.slug}`

  return [
    '<item>',
    tag('g:id', product.sku || String(product.id)),
    tag('title', cleanText(product.meta?.title || product.title).slice(0, 150)),
    tag('description', getDescription(product)),
    tag('link', productUrl),
    tag('g:image_link', imageUrl),
    ...getAdditionalImageUrls(product).map((url) => tag('g:additional_image_link', url)),
    tag('g:availability', getAvailability(product)),
    tag('g:price', `${(price / 100).toFixed(2)} INR`),
    tag('g:condition', cleanText(merchant?.condition || 'new')),
    tag('g:brand', brand),
    tag('g:gtin', merchant?.gtin),
    tag('g:mpn', mpn),
    tag('g:identifier_exists', getIdentifierExists(product)),
    tag('g:google_product_category', merchant?.googleProductCategory),
    tag('g:custom_label_0', merchant?.customLabel0),
    tag('g:custom_label_1', merchant?.customLabel1),
    tag('g:custom_label_2', merchant?.customLabel2),
    tag('g:custom_label_3', merchant?.customLabel3),
    tag('g:custom_label_4', merchant?.customLabel4),
    '</item>',
  ].join('')
}

export async function buildGoogleMerchantFeed(payload: Payload): Promise<string> {
  const items: string[] = []
  let page = 1
  let hasNextPage = true

  while (hasNextPage) {
    const result = await payload.find({
      collection: 'products',
      depth: 2,
      limit: MAX_PRODUCTS_PER_PAGE,
      page,
      overrideAccess: true,
      where: {
        and: [
          { _status: { equals: 'published' } },
          { isGiftCard: { not_equals: true } },
          { 'googleMerchant.excludeFromFeed': { not_equals: true } },
        ],
      },
    })

    for (const product of result.docs as MerchantProduct[]) {
      const item = productToXml(product)
      if (item) items.push(item)
    }

    hasNextPage = result.hasNextPage
    page += 1
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    '<channel>',
    '<title>Picmychip Products</title>',
    tag('link', getServerSideURL()),
    '<description>Picmychip Google Merchant Center product feed</description>',
    ...items,
    '</channel>',
    '</rss>',
  ].join('')
}
