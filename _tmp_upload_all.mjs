import { getPayload } from 'payload'
import configPromise from './src/payload.config.ts'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import fs from 'node:fs/promises'
import path from 'node:path'

const ALREADY_DONE = new Set([
  'raspberry-pi-pico-transparent.png',
  'radiolink-at10-ii-2-4ghz-12ch-rc-drone-remote-with-prm-01-transmitter-and-r12ds-receiver-transparent.png',
])

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  endpoint: process.env.R2_ENDPOINT,
  forcePathStyle: true,
  region: 'auto',
})

const LIMIT = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? Infinity)

const payload = await getPayload({ config: configPromise })
const manifest = JSON.parse(await fs.readFile('scripts/output/manifest.json', 'utf-8'))

console.log(`Manifest has ${manifest.length} entries, ${ALREADY_DONE.size} already done.`)

let uploaded = 0
let failed = 0
let skipped = 0

for (const entry of manifest) {
  if (uploaded + failed + skipped >= LIMIT) break
  if (ALREADY_DONE.has(entry.filename)) {
    skipped++
    continue
  }

  try {
    const originalPath = path.join('scripts/output/originals', entry.filename)
    const processedPath = path.join('scripts/output/processed', entry.filename)

    const originalBuffer = await fs.readFile(originalPath)
    const processedBuffer = await fs.readFile(processedPath)

    await s3.send(
      new PutObjectCommand({
        Body: originalBuffer,
        Bucket: process.env.R2_BUCKET,
        ContentType: 'image/png',
        Key: `media-originals-backup/${entry.filename}`,
      }),
    )

    await payload.update({
      collection: 'media',
      id: entry.mediaId,
      data: {},
      file: {
        data: processedBuffer,
        mimetype: 'image/png',
        name: entry.filename,
        size: processedBuffer.length,
      },
      context: { disableRevalidate: true },
    })

    uploaded++
    console.log(`[${uploaded}] ok: ${entry.filename}`)
  } catch (err) {
    failed++
    console.error(`FAILED: ${entry.filename} — ${err.message}`)
  }
}

console.log('SUMMARY', { uploaded, failed, skipped, total: manifest.length })
process.exit(0)
