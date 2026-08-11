// Three media docs (gift-card-icon.svg, vvdn-technologies-logo.svg,
// visteon-logo.png) exist in Postgres with correct metadata/URLs, but the
// underlying R2 objects were never actually written — confirmed 404 on all
// three public URLs, and re-running payload.update() through the
// @payloadcms/storage-s3 plugin doesn't fix it either (the plugin's upload
// silently doesn't land the object when invoked from a local-API script).
// scripts/uploadToR2.ts already proves the direct-PutObjectCommand path
// works against this bucket, so this mirrors that instead of the plugin.
import 'dotenv/config'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

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

const GIFT_CARD_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" rx="24" fill="#7c3aed"/>
  <rect x="30" y="70" width="140" height="90" rx="12" fill="white"/>
  <rect x="30" y="95" width="140" height="18" fill="#7c3aed"/>
  <circle cx="100" cy="70" r="22" fill="#fbbf24"/>
</svg>`

const DUMMY_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#f4f4f5"/>
  <g fill="none" stroke="#a1a1aa" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <rect x="60" y="50" width="80" height="120"/>
    <path d="M60 170V50h80v120"/>
    <path d="M78 68h12M110 68h12M78 92h12M110 92h12M78 116h12M110 116h12M78 140h24"/>
  </g>
</svg>`

async function fetchAsBuffer(url: string): Promise<{ buffer: Buffer; mimetype: string } | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const arrayBuffer = await response.arrayBuffer()
    const mimetype = response.headers.get('content-type') || 'image/png'
    return { buffer: Buffer.from(arrayBuffer), mimetype }
  } catch {
    return null
  }
}

async function put(key: string, body: Buffer, contentType: string) {
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }))
  console.log(`Uploaded r2://${bucket}/${key} (${body.length} bytes, ${contentType})`)
}

async function run() {
  await put('media/gift-card-icon.svg', Buffer.from(GIFT_CARD_ICON_SVG), 'image/svg+xml')

  const vvdn = await fetchAsBuffer('https://www.vvdntech.com/images/vvdn_site_logo.svg')
  if (vvdn) {
    await put('media/vvdn-technologies-logo.svg', vvdn.buffer, vvdn.mimetype)
  } else {
    console.log('Could not re-download VVDN logo from source — uploading placeholder instead.')
    await put('media/vvdn-technologies-logo.svg', Buffer.from(DUMMY_LOGO_SVG), 'image/svg+xml')
  }

  const visteon = await fetchAsBuffer(
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhIW9dMrGsgBUNYUppi8mO_hw4k_UoawvnHfheMs020q9dqPrhyQ4ravc&s=10',
  )
  if (visteon) {
    await put('media/visteon-logo.png', visteon.buffer, visteon.mimetype)
  } else {
    console.log('Could not re-download Visteon logo from source — uploading placeholder instead.')
    await put('media/visteon-logo.png', Buffer.from(DUMMY_LOGO_SVG), 'image/svg+xml')
  }

  console.log('Done.')
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
