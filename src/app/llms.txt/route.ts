import { getCachedGlobal } from '@/utilities/getGlobals'
import { getServerSideURL } from '@/utilities/getURL'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const revalidate = 3600

// llmstxt.org convention: a plain-markdown map of the site for LLMs/agents to
// read instead of crawling — an H1 + one-line summary, then H2 sections of
// `[Title](url): description` links. Every link below is a real route,
// cross-checked against sitemap.ts/robots.ts rather than guessed.
function formatLinks(links: { title: string; url: string; description?: string }[]) {
  return links.map(({ title, url, description }) => `- [${title}](${url})${description ? `: ${description}` : ''}`).join('\n')
}

export async function GET() {
  const baseUrl = getServerSideURL()
  const payload = await getPayload({ config: configPromise })

  const [siteSettings, categories, guides] = await Promise.all([
    getCachedGlobal('site-settings', 0)(),
    payload.find({
      collection: 'categories',
      limit: 12,
      overrideAccess: false,
      pagination: false,
      sort: 'sequence',
      select: { title: true, slug: true },
    }),
    payload.find({
      collection: 'guides',
      draft: false,
      limit: 10,
      overrideAccess: false,
      pagination: false,
      sort: '-updatedAt',
      select: { title: true, slug: true, excerpt: true, authorName: true },
      where: { _status: { equals: 'published' } },
    }),
  ])

  const orgName = siteSettings?.organizationName || 'Picmychip'
  const summary =
    siteSettings?.description ||
    'An electronics components store: spec-verified parts, BOM/RFQ sourcing for bulk and custom orders, and build guides for makers and engineers.'

  const categoryLinks = categories.docs.map((category) => ({
    title: category.title,
    url: `${baseUrl}/category/${category.slug}`,
  }))

  const guideLinks = guides.docs
    .filter((guide) => !guide.authorName)
    .map((guide) => ({
      title: guide.title,
      url: `${baseUrl}/guides/${guide.slug}`,
      description: guide.excerpt || undefined,
    }))

  const sections = [
    {
      heading: 'Shop',
      links: [
        { title: 'All products', url: `${baseUrl}/shop` },
        ...categoryLinks,
      ],
    },
    {
      heading: 'Sourcing',
      links: [
        { title: 'Upload a BOM for a quote', url: `${baseUrl}/rfq?upload=1` },
        { title: 'Request a quote (RFQ)', url: `${baseUrl}/rfq#rfq-form` },
        { title: 'Track an order', url: `${baseUrl}/find-order` },
      ],
    },
    {
      heading: 'Guides',
      links: [{ title: 'All guides', url: `${baseUrl}/guides` }, ...guideLinks],
    },
    {
      heading: 'Support',
      links: [
        { title: 'Help Center', url: `${baseUrl}/help` },
        { title: 'FAQ', url: `${baseUrl}/faq` },
        { title: 'Contact', url: `${baseUrl}/contact` },
        { title: 'Start a return', url: `${baseUrl}/returns` },
        { title: 'Shipping policy', url: `${baseUrl}/shipping-policy` },
        { title: 'Cancellation & refund policy', url: `${baseUrl}/cancellation-refund-policy` },
      ],
    },
  ]

  const optional = [
    { title: 'Privacy policy', url: `${baseUrl}/privacy-policy` },
    { title: 'Terms', url: `${baseUrl}/terms` },
  ]

  const body = `# ${orgName}

> ${summary}

${sections.map((section) => `## ${section.heading}\n\n${formatLinks(section.links)}`).join('\n\n')}

## Optional

${formatLinks(optional)}
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  })
}
