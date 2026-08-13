import { getPayload } from 'payload'
import configPromise from './src/payload.config.ts'

const payload = await getPayload({ config: configPromise })

const { docs } = await payload.find({ collection: 'categories', limit: 100, sort: 'title' })
for (const c of docs) console.log(c.id, '|', c.title, '|', c.slug)
process.exit(0)
