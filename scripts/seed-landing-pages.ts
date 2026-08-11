import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

import { aboutPageData } from '../src/endpoints/seed/about-page'
import { faqPageData } from '../src/endpoints/seed/faq-page'
import { privacyPolicyPageData, termsPolicyPageData } from '../src/endpoints/seed/legal-pages'

/**
 * Additive-only script: creates/updates the About, FAQ, Privacy Policy, and
 * Terms & Refund Policy pages, and wires them into the Header "Pages"
 * dropdown + Footer "Quick Links" column. Never touches products, orders,
 * carts, media, or the existing home/contact pages — safe to run against a
 * database that already has real catalog data, and safe to re-run.
 */
const run = async () => {
  const payload = await getPayload({ config })

  const upsertPage = async (data: ReturnType<typeof aboutPageData>) => {
    const { docs } = await payload.find({
      collection: 'pages',
      where: { slug: { equals: data.slug } },
      limit: 1,
    })

    if (docs[0]) {
      payload.logger.info(`Updating page "${data.slug}"...`)
      return payload.update({
        collection: 'pages',
        id: docs[0].id,
        data,
        context: { disableRevalidate: true },
      })
    }

    payload.logger.info(`Creating page "${data.slug}"...`)
    return payload.create({
      collection: 'pages',
      data,
      context: { disableRevalidate: true },
    })
  }

  await upsertPage(aboutPageData())
  await upsertPage(faqPageData())
  await upsertPage(privacyPolicyPageData())
  await upsertPage(termsPolicyPageData())

  // --- Header: replace the top-level nav with Shop / Guides / Pages▾ / Contact ---
  const shopItem = { link: { type: 'custom' as const, url: '/shop', label: 'Shop', newTab: false }, children: [] }
  const guidesItem = { link: { type: 'custom' as const, url: '/guides', label: 'Guides', newTab: false }, children: [] }
  const pagesDropdown = {
    link: { type: 'custom' as const, url: '#', label: 'Pages', newTab: false },
    children: [
      { link: { type: 'custom' as const, url: '/about', label: 'About Us', newTab: false } },
      { link: { type: 'custom' as const, url: '/faq', label: 'FAQ', newTab: false } },
    ],
  }
  const contactItem = { link: { type: 'custom' as const, url: '/contact', label: 'Contact', newTab: false }, children: [] }

  await payload.updateGlobal({
    slug: 'header',
    data: { navItems: [shopItem, guidesItem, pagesDropdown, contactItem] },
  })
  payload.logger.info('Updated header nav to Shop / Guides / Pages▾ / Contact.')

  // --- Footer: add/replace a "Quick Links" column ---
  const footer = await payload.findGlobal({ slug: 'footer' })
  const existingColumns = footer.columns ?? []

  const quickLinksColumn = {
    title: 'Quick Links',
    links: [
      { link: { type: 'custom' as const, url: '/about', label: 'About Us', newTab: false } },
      { link: { type: 'custom' as const, url: '/faq', label: "FAQ's", newTab: false } },
      { link: { type: 'custom' as const, url: '/privacy-policy', label: 'Privacy Policy', newTab: false } },
      { link: { type: 'custom' as const, url: '/terms', label: 'Terms & Refund Policy', newTab: false } },
      { link: { type: 'custom' as const, url: '/contact', label: 'Contact', newTab: false } },
    ],
  }

  const nextColumns = existingColumns.some((column) => column.title === 'Quick Links')
    ? existingColumns.map((column) => (column.title === 'Quick Links' ? quickLinksColumn : column))
    : [...existingColumns, quickLinksColumn].slice(0, 5)

  await payload.updateGlobal({ slug: 'footer', data: { columns: nextColumns } })
  payload.logger.info('Updated footer with "Quick Links" column.')

  payload.logger.info('Done.')
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
