/**
 * Dumps the production database (AWS RDS) via `pg_dump` straight into the
 * local OneDrive-synced folder, so backups get off this machine automatically
 * without any separate upload step — OneDrive just syncs whatever's written
 * there in the background.
 *
 * Run with: npx tsx --env-file=.env scripts/backup-database-to-onedrive.ts
 *
 * Requires in .env:
 *   RDS_DATABASE_URL  - production (AWS RDS) connection string
 *   POSTGRES_CA_CERT  - path to the RDS CA bundle (already at ./certs/rds-ca.pem)
 *   BACKUP_DIR        - optional override for the destination folder; defaults
 *                        to a "Picmychip Backups" folder inside this machine's
 *                        OneDrive folder (auto-detected below).
 *
 * The output filename is <database-name>_<timestamp>.dump (pg_dump custom
 * format, restorable with `pg_restore`) — the database name comes straight
 * out of RDS_DATABASE_URL, not hardcoded, so this stays correct if the
 * database is ever renamed or this script is pointed at a different one.
 */
import fs from 'fs'
import os from 'os'
import path from 'path'
import { execFile } from 'child_process'

function findOneDriveFolder(): string | undefined {
  const home = os.homedir()
  const candidates = fs
    .readdirSync(home, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('OneDrive'))
    .map((entry) => path.join(home, entry.name))

  // Prefer a business/org OneDrive ("OneDrive - Company Name") over the
  // plain personal one, since that's where this org already keeps backups
  // for its other projects.
  return candidates.find((p) => p !== path.join(home, 'OneDrive')) ?? candidates[0]
}

function getDatabaseName(connectionString: string): string {
  const url = new URL(connectionString)
  return url.pathname.replace(/^\//, '') || 'database'
}

function cleanConnectionString(raw: string): string {
  const url = new URL(raw)
  if (!url.searchParams.has('sslmode')) url.searchParams.set('sslmode', 'require')
  return url.toString()
}

async function main() {
  const connectionString = process.env.RDS_DATABASE_URL
  if (!connectionString) throw new Error('RDS_DATABASE_URL is not set — add it to .env first.')

  const oneDriveFolder = process.env.BACKUP_DIR
    ? undefined
    : findOneDriveFolder()
  if (!process.env.BACKUP_DIR && !oneDriveFolder) {
    throw new Error('No OneDrive folder found under the home directory, and BACKUP_DIR is not set.')
  }

  const destinationDir =
    process.env.BACKUP_DIR || path.join(oneDriveFolder as string, 'Picmychip Backups')
  fs.mkdirSync(destinationDir, { recursive: true })

  const dbName = getDatabaseName(connectionString)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const outputPath = path.join(destinationDir, `${dbName}_${timestamp}.dump`)

  const args = [
    cleanConnectionString(connectionString),
    '--format=custom',
    '--no-owner',
    '--no-privileges',
    `--file=${outputPath}`,
  ]
  const env = process.env.POSTGRES_CA_CERT
    ? { ...process.env, PGSSLROOTCERT: path.resolve(process.cwd(), process.env.POSTGRES_CA_CERT) }
    : process.env

  console.log(`Backing up "${dbName}" to ${outputPath} ...`)

  await new Promise<void>((resolve, reject) => {
    execFile('pg_dump', args, { env }, (error, _stdout, stderr) => {
      if (error) {
        reject(new Error(`pg_dump failed: ${stderr || error.message}`))
        return
      }
      resolve()
    })
  })

  const { size } = fs.statSync(outputPath)
  console.log(`Done. Wrote ${(size / 1024 / 1024).toFixed(2)} MB — OneDrive will sync it automatically.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
