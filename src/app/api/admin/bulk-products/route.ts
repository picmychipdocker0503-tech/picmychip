import { checkRole } from '@/access/utilities'
import { commitBulkProducts } from '@/lib/bulkProducts/commitRows'
import { parseAndValidateBulkProducts } from '@/lib/bulkProducts/parseAndValidate'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * Two-step upload: the client always calls this to VALIDATE the sheet first
 * (no writes, no image downloads). Once the admin reviews the preview and
 * clicks "Confirm Import", the client re-submits the same file with
 * `commit=true`, which then actually downloads images and writes to the
 * database — one bad row is caught and reported without aborting the batch.
 */
export async function POST(request: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  if (!checkRole(['admin'], user)) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file')
  const commit = formData.get('commit') === 'true'

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  let parsed
  try {
    parsed = await parseAndValidateBulkProducts(payload, buffer)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not read the uploaded file.' },
      { status: 400 },
    )
  }

  if (!commit) {
    return NextResponse.json({
      truncated: parsed.truncated,
      rows: parsed.rows.map((row) => ({
        rowNumber: row.rowNumber,
        action: row.action,
        sku: row.sku,
        title: row.title,
        errors: row.errors,
      })),
    })
  }

  const importable = parsed.rows.filter((row) => row.action !== 'error')
  const result = await commitBulkProducts(payload, importable)

  return NextResponse.json(result)
}
