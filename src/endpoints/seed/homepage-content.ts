import type { Payload } from 'payload'

const textNode = (text: string) => ({ type: 'text', text, version: 1 })

const paragraph = (text: string) => ({
  type: 'paragraph',
  children: [textNode(text)],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
})

const heading = (text: string, tag: 'h1' | 'h2' | 'h3' = 'h2') => ({
  type: 'heading',
  tag,
  children: [textNode(text)],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
})

type RichTextNode = { type: string; version: number; [key: string]: unknown }

const richText = (nodes: RichTextNode[]) => ({
  root: {
    type: 'root',
    children: nodes,
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
  },
})

const CATEGORY_SLUGS = [
  'resistor',
  'connectors',
  'drone-parts',
  'capacitor',
  'diode',
  'usb-cables',
  'inductor',
  'ic',
]

const BRAND_NAMES = [
  'Texas Instruments',
  'STMicroelectronics',
  'Vishay',
  'Molex',
  'TE Connectivity',
  'Arduino',
]

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const SERVICES = [
  { title: 'PCB Manufacturing', description: 'Custom boards fabricated to spec, 2-8 layers.' },
  { title: '3D Printing', description: 'FDM and resin printing for prototypes and enclosures.' },
  { title: 'Laser Cutting', description: 'Precision-cut acrylic, wood, and thin metal panels.' },
  {
    title: 'Custom Battery Packs',
    description: 'Li-ion/LiPo packs built to your voltage and capacity.',
  },
]

/**
 * Existing product photography reused as hero/promo banner imagery — there
 * are no dedicated marketing banners uploaded (no R2 credentials configured
 * in this environment yet), so real catalog photos stand in rather than
 * leaving these sections without images or inventing placeholder assets.
 */
const findMediaByFilenameFragment = async (payload: Payload, fragment: string) => {
  const { docs } = await payload.find({
    collection: 'media',
    where: { filename: { contains: fragment } },
    limit: 1,
  })
  return docs[0]
}

/**
 * One-time content seed: creates a handful of Brands and Services (both
 * collections were empty), sets Footer link columns, and (re)creates the
 * `home` Page using the blocks built this session. Safe to re-run — the
 * Page is deleted and recreated each time so layout changes take effect;
 * Brands/Services are looked up by title first so re-runs don't duplicate.
 */
export const seedHomepageContent = async (payload: Payload) => {
  const categoryDocs = await Promise.all(
    CATEGORY_SLUGS.map(async (slug) => {
      const { docs } = await payload.find({
        collection: 'categories',
        where: { slug: { equals: slug } },
        limit: 1,
      })
      return docs[0]
    }),
  )
  const categoryIds = categoryDocs.filter(Boolean).map((doc) => doc!.id)
  const resistorCategoryId = categoryDocs.find((doc) => doc?.slug === 'resistor')?.id
  const modulesCategoryId = categoryDocs.find((doc) => doc?.slug === 'ic')?.id

  const brands = []
  for (const title of BRAND_NAMES) {
    const { docs: existing } = await payload.find({
      collection: 'brands',
      where: { title: { equals: title } },
      limit: 1,
    })
    brands.push(
      existing[0] ??
        (await payload.create({ collection: 'brands', data: { title, slug: toSlug(title) } })),
    )
  }

  const services = []
  for (const service of SERVICES) {
    const { docs: existing } = await payload.find({
      collection: 'services',
      where: { title: { equals: service.title } },
      limit: 1,
    })
    services.push(
      existing[0] ??
        (await payload.create({
          collection: 'services',
          data: { ...service, slug: toSlug(service.title) },
        })),
    )
  }

  const droneImage = await findMediaByFilenameFragment(payload, 'drone')
  const moduleImage = await findMediaByFilenameFragment(payload, 'relay-module')

  // Footer link columns — only real, working routes; no placeholder policy
  // pages or fabricated links.
  await payload.updateGlobal({
    slug: 'footer',
    data: {
      newsletterHeading: 'Subscribe to our Newsletter',
      newsletterCopy: 'Get 10% off your first order',
      columns: [
        {
          title: 'Information',
          links: [
            { link: { type: 'custom', url: '/shop', label: 'Shop All Products', newTab: false } },
            {
              link: { type: 'custom', url: '/guides', label: 'Guides & Tutorials', newTab: false },
            },
            { link: { type: 'custom', url: '/compare', label: 'Compare Products', newTab: false } },
          ],
        },
        {
          title: 'My Account',
          links: [
            { link: { type: 'custom', url: '/account', label: 'My Account', newTab: false } },
            { link: { type: 'custom', url: '/orders', label: 'My Orders', newTab: false } },
            {
              link: { type: 'custom', url: '/find-order', label: 'Track an Order', newTab: false },
            },
          ],
        },
        {
          title: 'Services',
          links: services.map((service) => ({
            link: {
              type: 'custom' as const,
              url: `/services/${service.slug}`,
              label: service.title,
              newTab: false,
            },
          })),
        },
      ],
    },
  })

  const { docs: existingHome } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
  })

  if (existingHome[0]) {
    await payload.delete({
      collection: 'pages',
      id: existingHome[0].id,
      context: { disableRevalidate: true },
    })
  }

  const flashDealEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  await payload.create({
    collection: 'pages',
    // Revalidation needs an active Next.js request context, which isn't
    // present when this is run as a standalone script — the running app
    // will revalidate `/` on its own the next time this page is edited.
    context: { disableRevalidate: true },
    data: {
      title: 'Home',
      slug: 'home',
      _status: 'published',
      hero: { type: 'none' },
      layout: [
        ...(droneImage
          ? [
              {
                blockType: 'heroCarousel' as const,
                slides: [
                  {
                    layout: 'fullBleed' as const,
                    image: droneImage.id,
                    badge: 'New Arrivals',
                    heading: 'Everything for Your Next Build',
                    subheading:
                      'Resistors, capacitors, connectors, ICs, and drone parts — all spec-verified.',
                    link: {
                      type: 'custom' as const,
                      url: '/shop',
                      label: 'Shop All Products',
                      newTab: false,
                    },
                  },
                  ...(moduleImage
                    ? [
                        {
                          layout: 'split' as const,
                          image: moduleImage.id,
                          heading: 'Modules & Interface Boards',
                          subheading: 'Relay modules, drivers, and more — ready to ship.',
                          link: {
                            type: 'custom' as const,
                            url: modulesCategoryId ? `/category/ic` : '/shop',
                            label: 'Browse Modules',
                            newTab: false,
                          },
                        },
                      ]
                    : []),
                ],
              },
            ]
          : []),
        {
          blockType: 'rfqBomSection' as const,
          badge: 'Instant Sourcing Hub',
          heading: 'Upload Your BOM. Sit Back. Get the Best Deal!',
          subtitle:
            'Upload a BOM or enter parts manually — we auto-match each line against live inventory, check stock in real time, and roll up target pricing across your full list.',
          bomCard: {
            badge: 'Instant Match',
            title: 'Bulk BOM Upload',
            description:
              'Upload a spreadsheet (.xlsx, .xls, or .csv) with up to 200+ lines — MPN, quantity, and target price are auto-mapped.',
          },
          rfqCard: {
            badge: 'Direct Entry',
            title: 'Quick Multi-Line RFQ',
            description:
              'No file handy? Enter part number, manufacturer, quantity, and target lead time directly in a multi-row grid.',
          },
          primaryLink: { url: '/rfq?upload=1', label: 'Upload BOM (.xlsx / .csv)' },
          secondaryLink: { url: '/rfq#rfq-form', label: 'Enter Manual RFQ Grid' },
        },
        {
          blockType: 'categoryGrid',
          heading: 'Shop by Category',
          categories: categoryIds.map((id) => ({ category: id })),
        },
        ...(resistorCategoryId
          ? [
              {
                blockType: 'flashDeal' as const,
                title: 'Resistor Clearance',
                discountBadge: 'Up to 20% off',
                endDate: flashDealEndDate,
                populateBy: 'collection' as const,
                categories: [resistorCategoryId],
                limit: 8,
              },
            ]
          : []),
        { blockType: 'trendingProducts', heading: 'Featured Products', limit: 8 },
        {
          blockType: 'testimonials',
          heading: 'What Our Customers Are Saying',
          populateBy: 'manual',
          testimonials: [
            {
              name: 'Priya Nair',
              role: 'Robotics student',
              rating: 5,
              quote:
                'Every listing has the actual specs I need — no guessing on voltage ratings or footprint. Saved me from three wrong orders already.',
            },
            {
              name: 'Marcus Webb',
              role: 'Hobbyist maker',
              rating: 5,
              quote:
                'Fast shipping and the connectors actually match the datasheet photos. Rare to find that combination.',
            },
            {
              name: 'Ananya Rao',
              role: 'Drone builder',
              rating: 4,
              quote:
                'Great range of drone parts in one place. Would love to see more ESC options, but overall very solid.',
            },
          ],
        },
        ...(droneImage && moduleImage
          ? [
              {
                blockType: 'featuredCollection' as const,
                panels: [
                  {
                    image: droneImage.id,
                    heading: 'Drone Building Essentials',
                    copy: 'Everything you need for your next drone build.',
                    link: {
                      type: 'custom' as const,
                      url: '/category/drone-parts',
                      label: 'Shop the Collection',
                      newTab: false,
                    },
                  },
                  {
                    image: moduleImage.id,
                    heading: 'New: Modules & Interface Boards',
                    copy: 'Expand your project with our latest module arrivals.',
                    link: {
                      type: 'custom' as const,
                      url: '/category/ic',
                      label: 'Shop the Collection',
                      newTab: false,
                    },
                  },
                ],
              },
            ]
          : []),
        { blockType: 'contentFeed', heading: 'Tutorials', filterBy: 'all', limit: 4 },
        { blockType: 'trustBadgesStrip', badges: [] },
        {
          blockType: 'brandStrip',
          heading: 'Trusted by 140+ brands worldwide',
          brands: brands.map((b) => b.id),
        },
        {
          blockType: 'faq',
          heading: 'Frequently Asked Questions',
          items: [
            {
              question: "What's your return policy?",
              answer: richText([
                paragraph(
                  'Unopened components can be returned within 7 days of delivery for a full refund.',
                ),
              ]),
            },
          ],
        },
      ],
      meta: {
        title: 'Picmychip — Electronic Components, Connectors & Cables',
        description:
          'Spec-verified resistors, capacitors, diodes, connectors, cables, ICs, and drone parts for makers, engineers, and hobbyists.',
      },
    },
  })

  payload.logger.info(
    'Homepage content seeded: brands, services, footer columns, and the home Page.',
  )
}
