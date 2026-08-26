import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function main() {
  const payload = await getPayload({ config })
  const db = (payload.db as any).drizzle

  for (const t of ['gift_cards', 'gift_cards_redemptions', 'return_requests', 'orders_items', 'orders_rels', 'carts']) {
    const r = await db.execute(`select count(*) from ${t}`).catch((e: Error) => ({ rows: [{ count: 'ERR: ' + e.message }] }))
    console.log(t, ':', r.rows[0].count)
  }

  // Does carts reference transactions (would TRUNCATE CASCADE reach carts)?
  const fk = await db.execute(`
    select tc.table_name as referencing_table, kcu.column_name, ccu.table_name as referenced_table
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu on tc.constraint_name = kcu.constraint_name
    join information_schema.constraint_column_usage ccu on tc.constraint_name = ccu.constraint_name
    where tc.constraint_type = 'FOREIGN KEY' and ccu.table_name in ('transactions','gift_cards','gift_cards_redemptions','return_requests')
  `)
  console.log('--- tables referencing transactions/gift_cards/gift_cards_redemptions/return_requests ---')
  console.log(JSON.stringify(fk.rows, null, 2))

  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
