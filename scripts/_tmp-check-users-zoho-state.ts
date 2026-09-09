import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { sql } from '@payloadcms/db-postgres'

async function main() {
  const payload = await getPayload({ config })
  const db = (payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<{ rows?: unknown[] }> } }).drizzle

  const cols = await db.execute(sql`
    SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name ILIKE '%zoho%';
  `)
  console.log('users columns matching zoho:', (cols.rows ?? []).map((r: any) => r.column_name))

  const tableExists = await db.execute(sql`
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users_zoho_contacts') AS exists;
  `)
  console.log('users_zoho_contacts table exists:', (tableExists.rows?.[0] as any)?.exists)

  const count = await db.execute(sql`SELECT COUNT(*) FROM users_zoho_contacts;`).catch(() => null)
  console.log('users_zoho_contacts row count:', count ? (count.rows?.[0] as any)?.count : 'N/A (table missing)')

  const appliedMigrations = await db.execute(sql`
    SELECT name FROM payload_migrations WHERE name LIKE '%zoho_contacts_per_identity%';
  `).catch((err) => { console.log('payload_migrations query failed:', err.message); return null })
  console.log('applied migration record:', appliedMigrations ? appliedMigrations.rows : 'N/A')

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
