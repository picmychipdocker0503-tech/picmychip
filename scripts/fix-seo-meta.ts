import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

import { aboutPageData } from '../src/endpoints/seed/about-page'
import { contactFormData } from '../src/endpoints/seed/contact-form'
import { contactPageData } from '../src/endpoints/seed/contact-page'
import { faqPageData } from '../src/endpoints/seed/faq-page'
import { privacyPolicyPageData, termsPolicyPageData } from '../src/endpoints/seed/legal-pages'

/**
 * Additive-only script: patches missing SEO meta (title + description),
 * and — for FAQ, which was missing a page-level H1 — the hero content too.
 * Never touches products, orders, or any other collection. Safe to re-run.
 */
const run = async () => {
  const payload = await getPayload({ config })

  const patchPageMeta = async (slug: string, meta: { title: string; description: string }) => {
    const { docs } = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1 })
    const doc = docs[0]
    if (!doc) {
      payload.logger.warn(`Page "${slug}" not found, skipping.`)
      return
    }
    if (doc.meta?.title && doc.meta?.description) {
      payload.logger.info(`Page "${slug}" already has meta, skipping.`)
      return
    }
    await payload.update({
      collection: 'pages',
      id: doc.id,
      data: { meta: { ...doc.meta, ...meta } },
      context: { disableRevalidate: true },
    })
    payload.logger.info(`Patched meta for page "${slug}".`)
  }

  const upsertFullPage = async (data: ReturnType<typeof aboutPageData>) => {
    const { docs } = await payload.find({ collection: 'pages', where: { slug: { equals: data.slug } }, limit: 1 })
    if (docs[0]) {
      await payload.update({ collection: 'pages', id: docs[0].id, data, context: { disableRevalidate: true } })
      payload.logger.info(`Updated page "${data.slug}" (meta + hero fix).`)
    } else {
      await payload.create({ collection: 'pages', data, context: { disableRevalidate: true } })
      payload.logger.info(`Created page "${data.slug}".`)
    }
  }

  // The "contact" page was never actually created — only its nav/footer
  // links exist, pointing at a 404. Create the form + page now.
  const { docs: existingContactPage } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'contact' } },
    limit: 1,
  })

  if (!existingContactPage[0]) {
    const { docs: existingForms } = await payload.find({
      collection: 'forms',
      where: { title: { equals: 'Contact Form' } },
      limit: 1,
    })

    const contactForm =
      existingForms[0] ?? (await payload.create({ collection: 'forms', data: contactFormData() }))

    await payload.create({
      collection: 'pages',
      data: {
        ...contactPageData({ contactForm }),
        meta: {
          title: 'Contact Us | Picmychip',
          description:
            'Get in touch with the Picmychip team for order support, bulk pricing, or questions about a component before you buy.',
        },
      },
      context: { disableRevalidate: true },
    })
    payload.logger.info('Created page "contact" (it never existed).')
  } else {
    await patchPageMeta('contact', {
      title: 'Contact Us | Picmychip',
      description:
        'Get in touch with the Picmychip team for order support, bulk pricing, or questions about a component before you buy.',
    })
  }

  await upsertFullPage(aboutPageData())
  await upsertFullPage(faqPageData())
  await upsertFullPage(privacyPolicyPageData())
  await upsertFullPage(termsPolicyPageData())

  payload.logger.info('Done.')
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
