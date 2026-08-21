import 'dotenv/config'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { Client } = require('../node_modules/.pnpm/pg@8.20.0/node_modules/pg')

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  try {
    await client.query('begin')

    const cables = await client.query('select id from categories where slug = $1 limit 1', ['cables'])
    const parentId = cables.rows[0]?.id ?? null

    let category = await client.query('select id, title, slug from categories where slug = $1 limit 1', [
      'rf-cables',
    ])

    if (category.rowCount === 0) {
      category = await client.query(
        `
          insert into categories (
            title,
            parent_id,
            spec_schema_type,
            generate_slug,
            slug,
            description,
            is_cornerstone,
            sequence,
            updated_at,
            created_at
          ) values ($1, $2, 'none', true, $3, $4, false, $5, now(), now())
          returning id, title, slug
        `,
        [
          'RF Cables',
          parentId,
          'rf-cables',
          'RF coaxial cable assemblies and related interconnect cables.',
          45,
        ],
      )
    }

    const categoryId = category.rows[0].id
    const products = await client.query(
      `
        select id
        from products
        where title ilike $1
          or title ilike $2
        order by id
      `,
      ['%RG405%', '%Coaxial Cable Assembly%'],
    )

    for (const product of products.rows) {
      await client.query(
        `
          insert into products_rels (parent_id, path, categories_id, "order")
          select $1, 'categories', $2, 0
          where not exists (
            select 1
            from products_rels
            where parent_id = $1
              and path = 'categories'
              and categories_id = $2
          )
        `,
        [product.id, categoryId],
      )
    }

    await client.query('commit')

    console.log(
      JSON.stringify(
        {
          category: category.rows[0],
          linkedProducts: products.rowCount,
        },
        null,
        2,
      ),
    )
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
