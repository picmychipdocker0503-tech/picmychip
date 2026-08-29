/**
 * Copies `users`, `users_roles`, and `addresses` from the source database
 * (Neon, via DATABASE_URL) into a target database (AWS RDS, via
 * RDS_DATABASE_URL) — in that order, since users_roles/addresses reference
 * users.id.
 *
 * Run with: npx tsx --env-file=.env scripts/import-users-addresses-to-rds.ts
 *
 * Requires in .env:
 *   DATABASE_URL       - source (Neon), already present
 *   RDS_DATABASE_URL   - target (AWS RDS) connection string
 *   POSTGRES_CA_CERT   - path to the RDS CA bundle (already at ./certs/rds-ca.pem)
 *
 * Safe to re-run: every insert uses ON CONFLICT (id) DO NOTHING, so rows
 * already on RDS (e.g. from an earlier manual import) are left untouched,
 * not overwritten or duplicated — only genuinely missing rows get added.
 *
 * `addresses.tenant_id` is always imported as NULL (optional FK to
 * `tenants`, whose state on RDS isn't assumed here).
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

// pg-connection-string's own parsing of sslmode/channel_binding overrides an
// explicit `ssl` config object — stripping them hands full control back to
// the ssl option below. Confirmed necessary for RDS in this project already.
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

type CopyResult = { inserted: number; skipped: number; failures: { id: number | string; error: string }[] }

async function copyTable(
  source: Client,
  target: Client,
  tableName: string,
  columns: string[],
  conflictColumn: string,
  rowOverrides: Record<string, unknown> = {},
): Promise<CopyResult> {
  const { rows } = await source.query(`SELECT * FROM ${tableName} ORDER BY ${conflictColumn}`)
  console.log(`Read ${rows.length} rows from ${tableName}.`)

  const result: CopyResult = { inserted: 0, skipped: 0, failures: [] }
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(',')
  // Double-quoting every column name is always valid in Postgres (case-
  // sensitive exact match to a normal lowercase identifier) and sidesteps
  // reserved words like "order" without needing special-casing here — the
  // `columns` array itself stays as plain names, matching how `pg` returns
  // row keys (it strips quoting from result column names).
  const quotedColumnList = columns.map((col) => `"${col}"`).join(',')

  for (const row of rows) {
    try {
      const values = columns.map((col) => (col in rowOverrides ? rowOverrides[col] : row[col]))
      const res = await target.query(
        `INSERT INTO ${tableName} (${quotedColumnList}) VALUES (${placeholders}) ON CONFLICT (${conflictColumn}) DO NOTHING`,
        values,
      )
      if (res.rowCount && res.rowCount > 0) result.inserted += 1
      else result.skipped += 1
    } catch (err) {
      result.failures.push({ id: row[conflictColumn], error: err instanceof Error ? err.message : String(err) })
    }
  }

  return result
}

async function resetSequence(target: Client, tableName: string, idColumn = 'id') {
  await target.query(
    `SELECT setval(pg_get_serial_sequence('${tableName}', '${idColumn}'), COALESCE((SELECT MAX(${idColumn}) FROM ${tableName}), 1))`,
  )
}

function printResult(label: string, result: CopyResult) {
  console.log(`\n${label}: inserted ${result.inserted}, skipped ${result.skipped}, failed ${result.failures.length}`)
  if (result.failures.length > 0) {
    console.log('Failures (first 20):', JSON.stringify(result.failures.slice(0, 20), null, 2))
  }
}

async function main() {
  const sourceUrl = process.env.DATABASE_URL
  const targetUrl = process.env.RDS_DATABASE_URL

  if (!sourceUrl) throw new Error('DATABASE_URL (source/Neon) is not set.')
  if (!targetUrl) throw new Error('RDS_DATABASE_URL (target/RDS) is not set — add it to .env first.')

  const source = new Client({ connectionString: cleanConnectionString(sourceUrl), ssl: buildSSLConfig() })
  const target = new Client({
    connectionString: cleanConnectionString(targetUrl),
    ssl: buildSSLConfig(process.env.POSTGRES_CA_CERT),
  })

  await source.connect()
  await target.connect()
  console.log('Connected to source (Neon) and target (RDS).\n')

  // --- users (no dependencies) ---
  const usersResult = await copyTable(source, target, 'users', [
    'id', 'name', 'updated_at', 'created_at', 'email', 'reset_password_token',
    'reset_password_expiration', 'salt', 'hash', 'login_attempts', 'lock_until',
    'avatar_id', '_verified', '_verificationtoken', 'zoho_customer_id', 'theme_preference',
  ], 'id')
  printResult('users', usersResult)
  await resetSequence(target, 'users')

  // --- users_roles (depends on users.id via parent_id) ---
  const rolesResult = await copyTable(source, target, 'users_roles', ['id', 'order', 'parent_id', 'value'], 'id')
  printResult('users_roles', rolesResult)
  await resetSequence(target, 'users_roles')

  // --- addresses (depends on users.id via customer_id) ---
  const addressesResult = await copyTable(
    source,
    target,
    'addresses',
    [
      'id', 'customer_id', 'title', 'first_name', 'last_name', 'company', 'address_line1', 'address_line2',
      'city', 'state', 'postal_code', 'country', 'phone', 'updated_at', 'created_at', 'gstin', 'label',
      'is_default_billing', 'is_default_shipping', 'is_active', 'gst_registered', 'gst_legal_name',
      'gst_trade_name', 'gst_registration_type', 'email', 'tenant_id',
    ],
    'id',
    { tenant_id: null },
  )
  printResult('addresses', addressesResult)
  await resetSequence(target, 'addresses')

  await source.end()
  await target.end()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
