/**
 * Fixes duplicate meta descriptions on 4 USB cable products (1.5m vs 3m
 * length variants shared byte-identical descriptions, flagged by SEMrush).
 * Already applied to the local Neon dev DB via the Payload Local API —
 * this script applies the same `meta_description` values directly via SQL,
 * so it can run against either DB by pointing DATABASE_URL at the target.
 *
 * Run against local/dev (Neon):
 *   npx tsx --env-file=.env scripts/apply-usb-meta-description-fix.ts
 *
 * Run against production (AWS RDS):
 *   npx tsx --env-file=.env scripts/apply-usb-meta-description-fix.ts --target=rds
 *   (requires RDS_DATABASE_URL and POSTGRES_CA_CERT in .env, same as
 *   import-users-addresses-to-rds.ts)
 *
 * Safe to re-run: each UPDATE is keyed by slug and just overwrites
 * meta_description with the same fixed value.
 */
import fs from 'fs'
import path from 'path'

import { Client } from 'pg'

function buildSSLConfig(caCertPath?: string) {
  if (!caCertPath) return { rejectUnauthorized: false }
  return {
    ca: fs.readFileSync(path.resolve(process.cwd(), caCertPath)).toString(),
    rejectUnauthorized: true,
  }
}

function cleanConnectionString(raw: string): string {
  if (!raw) return raw
  try {
    const url = new URL(raw)
    url.searchParams.delete('sslmode')
    url.searchParams.delete('channel_binding')
    return url.toString()
  } catch {
    return raw
  }
}

const updates: Record<string, string> = {
  'usb-type-a-female-to-type-a-male-1-5-meter-cable':
    'USB 2.0 Type A Male to Type A Female extension cable, 1.5 meter length. UL2725 shielded cable with gold-flash connector.',
  'usb-type-a-female-to-type-a-male-3-meter-cable':
    'USB 2.0 Type A Male to Type A Female extension cable, 3 meter length. UL2725 shielded cable with gold-flash connector.',
  'usb-type-a-male-to-type-a-male-1-5-meter-cable':
    'USB 2.0 Type A Male to Type A Male cable, 1.5 meter length. UL2725 shielded cable with gold-flash connector.',
  'usb-type-a-male-to-type-a-male-3-meter-cable':
    'USB 2.0 Type A Male to Type A Male cable, 3 meter length. UL2725 shielded cable with gold-flash connector.',
}

async function main() {
  const useRds = process.argv.includes('--target=rds')

  const connectionString = useRds ? process.env.RDS_DATABASE_URL : process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error(useRds ? 'RDS_DATABASE_URL is not set.' : 'DATABASE_URL is not set.')
  }

  const client = new Client({
    connectionString: cleanConnectionString(connectionString),
    ssl: useRds ? buildSSLConfig(process.env.POSTGRES_CA_CERT) : buildSSLConfig(),
  })
  await client.connect()
  console.log(`Connected to ${useRds ? 'RDS (production)' : 'Neon (dev)'}.\n`)

  for (const [slug, description] of Object.entries(updates)) {
    const res = await client.query(
      `UPDATE products SET meta_description = $1 WHERE slug = $2`,
      [description, slug],
    )
    console.log(`${slug} -> ${res.rowCount} row(s) updated`)
  }

  await client.end()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
