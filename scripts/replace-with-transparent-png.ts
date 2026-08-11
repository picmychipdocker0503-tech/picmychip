// One-time migration: replaces the R2-backed image for two media docs
// (06033c473kat2a-capacitor.webp, 2-pin-jst-male-header.jpg) with a
// background-removed, transparent .png version, repoints the corresponding
// Payload media doc at the new file, then deletes the old R2 object.
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const REQUIRED_ENV = ['R2_BUCKET', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_ENDPOINT']
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`)
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
const scratchDir =
  'C:/Users/PICMYC~1/AppData/Local/Temp/claude/d--Picmychip-picmychip/edd9fe8f-80fc-4e26-992f-b8675e1c5092/scratchpad'

const REPLACEMENTS = [
  {
    oldFilename: '06033c473kat2a-capacitor.webp',
    newFilename: '06033c473kat2a-capacitor.png',
    width: 600,
    height: 553,
  },
  {
    oldFilename: '2-pin-jst-male-header.jpg',
    newFilename: '2-pin-jst-male-header.png',
    width: 231,
    height: 218,
  },
]

async function run() {
  const payload = await getPayload({ config })

  for (const { oldFilename, newFilename, width, height } of REPLACEMENTS) {
    const localPath = path.join(scratchDir, newFilename)
    const body = fs.readFileSync(localPath)

    const newKey = `media/${newFilename}`
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: newKey,
        Body: body,
        ContentType: 'image/png',
      }),
    )
    console.log(`Uploaded r2://${bucket}/${newKey} (${body.length} bytes)`)

    const { docs } = await payload.find({
      collection: 'media',
      where: { filename: { equals: oldFilename } },
      limit: 1,
    })
    const doc = docs[0]
    if (!doc) {
      console.warn(`No media doc found for filename "${oldFilename}", skipping DB update.`)
      continue
    }

    const updated = await payload.update({
      collection: 'media',
      id: doc.id,
      data: {
        filename: newFilename,
        mimeType: 'image/png',
        filesize: body.length,
        width,
        height,
      },
    })
    console.log(`Updated media doc ${doc.id}: ${oldFilename} -> ${newFilename}, new url: ${updated.url}`)

    const oldKey = `media/${oldFilename}`
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: oldKey }))
    console.log(`Deleted r2://${bucket}/${oldKey}`)
  }

  console.log('Done.')
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
