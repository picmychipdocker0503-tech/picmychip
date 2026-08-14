import 'dotenv/config'
import { getPayload } from 'payload'
import config from './src/payload.config'

const run = async () => {
  const payload = await getPayload({ config })

  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: '_tmp_admin_verify@local.test' } },
    limit: 1,
  })

  if (existing.docs[0]) {
    await payload.update({ collection: 'users', id: existing.docs[0].id, data: { _verified: true } as any })
    console.log('id:', existing.docs[0].id)
    process.exit(0)
  }

  const user = await payload.create({
    collection: 'users',
    data: {
      name: 'Temp Admin Verify',
      email: '_tmp_admin_verify@local.test',
      password: 'TempAdminVerify123!',
      roles: ['admin'],
      _verified: true,
    } as any,
  })

  console.log('id:', user.id)
  process.exit(0)
}

run()
