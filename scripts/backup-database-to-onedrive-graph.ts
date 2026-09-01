/**
 * Serverless-compatible database backup: exports every table's rows as
 * gzipped JSON (pure JS via `pg` — no `pg_dump` binary, so this is the same
 * approach the Vercel Cron route will use in production, where no such
 * binary is available) and uploads it straight to OneDrive via the
 * Microsoft Graph API — no local machine or OneDrive desktop sync client
 * involved.
 *
 * This is a logical *data* dump (every row of every table as JSON), not a
 * byte-for-byte pg_dump equivalent — no schema DDL, sequences, or custom
 * types. Good enough to restore data into an existing schema; not a
 * replacement for RDS's own automated snapshots for full disaster recovery.
 *
 * Run against local/dev (Neon):
 *   npx tsx --env-file=.env scripts/backup-database-to-onedrive-graph.ts
 *
 * Run against production (AWS RDS), once RDS_DATABASE_URL is in .env:
 *   npx tsx --env-file=.env scripts/backup-database-to-onedrive-graph.ts --target=rds
 *
 * Requires in .env:
 *   AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET - Graph API app registration
 *   ONEDRIVE_USER_ID                                      - Azure AD object ID of whose OneDrive to upload into
 *   RDS_DATABASE_URL, POSTGRES_CA_CERT                    - only needed for --target=rds
 */
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { Client } from 'pg'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set — add it to .env first.`)
  return value
}

function buildSSLConfig(caCertPath?: string) {
  if (!caCertPath) return { rejectUnauthorized: false }
  return {
    ca: fs.readFileSync(path.resolve(process.cwd(), caCertPath)).toString(),
    rejectUnauthorized: true,
  }
}

function cleanConnectionString(raw: string): string {
  const url = new URL(raw)
  url.searchParams.delete('sslmode')
  url.searchParams.delete('channel_binding')
  return url.toString()
}

async function exportDatabaseAsGzippedJSON(connectionString: string, ssl: ReturnType<typeof buildSSLConfig>) {
  const client = new Client({ connectionString: cleanConnectionString(connectionString), ssl })
  await client.connect()

  const { rows: tables } = await client.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
  )

  const dump: Record<string, unknown[]> = {}
  for (const { tablename } of tables) {
    const { rows } = await client.query(`SELECT * FROM "${tablename}"`)
    dump[tablename] = rows
    console.log(`  exported ${tablename}: ${rows.length} row(s)`)
  }

  await client.end()
  return zlib.gzipSync(JSON.stringify(dump))
}

async function getGraphAccessToken(): Promise<string> {
  const tenantId = requireEnv('AZURE_TENANT_ID')
  const clientId = requireEnv('AZURE_CLIENT_ID')
  const clientSecret = requireEnv('AZURE_CLIENT_SECRET')

  const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    }),
  })

  if (!res.ok) throw new Error(`Failed to get Graph access token: ${await res.text()}`)
  const data = (await res.json()) as { access_token: string }
  return data.access_token
}

// Creates `name` under `parentPath` (drive root when empty) if it doesn't
// already exist. Uses conflictBehavior "fail" (not "replace") and swallows
// the resulting 409 — "replace" on an existing folder can wipe out every
// backup already inside it, which defeats the point of a backup folder.
async function ensureFolderExists(accessToken: string, userId: string, parentPath: string, name: string) {
  // Colon-path syntax (`root:/x:/children`) only applies when there's an
  // actual path after the colon — the drive root itself is addressed as
  // plain `root/children`, no colons, or Graph reads the empty segment as
  // an invalid path and 400s with "Resource not found for the segment 'root:'".
  const childrenUrl = parentPath
    ? `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userId)}/drive/root:/${parentPath}:/children`
    : `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userId)}/drive/root/children`
  const res = await fetch(
    childrenUrl,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, folder: {}, '@microsoft.graph.conflictBehavior': 'fail' }),
    },
  )
  if (res.ok) {
    console.log(`Created folder "${parentPath}/${name}".`)
    return
  }
  const body = await res.json().catch(() => undefined)
  if (body?.error?.code === 'nameAlreadyExists') {
    console.log(`Folder "${parentPath}/${name}" already exists.`)
    return
  }
  throw new Error(`Failed to create folder "${parentPath}/${name}": ${res.status} ${JSON.stringify(body)}`)
}

async function uploadToOneDrive(args: {
  accessToken: string
  userId: string
  folder: string
  filename: string
  content: Buffer
}) {
  const { accessToken, userId, folder, filename, content } = args
  const folderPath = folder
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
  const itemPath = `${folderPath}/${encodeURIComponent(filename)}`

  const sessionRes = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userId)}/drive/root:/${itemPath}:/createUploadSession`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ item: { '@microsoft.graph.conflictBehavior': 'replace' } }),
    },
  )
  if (!sessionRes.ok) throw new Error(`Failed to create upload session: ${await sessionRes.text()}`)
  const { uploadUrl } = (await sessionRes.json()) as { uploadUrl: string }

  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Length': String(content.length),
      'Content-Range': `bytes 0-${content.length - 1}/${content.length}`,
    },
    body: content,
  })
  if (!putRes.ok) throw new Error(`Upload failed: ${await putRes.text()}`)
  return putRes.json()
}

async function main() {
  const useRds = process.argv.includes('--target=rds')
  const connectionString = useRds ? requireEnv('RDS_DATABASE_URL') : requireEnv('DATABASE_URL')
  const ssl = useRds ? buildSSLConfig(process.env.POSTGRES_CA_CERT) : buildSSLConfig()

  console.log(`Exporting ${useRds ? 'production (RDS)' : 'dev (Neon)'} database...`)
  const gzippedContent = await exportDatabaseAsGzippedJSON(connectionString, ssl)
  console.log(`Exported and compressed to ${(gzippedContent.length / 1024 / 1024).toFixed(2)} MB.`)

  const userId = requireEnv('ONEDRIVE_USER_ID')
  const dbLabel = useRds ? 'production' : 'dev'
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `${dbLabel}_${timestamp}.json.gz`

  console.log('Getting Graph API access token...')
  const accessToken = await getGraphAccessToken()

  await ensureFolderExists(accessToken, userId, '', 'Picmychip Backups')

  console.log(`Uploading to OneDrive (user ${userId}) as "Picmychip Backups/${filename}"...`)
  await uploadToOneDrive({
    accessToken,
    content: gzippedContent,
    filename,
    folder: 'Picmychip Backups',
    userId,
  })

  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
