import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

// Follow-up: the "media" collection only accepts image/* uploads (product photos), so a
// customer-submitted BOM file (PDF/Excel/CSV) always failed. Repointing bomFile at
// "datasheets", which already accepts documents and is already wired to R2.
const run = async () => {
  const payload = await getPayload({ config })

  const form = await payload.findByID({ collection: 'forms', id: 2, overrideAccess: true })
  const fields = (form.fields ?? []) as Array<Record<string, unknown>>

  const newFields = fields.map((f) =>
    f.blockType === 'upload' && f.name === 'bomFile' ? { ...f, uploadCollection: 'datasheets' } : f,
  )

  await payload.update({
    collection: 'forms',
    id: 2,
    data: { fields: newFields } as any,
    overrideAccess: true,
  })

  payload.logger.info('bomFile now targets the datasheets collection.')
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
