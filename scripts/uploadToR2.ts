// One-time migration: pushes existing local public/media and public/datasheets
// files up to R2 so they match the filenames already referenced in the (shared)
// Postgres database. Safe to re-run — skips objects that already exist in the bucket.
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const REQUIRED_ENV = ['R2_BUCKET', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_ENDPOINT']

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}. Set it in .env before running this script.`)
    process.exit(1)
  }
}

const client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const bucket = process.env.R2_BUCKET!

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
}

async function objectExists(key: string): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    return true
  } catch {
    return false
  }
}

async function uploadDir(localDir: string, prefix: string) {
  if (!fs.existsSync(localDir)) {
    console.log(`Skipping ${prefix}: ${localDir} does not exist`)
    return
  }

  const files = fs.readdirSync(localDir).filter((name) => {
    return fs.statSync(path.join(localDir, name)).isFile()
  })

  console.log(`Uploading ${files.length} files from ${localDir} to r2://${bucket}/${prefix}/`)

  let uploaded = 0
  let skipped = 0

  for (const filename of files) {
    const key = `${prefix}/${filename}`

    if (await objectExists(key)) {
      skipped++
      continue
    }

    const filePath = path.join(localDir, filename)
    const body = fs.readFileSync(filePath)
    const ext = path.extname(filename).toLowerCase()

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: MIME_TYPES[ext] || 'application/octet-stream',
      }),
    )

    uploaded++
    if (uploaded % 25 === 0) {
      console.log(`  ${uploaded}/${files.length} uploaded...`)
    }
  }

  console.log(`Done with ${prefix}: ${uploaded} uploaded, ${skipped} already present\n`)
}

async function run() {
  await uploadDir(path.resolve(dirname, '../public/media'), 'media')
  await uploadDir(path.resolve(dirname, '../public/datasheets'), 'datasheets')
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
