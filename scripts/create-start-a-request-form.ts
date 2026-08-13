import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

// One-off: builds the "Start a Request" intake form + page that the homepage
// Customer Interaction block's "Start a Request" button should lead to,
// replacing the generic unbuilt /contact template form it pointed at before.
// See scripts/fix-hero-carousel-layout.ts for why `disableRevalidate` is
// passed to `payload.update` here — revalidatePath() only works inside a
// real Next.js request, not a standalone script.

const paragraph = (text: string) => ({
  type: 'paragraph',
  format: '',
  indent: 0,
  version: 1,
  children: [{ mode: 'normal', text, type: 'text', style: '', detail: 0, format: 0, version: 1 }],
  direction: 'ltr' as const,
})

const richText = (paragraphs: string[]) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    children: paragraphs.map(paragraph),
    direction: 'ltr' as const,
  },
})

const run = async () => {
  const payload = await getPayload({ config })

  const form = await payload.create({
    collection: 'forms',
    data: {
      title: 'Start a Request',
      submitButtonLabel: 'Send Request',
      confirmationType: 'message',
      confirmationMessage: richText([
        "Thanks — we've received your request.",
        'Our team typically responds within 2 hours during business hours. A confirmation has been logged against your email.',
      ]),
      fields: [
        {
          blockType: 'select',
          name: 'requestType',
          label: 'What do you need?',
          required: true,
          options: [
            { label: 'Bulk quote / BOM pricing', value: 'quote' },
            { label: 'Part or spec guidance', value: 'technical' },
            { label: 'Order support / tracking', value: 'tracking' },
            { label: 'Custom service (PCB, 3D print, cables)', value: 'service' },
          ],
        },
        { blockType: 'text', name: 'name', label: 'Full name', required: true, width: 50 },
        { blockType: 'email', name: 'email', label: 'Email', required: true, width: 50 },
        { blockType: 'text', name: 'company', label: 'Company / lab (optional)', width: 50 },
        { blockType: 'text', name: 'phone', label: 'Phone (optional)', width: 50 },
        {
          blockType: 'text',
          name: 'orderNumber',
          label: 'Order number (if this is about an existing order)',
        },
        {
          blockType: 'textarea',
          name: 'partNumbers',
          label: 'Part numbers or BOM — paste manually (optional)',
        },
        {
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
        },
        {
          blockType: 'textarea',
          name: 'message',
          label: 'Tell us more about what you need',
          required: true,
        },
      ],
      emails: [
        {
          emailTo: 'sales@picmychip.com',
          emailFrom: '"PicMyChip Website" <no-reply@picmychip.com>',
          replyTo: '{{email}}',
          subject: 'New request: {{requestType}} from {{name}}',
          message: richText([
            'New request submitted via Start a Request.',
            'Type: {{requestType}}',
            'Name: {{name}}',
            'Email: {{email}}',
            'Company: {{company}}',
            'Phone: {{phone}}',
            'Order number: {{orderNumber}}',
            'Part numbers / BOM: {{partNumbers}}',
            'Message: {{message}}',
          ]),
        },
      ],
    } as any,
    overrideAccess: true,
  })

  payload.logger.info(`Created form "Start a Request" (id ${form.id})`)

  const existingPage = await payload
    .find({ collection: 'pages', where: { slug: { equals: 'start-a-request' } }, limit: 1, overrideAccess: true })
    .then((r) => r.docs[0])

  const pageData = {
    title: 'Start a Request',
    slug: 'start-a-request',
    _status: 'published' as const,
    hero: { type: 'none' as const },
    layout: [
      {
        blockType: 'formBlock' as const,
        form: form.id,
        enableIntro: true,
        introContent: richText([
          'Start a Request',
          'Tell us what you need — a bulk quote, part guidance, order support, or a custom service — and our team will route it to the right person.',
        ]),
      },
    ],
  }

  const page = existingPage
    ? await payload.update({
        collection: 'pages',
        id: existingPage.id,
        data: pageData as any,
        overrideAccess: true,
        context: { disableRevalidate: true },
      })
    : await payload.create({
        collection: 'pages',
        data: pageData as any,
        overrideAccess: true,
        context: { disableRevalidate: true },
      })

  payload.logger.info(`${existingPage ? 'Updated' : 'Created'} page /start-a-request (id ${page.id})`)

  // Repoint the homepage Customer Interaction block's "Start a Request" button
  const home = await payload.findByID({ collection: 'pages', id: 3, overrideAccess: true })
  const blocks = (home.layout ?? []) as unknown as Array<Record<string, unknown>>
  const newBlocks = blocks.map((block) => {
    if (block.blockType !== 'customerInteraction') return block
    const primaryLink = (block.primaryLink ?? {}) as Record<string, unknown>
    if (primaryLink.url !== '/contact') return block
    return { ...block, primaryLink: { ...primaryLink, url: '/start-a-request' } }
  })

  await payload.update({
    collection: 'pages',
    id: 3,
    data: { layout: newBlocks } as any,
    overrideAccess: true,
    context: { disableRevalidate: true },
  })

  payload.logger.info('Repointed homepage "Start a Request" button to /start-a-request')
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
