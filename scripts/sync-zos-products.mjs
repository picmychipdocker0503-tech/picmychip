import 'dotenv/config'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { Client } = require('../node_modules/.pnpm/pg@8.20.0/node_modules/pg')

const COLLECTION_URL =
  'https://www.picmychip.com/zos-api/collections/1911056000002073343?include_products=true&per_page=50&page='

const APPLY = process.argv.includes('--apply')
const CREATE_MISSING = process.argv.includes('--create-missing')

const MANUAL_TITLE_MATCHES = new Map([
  ['yellow banana 4mm connector', 'yellow banana connector'],
  ['m2 5x8mm', 'm2 5x8mm screw'],
])

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function slugify(value) {
  return normalize(value).replace(/\s+/g, '-')
}

function compact(value) {
  return normalize(value).replace(/[^a-z0-9]/g, '')
}

function text(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function numberFrom(value) {
  if (value === undefined || value === null || value === '') return undefined
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : undefined
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '')
}

function getSourceTitle(product) {
  return text(firstDefined(product.name, product.product_name, product.item_name, product.title))
}

function getSourceSku(product) {
  return text(
    firstDefined(
      product.sku,
      product.sku_name,
      product.cf_sku,
      product.product_code,
      product.variants?.[0]?.sku,
      product.variants?.[0]?.part_number,
    ),
  )
}

function getSourceId(product) {
  return text(firstDefined(product.product_id, product.item_id, product.id))
}

function getSourceDescription(product) {
  return text(
    firstDefined(
      product.description,
      product.product_description,
      product.long_description,
      product.short_description,
      product.seo_description,
    ),
  )
}

function getSourceMetaDescription(product) {
  return text(firstDefined(product.seo_description, product.meta_description, getSourceDescription(product)))
}

function getSourceInventory(product) {
  const variantStock = Array.isArray(product.variants)
    ? product.variants
        .map((variant) =>
          numberFrom(
            firstDefined(
              variant.available_stock,
              variant.available_stock_formatted,
              variant.stock_on_hand,
              variant.actual_available_stock,
              variant.quantity_available,
              variant.inventory,
            ),
          ),
        )
        .filter(Number.isFinite)
    : []

  const productStock = numberFrom(
    firstDefined(
      product.available_stock,
      product.available_stock_formatted,
      product.stock_on_hand,
      product.actual_available_stock,
      product.quantity_available,
      product.inventory,
    ),
  )

  if (variantStock.length > 0) return variantStock.reduce((sum, value) => sum + value, 0)
  return productStock
}

function getSourceStockStatus(product) {
  const raw = normalize(
    firstDefined(
      product.stock_status,
      product.stock_availability,
      product.availability,
      product.status,
      product.product_status,
    ),
  )
  const inventory = getSourceInventory(product)

  if (raw.includes('out') || raw.includes('unavailable') || raw.includes('inactive')) return 'out-of-stock'
  if (raw.includes('backorder')) return 'backorder'
  if (inventory !== undefined) {
    if (inventory <= 0) return 'out-of-stock'
    if (inventory <= 5) return 'low-stock'
    return 'in-stock'
  }
  if (raw.includes('active') || raw.includes('available') || raw.includes('stock')) return 'in-stock'
  return undefined
}

function getSourcePrice(product) {
  const rupees = numberFrom(
    firstDefined(product.max_rate, product.min_rate, product.rate, product.variants?.[0]?.rate, product.variants?.[0]?.label_rate),
  )
  return rupees === undefined ? undefined : Math.round(rupees * 100)
}

function getSourceHsn(product) {
  return text(firstDefined(product.hsn_or_sac, product.hsn, product.variants?.[0]?.hsn_or_sac))
}

function getSourceCategoryName(product) {
  return text(firstDefined(product.category_name, product.category, product.collection_name))
}

function toLexicalDescription(description) {
  if (!description) return null
  const paragraphs = description
    .split(/\r?\n+/)
    .map((line) => text(line))
    .filter(Boolean)

  if (paragraphs.length === 0) return null

  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: null,
      children: paragraphs.map((paragraph) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: null,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            mode: 'normal',
            text: paragraph,
            type: 'text',
            style: '',
            detail: 0,
            format: 0,
            version: 1,
          },
        ],
      })),
    },
  }
}

async function fetchSourceProducts() {
  const products = []
  for (let page = 1; page <= 100; page += 1) {
    const response = await fetch(`${COLLECTION_URL}${page}`)
    if (!response.ok) throw new Error(`Source API failed page ${page}: ${response.status}`)
    const data = await response.json()
    const pageProducts = data.collection?.products || []
    products.push(...pageProducts)
    if (!data.collection?.page_context?.has_more_page) break
  }
  return products
}

async function readExistingProducts(client) {
  const result = await client.query(`
    select id, title, slug, sku, zoho_item_id, inventory, stock_status, meta_description, price_in_i_n_r
    from products
    where deleted_at is null
    order by id
  `)
  return result.rows
}

async function readCategories(client) {
  const result = await client.query(`
    select id, title, slug
    from categories
  `)

  const byName = new Map()
  const bySlug = new Map()
  for (const category of result.rows) {
    if (category.title) byName.set(normalize(category.title), category)
    if (category.slug) bySlug.set(normalize(category.slug), category)
  }
  return { byName, bySlug }
}

function buildIndexes(existingProducts) {
  const byZohoId = new Map()
  const bySku = new Map()
  const bySlug = new Map()
  const byTitle = new Map()
  const byCompactTitle = new Map()

  for (const product of existingProducts) {
    if (product.zoho_item_id) byZohoId.set(normalize(product.zoho_item_id), product)
    if (product.sku) bySku.set(normalize(product.sku), product)
    if (product.slug) bySlug.set(normalize(product.slug), product)
    if (product.title) byTitle.set(normalize(product.title), product)
    if (product.title) byCompactTitle.set(compact(product.title), product)
  }

  return { byZohoId, bySku, bySlug, byTitle, byCompactTitle }
}

function matchSourceProduct(source, indexes) {
  const sourceId = getSourceId(source)
  const sku = getSourceSku(source)
  const title = getSourceTitle(source)

  const candidates = [
    { by: 'zoho_item_id', product: sourceId ? indexes.byZohoId.get(normalize(sourceId)) : undefined },
    { by: 'sku', product: sku ? indexes.bySku.get(normalize(sku)) : undefined },
    { by: 'slug', product: title ? indexes.bySlug.get(slugify(title)) : undefined },
    { by: 'title', product: title ? indexes.byTitle.get(normalize(title)) : undefined },
    { by: 'compact_title', product: title ? indexes.byCompactTitle.get(compact(title)) : undefined },
    {
      by: 'manual_title',
      product: title ? indexes.byTitle.get(MANUAL_TITLE_MATCHES.get(normalize(title))) : undefined,
    },
  ]

  return candidates.find((candidate) => candidate.product)
}

function findHighConfidenceMatch(source, existingProducts) {
  const [best] = findClosestExisting(source, existingProducts)
  if (!best || best.score < 0.88) return undefined
  return { by: 'high_confidence_title', product: existingProducts.find((product) => product.id === best.productId) }
}

function similarity(left, right) {
  const a = normalize(left)
  const b = normalize(right)
  if (!a || !b) return 0

  const aWords = new Set(a.split(' '))
  const bWords = new Set(b.split(' '))
  const shared = [...aWords].filter((word) => bWords.has(word)).length
  const total = new Set([...aWords, ...bWords]).size
  return total > 0 ? shared / total : 0
}

function findClosestExisting(source, existingProducts) {
  const sourceTitle = getSourceTitle(source)
  return existingProducts
    .map((product) => ({
      productId: product.id,
      title: product.title,
      slug: product.slug,
      score: similarity(sourceTitle, product.title),
    }))
    .filter((candidate) => candidate.score >= 0.4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

function buildUpdate(source) {
  const description = getSourceDescription(source)
  const metaDescription = getSourceMetaDescription(source)
  const inventory = getSourceInventory(source)
  const stockStatus = getSourceStockStatus(source)

  return {
    description: toLexicalDescription(description),
    meta_description: metaDescription || null,
    inventory,
    stock_status: stockStatus,
    price_in_i_n_r: getSourcePrice(source),
    hsn_code: getSourceHsn(source),
    zoho_item_id: getSourceId(source),
  }
}

async function applyUpdate(client, productId, update) {
  await client.query(
    `
      update products
      set
        description = coalesce($2::jsonb, description),
        meta_description = coalesce($3, meta_description),
        inventory = coalesce($4, inventory),
        stock_status = coalesce($5::enum_products_stock_status, stock_status),
        price_in_i_n_r = coalesce($6, price_in_i_n_r),
        hsn_code = coalesce(nullif($7, ''), hsn_code),
        zoho_item_id = coalesce(nullif($8, ''), zoho_item_id),
        updated_at = now()
      where id = $1
    `,
    [
      productId,
      update.description ? JSON.stringify(update.description) : null,
      update.meta_description,
      update.inventory,
      update.stock_status,
      update.price_in_i_n_r,
      update.hsn_code,
      update.zoho_item_id,
    ],
  )
}

async function ensureUniqueSlug(client, baseSlug) {
  const fallback = baseSlug || `product-${Date.now()}`
  for (let index = 0; index < 100; index += 1) {
    const slug = index === 0 ? fallback : `${fallback}-${index + 1}`
    const existing = await client.query('select id from products where slug = $1 and deleted_at is null limit 1', [slug])
    if (existing.rowCount === 0) return slug
  }
  return `${fallback}-${Date.now()}`
}

function getSourceTags(product) {
  const tags = Array.isArray(product.product_tags) ? product.product_tags : []
  return tags.map((tag) => text(tag?.name || tag)).filter(Boolean)
}

async function createProduct(client, source, categoryIndexes) {
  const title = getSourceTitle(source)
  const update = buildUpdate(source)
  const slug = await ensureUniqueSlug(client, slugify(title))
  const sku = getSourceSku(source)
  const categoryName = getSourceCategoryName(source)
  const category =
    categoryIndexes.byName.get(normalize(categoryName)) || categoryIndexes.bySlug.get(slugify(categoryName))

  const inserted = await client.query(
    `
      insert into products (
        title,
        description,
        inventory,
        enable_variants,
        price_in_i_n_r_enabled,
        price_in_i_n_r,
        meta_title,
        meta_description,
        featured,
        spec_schema_type,
        stock_status,
        low_stock_threshold,
        weight_in_grams,
        sku,
        hsn_code,
        zoho_item_id,
        gst_percent,
        on_sale,
        is_clearance,
        is_gift_card,
        generate_slug,
        slug,
        updated_at,
        created_at,
        _status
      ) values (
        $1, $2::jsonb, $3, false, true, $4, $5, $6, false, 'none',
        coalesce($7::enum_products_stock_status, 'out-of-stock'::enum_products_stock_status),
        5, 50, $8, $9, $10, 18, false, false, false, true, $11, now(), now(), 'draft'
      )
      returning id
    `,
    [
      title,
      update.description ? JSON.stringify(update.description) : null,
      update.inventory ?? 0,
      update.price_in_i_n_r ?? 0,
      title,
      update.meta_description,
      update.stock_status,
      sku || getSourceId(source),
      update.hsn_code || null,
      update.zoho_item_id,
      slug,
    ],
  )

  const productId = inserted.rows[0].id
  if (category?.id) {
    await client.query(
      `
        insert into products_rels (parent_id, path, categories_id, "order")
        values ($1, 'categories', $2, 0)
      `,
      [productId, category.id],
    )
  }

  return { productId, slug, category: category?.title || null, tags: getSourceTags(source) }
}

async function main() {
  const [sourceProducts, client] = await Promise.all([
    fetchSourceProducts(),
    (async () => {
      const c = new Client({ connectionString: process.env.DATABASE_URL })
      await c.connect()
      return c
    })(),
  ])

  try {
    const existingProducts = await readExistingProducts(client)
    const categoryIndexes = await readCategories(client)
    const indexes = buildIndexes(existingProducts)
    const matched = []
    const unmatched = []
    const created = []

    for (const source of sourceProducts) {
      const match = matchSourceProduct(source, indexes) || findHighConfidenceMatch(source, existingProducts)
      if (!match?.product) {
        const unmatchedItem = {
          sourceId: getSourceId(source),
          sku: getSourceSku(source),
          title: getSourceTitle(source),
          price: getSourcePrice(source),
          inventory: getSourceInventory(source),
          stockStatus: getSourceStockStatus(source),
          category: getSourceCategoryName(source),
          closestExisting: findClosestExisting(source, existingProducts),
        }
        unmatched.push(unmatchedItem)
        if (APPLY && CREATE_MISSING) {
          created.push({
            ...unmatchedItem,
            ...(await createProduct(client, source, categoryIndexes)),
          })
        }
        continue
      }

      const update = buildUpdate(source)
      matched.push({
        by: match.by,
        productId: match.product.id,
        currentTitle: match.product.title,
        sourceId: getSourceId(source),
        sourceSku: getSourceSku(source),
        sourceTitle: getSourceTitle(source),
        price: update.price_in_i_n_r,
        hsnCode: update.hsn_code,
        inventory: update.inventory,
        stockStatus: update.stock_status,
        hasDescription: Boolean(update.description),
        hasMetaDescription: Boolean(update.meta_description),
      })

      if (APPLY) {
        await applyUpdate(client, match.product.id, update)
      }
    }

    console.log(
      JSON.stringify(
        {
          mode: APPLY ? 'apply' : 'dry-run',
          createMissing: CREATE_MISSING,
          sourceCount: sourceProducts.length,
          existingCount: existingProducts.length,
          matchedCount: matched.length,
          unmatchedCount: unmatched.length,
          createdCount: created.length,
          matchCountsByKey: matched.reduce((counts, item) => {
            counts[item.by] = (counts[item.by] || 0) + 1
            return counts
          }, {}),
          matchedSample: matched.slice(0, 25),
          created,
          unmatched,
        },
        null,
        2,
      ),
    )
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
