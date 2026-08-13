import { getPayload } from 'payload'
import configPromise from './src/payload.config.ts'

const payload = await getPayload({ config: configPromise })

const titles = [
  'Amass LCB50-F 2Pin 4 mm Connector Female',
  'C0603C104J3RACTU Capacitor',
  'T-Motor Antigravity MN2806 400KV',
  '505578-0671 Connector',
  'Raspberry-Pi Pico',
]

for (const t of titles) {
  const { docs } = await payload.find({
    collection: 'products',
    depth: 1,
    limit: 1,
    where: { title: { like: t } },
  })
  const p = docs[0]
  if (!p) {
    console.log('NOT FOUND:', t)
    continue
  }
  const img = p.gallery?.[0]?.image
  console.log(p.id, '|', p.title, '| mediaId:', typeof img === 'object' ? img?.id : img, '| url:', typeof img === 'object' ? img?.url : null)
}
process.exit(0)
