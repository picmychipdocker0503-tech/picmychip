import 'dotenv/config'
import { Client } from 'pg'
async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  const res = await client.query(`SELECT id, filename, url FROM media WHERE mime_type LIKE 'image/%' LIMIT 1`)
  console.log(JSON.stringify(res.rows))
  await client.end()
  process.exit(0)
}
main().catch(e => { console.error(e.message); process.exit(1) })
