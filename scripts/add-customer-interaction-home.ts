import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const customerInteractionBlock = {
  blockType: 'customerInteraction' as const,
  eyebrow: 'Customer interaction',
  heading: 'Need parts, pricing, or build help? Start with one request.',
  intro:
    'Picmychip routes your question to the right workflow, whether you need a quick component match, bulk quote, order update, or custom service estimate.',
  channels: [
    {
      type: 'quote' as const,
      title: 'Bulk quote',
      description: 'Send quantities or a BOM and get price breaks with available alternates.',
      responseTime: 'Within 2 hours',
    },
    {
      type: 'technical' as const,
      title: 'Part guidance',
      description: 'Ask about ratings, footprints, compatible modules, cables, and datasheets.',
      responseTime: 'Same business day',
    },
    {
      type: 'tracking' as const,
      title: 'Order support',
      description: 'Find shipment status, invoices, returns, and delivery updates.',
      responseTime: 'Instant lookup',
    },
    {
      type: 'service' as const,
      title: 'Custom service',
      description: 'Request PCB manufacturing, 3D printing, laser cutting, or battery packs.',
      responseTime: 'Priority review',
    },
  ],
  steps: [
    {
      label: 'Share your requirement',
      detail: 'Paste part numbers, upload a BOM, or describe the project you are building.',
    },
    {
      label: 'Review matched options',
      detail: 'Get suitable parts, alternates, lead times, and service paths in one response.',
    },
    {
      label: 'Confirm and track',
      detail: 'Approve the quote or order, then follow dispatch and delivery from your account.',
    },
  ],
  metrics: [
    { value: '<2h', label: 'Quote response' },
    { value: '4', label: 'Help workflows' },
    { value: '30d', label: 'Return window' },
  ],
  primaryLink: {
    type: 'custom' as const,
    url: '/contact',
    label: 'Start a Request',
    newTab: false,
  },
  secondaryLink: {
    type: 'custom' as const,
    url: '/find-order',
    label: 'Track Order',
    newTab: false,
  },
}

const run = async () => {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
    depth: 0,
  })

  const home = docs[0]
  if (!home) throw new Error('home page not found')

  const layout = home.layout ?? []
  const hasCustomerInteraction = layout.some((block) => block.blockType === 'customerInteraction')

  if (hasCustomerInteraction) {
    payload.logger.info('customerInteraction block already exists on home page.')
    process.exit(0)
  }

  const archiveIndex = layout.findIndex((block) => block.blockType === 'archive')
  const insertIndex = archiveIndex >= 0 ? archiveIndex + 1 : Math.min(1, layout.length)
  const nextLayout = [
    ...layout.slice(0, insertIndex),
    customerInteractionBlock,
    ...layout.slice(insertIndex),
  ]

  await payload.update({
    collection: 'pages',
    id: home.id,
    data: { layout: nextLayout },
    context: { disableRevalidate: true },
  })

  payload.logger.info(
    `Added customerInteraction block to home page at position ${insertIndex + 1}.`,
  )
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
