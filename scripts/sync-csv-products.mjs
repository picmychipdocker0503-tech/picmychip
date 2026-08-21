import 'dotenv/config'
import fs from 'node:fs/promises'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { Client } = require('../node_modules/.pnpm/pg@8.20.0/node_modules/pg')

const APPLY = process.argv.includes('--apply')
const CREATE_MISSING = process.argv.includes('--create-missing')
const csvArg = process.argv.find((arg) => arg.startsWith('--csv='))
const CSV_PATH = csvArg?.slice('--csv='.length)

if (!CSV_PATH) {
  console.error('Usage: node scripts/sync-csv-products.mjs --csv=<path> [--apply] [--create-missing]')
  process.exit(1)
}

const MANUAL_TITLE_MATCHES = new Map([
  ['yellow banana 4mm connector', 'yellow banana connector'],
  ['m2 5x8mm', 'm2 5x8mm screw'],
  ['usb a male to mini usb cable 1 5 meter', 'usb type a male to mini usb cable 1 5 meter'],
  ['usb a male to usb a male cable 3meters', 'usb type a male to type a male 3 meter cable'],
  [
    '2pcs car inspection socket 2mm multimeter voltage voltmeter testing insulation piercing clip tool for wire puncture',
    'car inspection socket 2mm 2pcs 1 pair red and black multimeter voltage testing clip',
  ],
])

function parseCsv(content) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index]
    const next = content[index + 1]

    if (char === '"') {
      if (quoted && next === '"') {
        cell += '"'
        index += 1
      } else {
        quoted = !quoted
      }
      continue
    }

    if (char === ',' && !quoted) {
      row.push(cell)
      cell = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1
      row.push(cell)
      if (row.some((value) => value !== '')) rows.push(row)
      row = []
      cell = ''
      continue
    }

    cell += char
  }

  row.push(cell)
  if (row.some((value) => value !== '')) rows.push(row)

  const [headers, ...dataRows] = rows
  return dataRows.map((dataRow) =>
    Object.fromEntries(headers.map((header, index) => [header, dataRow[index] ?? ''])),
  )
}

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
  const parsed = Number(String(value).replace(/[^0-9.eE+-]/g, ''))
  return Number.isFinite(parsed) ? parsed : undefined
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '')
}

function extractFromVariants(row, field) {
  const variants = String(row.variants || '')
  const quoted = variants.match(new RegExp(`['"]${field}['"]\\s*:\\s*['"]([^'"]*)['"]`))
  if (quoted) return quoted[1]
  const plain = variants.match(new RegExp(`['"]${field}['"]\\s*:\\s*([^,}\\]]+)`))
  return plain?.[1]?.trim()
}

function getSourceTitle(row) {
  return text(firstDefined(row.name, row.product_name, row.item_name, row.title, row.alter_text))
}

function getSourceSku(row) {
  return text(firstDefined(row.sku, row.sku_name, row.cf_sku, row.product_code, extractFromVariants(row, 'sku'), extractFromVariants(row, 'part_number')))
}

function getSourceId(row) {
  const id = text(firstDefined(row.product_id, row.item_id, row.id))
  if (/^\d{8,}$/.test(id)) return id
  if (/e\+/i.test(id)) return text(extractFromVariants(row, 'variant_id'))
  return id || text(extractFromVariants(row, 'variant_id'))
}

function getSourceDescription(row) {
  return text(
    firstDefined(
      row.product_description,
      row.product_short_description,
      row.description,
      row.long_description,
      row.short_description,
      row.seo_description,
    ),
  )
}

function getSourceMetaDescription(row) {
  return text(firstDefined(row.seo_description, row.meta_description, getSourceDescription(row)))
}

function getSourceInventory(row) {
  const inventory = numberFrom(
    firstDefined(
      row.overall_stock,
      row.overall_stock_formatted,
      row.available_stock,
      row.stock_on_hand,
      extractFromVariants(row, 'available_stock'),
      extractFromVariants(row, 'stock_on_hand'),
      extractFromVariants(row, 'actual_available_stock'),
    ),
  )
  return inventory
}

function getSourceStockStatus(row) {
  const raw = normalize(firstDefined(row.stock_status, row.stock_availability, row.availability, row.status, extractFromVariants(row, 'status')))
  const inventory = getSourceInventory(row)

  if (raw.includes('inactive') || raw.includes('out') || raw.includes('unavailable')) return 'out-of-stock'
  if (raw.includes('backorder')) return 'backorder'
  if (inventory !== undefined) {
    if (inventory <= 0) return 'out-of-stock'
    if (inventory <= 5) return 'low-stock'
    return 'in-stock'
  }
  if (raw.includes('active') || raw.includes('available') || raw.includes('stock')) return 'in-stock'
  return undefined
}

function getSourcePrice(row) {
  const rupees = numberFrom(
    firstDefined(row.max_rate, row.min_rate, row.rate, extractFromVariants(row, 'rate'), extractFromVariants(row, 'label_rate')),
  )
  return rupees === undefined ? undefined : Math.round(rupees * 100)
}

function getSourceHsn(row) {
  return text(firstDefined(row.hsn_or_sac, row.hsn, extractFromVariants(row, 'hsn_or_sac')))
}

function getSourceCategoryName(row) {
  return text(firstDefined(row.category_name, row.category, row.collection_name))
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
  const result = await client.query('select id, title, slug from categories')
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

function findClosestExisting(row, existingProducts) {
  const sourceTitle = getSourceTitle(row)
  return existingProducts
    .map((product) => {
      const a = new Set(normalize(sourceTitle).split(' ').filter(Boolean))
      const b = new Set(normalize(product.title).split(' ').filter(Boolean))
      const shared = [...a].filter((word) => b.has(word)).length
      const total = new Set([...a, ...b]).size
      return { productId: product.id, title: product.title, slug: product.slug, score: total > 0 ? shared / total : 0 }
    })
    .filter((candidate) => candidate.score >= 0.4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

function matchSourceProduct(row, indexes) {
  const sourceId = getSourceId(row)
  const sku = getSourceSku(row)
  const title = getSourceTitle(row)

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

function buildUpdate(row) {
  const description = getSourceDescription(row)
  return {
    description: toLexicalDescription(description),
    meta_description: getSourceMetaDescription(row) || null,
    inventory: getSourceInventory(row),
    stock_status: getSourceStockStatus(row),
    price_in_i_n_r: getSourcePrice(row),
    hsn_code: getSourceHsn(row),
    zoho_item_id: getSourceId(row),
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
        zoho_item_id = coalesce(nullif(zoho_item_id, ''), nullif($8, '')),
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

async function createProduct(client, row, categoryIndexes) {
  const title = getSourceTitle(row)
  const update = buildUpdate(row)
  const slug = await ensureUniqueSlug(client, slugify(title))
  const sku = getSourceSku(row)
  const categoryName = getSourceCategoryName(row)
  const category =
    categoryIndexes.byName.get(normalize(categoryName)) || categoryIndexes.bySlug.get(slugify(categoryName))

  const inserted = await client.query(
    `
      insert into products (
        title, description, inventory, enable_variants, price_in_i_n_r_enabled, price_in_i_n_r,
        meta_title, meta_description, featured, spec_schema_type, stock_status, low_stock_threshold,
        weight_in_grams, sku, hsn_code, zoho_item_id, gst_percent, on_sale, is_clearance,
        is_gift_card, generate_slug, slug, updated_at, created_at, _status
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
      sku || update.zoho_item_id,
      update.hsn_code || null,
      update.zoho_item_id,
      slug,
    ],
  )

  const productId = inserted.rows[0].id
  if (category?.id) {
    await client.query('insert into products_rels (parent_id, path, categories_id, "order") values ($1, $2, $3, 0)', [
      productId,
      'categories',
      category.id,
    ])
  }

  return { productId, slug, category: category?.title || null }
}

async function main() {
  const csv = await fs.readFile(CSV_PATH, 'utf8')
  const sourceRows = parseCsv(csv).filter((row) => getSourceTitle(row))
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  try {
    const existingProducts = await readExistingProducts(client)
    const categoryIndexes = await readCategories(client)
    const indexes = buildIndexes(existingProducts)
    const matched = []
    const unmatched = []
    const created = []

    for (const row of sourceRows) {
      const match = matchSourceProduct(row, indexes)
      if (!match?.product) {
        const unmatchedItem = {
          sourceId: getSourceId(row),
          sku: getSourceSku(row),
          title: getSourceTitle(row),
          price: getSourcePrice(row),
          inventory: getSourceInventory(row),
          stockStatus: getSourceStockStatus(row),
          hsnCode: getSourceHsn(row),
          category: getSourceCategoryName(row),
          closestExisting: findClosestExisting(row, existingProducts),
        }
        unmatched.push(unmatchedItem)
        if (APPLY && CREATE_MISSING) {
          created.push({ ...unmatchedItem, ...(await createProduct(client, row, categoryIndexes)) })
        }
        continue
      }

      const update = buildUpdate(row)
      matched.push({
        by: match.by,
        productId: match.product.id,
        currentTitle: match.product.title,
        sourceId: getSourceId(row),
        sourceTitle: getSourceTitle(row),
        price: update.price_in_i_n_r,
        hsnCode: update.hsn_code,
        inventory: update.inventory,
        stockStatus: update.stock_status,
        hasDescription: Boolean(update.description),
      })

      if (APPLY) await applyUpdate(client, match.product.id, update)
    }

    console.log(
      JSON.stringify(
        {
          mode: APPLY ? 'apply' : 'dry-run',
          createMissing: CREATE_MISSING,
          sourceCount: sourceRows.length,
          existingCount: existingProducts.length,
          matchedCount: matched.length,
          unmatchedCount: unmatched.length,
          createdCount: created.length,
          matchCountsByKey: matched.reduce((counts, item) => {
            counts[item.by] = (counts[item.by] || 0) + 1
            return counts
          }, {}),
          matchedSample: matched.slice(0, 20),
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
