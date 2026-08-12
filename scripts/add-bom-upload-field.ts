import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

// Follow-up to create-start-a-request-form.ts: that script ran before the
// `fields.upload: true` fix in src/plugins/index.ts landed, so the form's
// "bomFile" upload field was silently dropped by the (then upload-disabled)
// forms collection schema. This inserts it now that the schema recognizes it.
const run = async () => {
  const payload = await getPayload({ config })

  const form = await payload.findByID({ collection: 'forms', id: 2, overrideAccess: true })
  const fields = (form.fields ?? []) as Array<Record<string, unknown>>

  if (fields.some((f) => f.blockType === 'upload')) {
    payload.logger.info('bomFile upload field already present, nothing to do.')
    process.exit(0)
  }

  const partNumbersIndex = fields.findIndex((f) => f.name === 'partNumbers')
  const insertAt = partNumbersIndex === -1 ? fields.length : partNumbersIndex + 1

  const bomFileField = {
    blockType: 'upload',
    name: 'bomFile',
    label: 'Or upload a BOM file — Excel, CSV, or PDF (optional)',
    uploadCollection: 'media',
    maxFileSize: 10 * 1024 * 1024,
    mimeTypes: [
      { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      { mimeType: 'application/vnd.ms-excel' },
      { mimeType: 'text/csv' },
      { mimeType: 'application/pdf' },
    ],
  }

  const newFields = [...fields.slice(0, insertAt), bomFileField, ...fields.slice(insertAt)]

  await payload.update({
    collection: 'forms',
    id: 2,
    data: { fields: newFields } as any,
    overrideAccess: true,
  })

  payload.logger.info('Inserted bomFile upload field into form "Start a Request".')
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
