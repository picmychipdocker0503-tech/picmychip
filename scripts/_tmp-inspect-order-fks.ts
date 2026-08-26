import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function main() {
  const payload = await getPayload({ config })
  const db = (payload.db as any).drizzle

  const fkResult = await db.execute(`
    select
      tc.table_name as referencing_table,
      kcu.column_name as referencing_column,
      ccu.table_name as referenced_table
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu on tc.constraint_name = kcu.constraint_name
    join information_schema.constraint_column_usage ccu on tc.constraint_name = ccu.constraint_name
    where tc.constraint_type = 'FOREIGN KEY' and ccu.table_name = 'orders'
  `)
  console.log('--- Tables referencing orders ---')
  console.log(JSON.stringify(fkResult.rows, null, 2))

  const counts = await db.execute(`select count(*) from orders`)
  console.log('order count:', counts.rows[0].count)

  const txCounts = await db.execute(`select count(*) from transactions`).catch(() => ({ rows: [{ count: 'n/a' }] }))
  console.log('transactions count:', txCounts.rows[0].count)

  const maxId = await db.execute(`select max(id) from orders`)
  console.log('max order id:', maxId.rows[0].max)

  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
