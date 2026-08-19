import type { Payload, PayloadRequest } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const SEED_IMAGES_DIR = path.resolve(dirname, 'images')

// ---------------------------------------------------------------------------
// Lexical richText helpers
// ---------------------------------------------------------------------------

const textNode = (text: string) => ({ type: 'text', text, version: 1 })

const paragraph = (text: string) => ({
  type: 'paragraph',
  children: [textNode(text)],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
})

const heading = (text: string, tag: 'h2' | 'h3' = 'h2') => ({
  type: 'heading',
  tag,
  children: [textNode(text)],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
})

const richText = (nodes: unknown[]) => ({
  root: {
    type: 'root',
    children: nodes,
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  },
})

// ---------------------------------------------------------------------------
// Category + product content
// ---------------------------------------------------------------------------

type FaqEntry = { question: string; answer: string }

type ProductSeed = {
  slug: string
  title: string
  priceInINR: number
  inventory: number
  specs: Record<string, unknown>
  priceTiers?: { minQuantity: number; priceInINR: number }[]
  backorderLeadTimeDays?: number
}

type CategorySeed = {
  specSchemaType: string
  slug: string
  title: string
  description: string
  imageFile: string
  faq: FaqEntry[]
  products: ProductSeed[]
}

const CATEGORY_SEEDS: CategorySeed[] = [
  {
    specSchemaType: 'drone-motors',
    slug: 'drone-motors',
    title: 'Drone Motors',
    description:
      'Brushless motors for FPV racing, freestyle, and cinematic drone builds — spec-verified KV ratings and stator sizes.',
    imageFile: 'drone-motors.svg',
    faq: [
      {
        question: 'What KV motor do I need for a 5-inch drone?',
        answer:
          'Most 5-inch freestyle and racing builds run 1700-2000KV on 4S-6S batteries. Lower-KV motors suit larger props and cinematic flying; higher-KV suits smaller props and racing.',
      },
      {
        question: "What's the difference between a 2207 and 2306 motor?",
        answer:
          'The numbers describe stator size — width and height in millimeters. A 2207 motor has a 22mm-diameter, 7mm-tall stator; a 2306 is 23mm wide and 6mm tall. Larger stators generally produce more torque and thrust.',
      },
    ],
    products: [
      {
        slug: '2207-racing-motor-1750kv',
        title: '2207 Racing Motor — 1750KV',
        priceInINR: 24.99,
        inventory: 40,
        specs: {
          droneMotor: {
            motorType: 'brushless',
            kvRating: 1750,
            statorWidthMM: 22,
            statorHeightMM: 7,
            weightG: 32,
            applications: ['racing', 'freestyle'],
          },
        },
      },
      {
        slug: '2306-freestyle-motor-1900kv',
        title: '2306 Freestyle Motor — 1900KV',
        priceInINR: 27.99,
        inventory: 4,
        specs: {
          droneMotor: {
            motorType: 'brushless',
            kvRating: 1900,
            statorWidthMM: 23,
            statorHeightMM: 6,
            weightG: 34,
            applications: ['freestyle', 'cinematic'],
          },
        },
        priceTiers: [
          { minQuantity: 1, priceInINR: 27.99 },
          { minQuantity: 5, priceInINR: 24.99 },
          { minQuantity: 10, priceInINR: 21.99 },
        ],
      },
    ],
  },
  {
    specSchemaType: 'sbc',
    slug: 'single-board-computers',
    title: 'Single-Board Computers',
    description:
      'Compact single-board computers for robotics, home automation, and edge-compute projects.',
    imageFile: 'sbc.svg',
    faq: [
      {
        question: 'How much RAM do I need for a robotics project?',
        answer:
          '2GB is plenty for basic GPIO/sensor control; 4GB+ is recommended if you are running computer vision or multiple services at once.',
      },
      {
        question: 'Do these boards support Wi-Fi out of the box?',
        answer:
          'Our compute-module and standard form-factor boards include onboard Wi-Fi and Bluetooth; Zero-format boards vary by model — check the Connectivity spec on each listing.',
      },
    ],
    products: [
      {
        slug: 'compact-sbc-4gb',
        title: 'Compact SBC — 4GB RAM',
        priceInINR: 59.99,
        inventory: 25,
        specs: {
          sbc: {
            modelFamily: 'raspberry-pi-4',
            ramMB: '4096',
            connectivity: ['wifi', 'bluetooth', 'ethernet'],
            gpioPinCount: 40,
          },
        },
      },
      {
        slug: 'zero-format-sbc-512mb',
        title: 'Zero-Format SBC — 512MB',
        priceInINR: 19.99,
        inventory: 15,
        specs: {
          sbc: {
            modelFamily: 'raspberry-pi-zero',
            ramMB: '512',
            connectivity: ['wifi', 'bluetooth'],
            gpioPinCount: 40,
          },
        },
      },
    ],
  },
  {
    specSchemaType: 'microcontrollers',
    slug: 'microcontrollers',
    title: 'Microcontrollers & Dev Boards',
    description:
      'Dev boards for embedded projects — from simple 8-bit micros to dual-core Wi-Fi-enabled modules.',
    imageFile: 'microcontrollers.svg',
    faq: [
      {
        question: 'ESP32 or Arduino — which should I start with?',
        answer:
          'Arduino (ATmega-class) boards are simpler and great for learning digital/analog I/O. ESP32-class boards add Wi-Fi/Bluetooth and far more processing power, better suited for connected projects.',
      },
      {
        question: "What does 'dual-core' mean for a dev board?",
        answer:
          'A dual-core MCU can run two independent tasks in parallel — for example, handling Wi-Fi networking on one core while your sensor loop runs uninterrupted on the other.',
      },
    ],
    products: [
      {
        slug: 'esp32-class-dev-board',
        title: 'ESP32-Class Dev Board',
        priceInINR: 8.99,
        inventory: 100,
        specs: {
          microcontroller: {
            family: 'esp32',
            clockSpeedMHz: 240,
            flashSize: 4,
            flashUnit: 'MB',
            ramSize: 520,
            ramUnit: 'KB',
            ioCount: 34,
            wireless: ['wifi', 'bluetooth', 'ble'],
          },
        },
      },
      {
        slug: 'arduino-class-dev-board',
        title: 'Arduino-Class Dev Board',
        priceInINR: 5.49,
        inventory: 0,
        backorderLeadTimeDays: 12,
        specs: {
          microcontroller: {
            family: 'arduino',
            clockSpeedMHz: 16,
            flashSize: 32,
            flashUnit: 'KB',
            ramSize: 2,
            ramUnit: 'KB',
            ioCount: 20,
            wireless: ['none'],
          },
        },
      },
    ],
  },
  {
    specSchemaType: 'mechanical',
    slug: 'mechanical-components',
    title: 'Mechanical Components',
    description: 'Frames, fasteners, bearings, and couplers for robotics and drone builds.',
    imageFile: 'mechanical.svg',
    faq: [
      {
        question: 'What material should I pick for a drone frame arm?',
        answer:
          'Carbon fiber offers the best stiffness-to-weight ratio for racing and freestyle frames; aluminum is more impact-resistant but heavier, and a good choice for ground-based robotics chassis.',
      },
      {
        question: 'What is a flexible coupler used for?',
        answer:
          'Flexible shaft couplers absorb small misalignments between a motor shaft and a lead screw or wheel axle, reducing wear and vibration in 3D-printer and robotics drivetrains.',
      },
    ],
    products: [
      {
        slug: 'carbon-fiber-frame-arm-set',
        title: 'Carbon Fiber Frame Arm Set',
        priceInINR: 14.99,
        inventory: 60,
        specs: {
          mechanical: {
            componentType: 'frame',
            material: 'carbon-fiber',
            dimensions: { lengthMM: 160, widthMM: 12, heightMM: 4 },
          },
        },
      },
      {
        slug: 'm3-aluminum-standoff-kit',
        title: 'M3 Aluminum Standoff Kit',
        priceInINR: 6.99,
        inventory: 80,
        specs: {
          mechanical: {
            componentType: 'fastener',
            material: 'aluminum',
            dimensions: { lengthMM: 20, widthMM: 3, heightMM: 3 },
          },
        },
        priceTiers: [
          { minQuantity: 1, priceInINR: 6.99 },
          { minQuantity: 10, priceInINR: 5.99 },
          { minQuantity: 25, priceInINR: 4.99 },
        ],
      },
    ],
  },
  {
    specSchemaType: 'tools',
    slug: 'workbench-tools',
    title: 'Workbench Tools',
    description:
      'Soldering stations, multimeters, and hand tools for building and repairing electronics.',
    imageFile: 'tools.svg',
    faq: [
      {
        question: 'What temperature range do I need for a soldering station?',
        answer:
          'General electronics work is comfortable at 300-350°C; lead-free solder and larger joints may need up to 380-400°C.',
      },
      {
        question: 'Do I need a true-RMS multimeter?',
        answer:
          'True-RMS meters give accurate readings on the non-sinusoidal waveforms common in switching power supplies and motor controllers — worth it if you work on anything beyond simple DC circuits.',
      },
    ],
    products: [
      {
        slug: 'digital-soldering-station-60w',
        title: 'Digital Soldering Station — 60W',
        priceInINR: 44.99,
        inventory: 15,
        specs: {
          tool: {
            toolType: 'soldering-station',
            powerWattage: 60,
            voltageSpec: '110-240V AC',
            measurementRanges: [
              { parameter: 'temperature', minValue: 200, maxValue: 480, unit: '°C' },
            ],
          },
        },
      },
      {
        slug: 'true-rms-digital-multimeter',
        title: 'True-RMS Digital Multimeter',
        priceInINR: 32.99,
        inventory: 22,
        specs: {
          tool: {
            toolType: 'multimeter',
            voltageSpec: '9V battery',
            measurementRanges: [
              { parameter: 'voltage-dc', minValue: 0, maxValue: 1000, unit: 'V' },
              { parameter: 'current', minValue: 0, maxValue: 10, unit: 'A' },
              { parameter: 'resistance', minValue: 0, maxValue: 60000000, unit: 'Ω' },
            ],
          },
        },
      },
    ],
  },
  {
    specSchemaType: 'filaments',
    slug: '3d-printing-filaments',
    title: '3D Printing Filaments',
    description:
      'PLA, PETG, and specialty filaments for FDM 3D printing — consistent diameter, spooled and ready to print.',
    imageFile: 'filaments.svg',
    faq: [
      {
        question: 'PLA vs PETG — which should I use?',
        answer:
          'PLA is easier to print and ideal for prototypes and display parts; PETG is tougher, more heat- and impact-resistant, and better suited for functional or outdoor parts.',
      },
      {
        question: 'Why does spool weight matter?',
        answer:
          'Net filament weight (usually 1kg or 0.5kg) determines how much material you are actually getting — always check net weight, not just spool diameter, when comparing prices.',
      },
    ],
    products: [
      {
        slug: 'pla-filament-175mm-black',
        title: 'PLA Filament 1.75mm — Black',
        priceInINR: 19.99,
        inventory: 50,
        specs: {
          filament: {
            materialType: 'pla',
            diameterMM: '1.75',
            color: 'Black',
            colorHex: '#000000',
            spoolWeightG: 1000,
            printTempMinC: 190,
            printTempMaxC: 220,
          },
        },
      },
      {
        slug: 'petg-filament-175mm-natural',
        title: 'PETG Filament 1.75mm — Natural',
        priceInINR: 24.99,
        inventory: 45,
        specs: {
          filament: {
            materialType: 'petg',
            diameterMM: '1.75',
            color: 'Natural',
            colorHex: '#e8dfce',
            spoolWeightG: 1000,
            printTempMinC: 230,
            printTempMaxC: 250,
          },
        },
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

/**
 * Pages and Guides both run an afterChange hook that calls Next.js
 * `revalidatePath`, which throws when there's no real request context (e.g.
 * this module invoked from a script rather than a live Next.js route). The
 * document write itself happens before that hook runs, so on failure we
 * refetch by slug instead of trusting the (possibly rejected) create() call.
 */
const createResilient = async <T extends 'pages' | 'guides'>(
  payload: Payload,
  collection: T,
  slug: string,
  data: Record<string, unknown>,
  req: PayloadRequest,
) => {
  try {
    return await payload.create({ collection, data, req } as any)
  } catch {
    const existing = await payload.find({
      collection,
      where: { slug: { equals: slug } },
      req,
    } as any)
    return existing.docs[0]
  }
}

export const seedMakerStore = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<{ categories: number; products: number }> => {
  payload.logger.info('Seeding maker-store content...')

  // Idempotent-safe: only delete docs by the slugs this module manages.
  const categorySlugs = CATEGORY_SEEDS.map((c) => c.slug)
  const productSlugs = CATEGORY_SEEDS.flatMap((c) => c.products.map((p) => p.slug))
  const guideSlugs = ['choosing-drone-motors', 'pla-vs-petg-vs-abs']

  await payload.delete({ collection: 'products', where: { slug: { in: productSlugs } }, req })
  await payload.delete({ collection: 'guides', where: { slug: { in: guideSlugs } }, req })
  await payload.delete({ collection: 'categories', where: { slug: { in: categorySlugs } }, req })
  await payload
    .delete({ collection: 'pages', where: { slug: { in: ['home', 'about'] } }, req })
    .catch(() => {})

  const categoryDocs: Record<string, { id: string | number; title: string }> = {}
  const productDocs: Record<string, { id: string | number; title: string }> = {}

  for (const categorySeed of CATEGORY_SEEDS) {
    const media = await payload.create({
      collection: 'media',
      data: { alt: `${categorySeed.title} illustration` },
      filePath: path.join(SEED_IMAGES_DIR, categorySeed.imageFile),
      req,
    })

    const category = await payload.create({
      collection: 'categories',
      data: {
        title: categorySeed.title,
        slug: categorySeed.slug,
        specSchemaType: categorySeed.specSchemaType,
        meta: { description: categorySeed.description },
        layout: [
          {
            blockType: 'faq',
            heading: `${categorySeed.title} FAQ`,
            items: categorySeed.faq.map((entry) => ({
              question: entry.question,
              answer: richText([paragraph(entry.answer)]),
            })),
          },
        ],
      } as any,
      req,
    })

    categoryDocs[categorySeed.slug] = { id: category.id, title: category.title }

    for (const productSeed of categorySeed.products) {
      const product = await payload.create({
        collection: 'products',
        data: {
          title: productSeed.title,
          slug: productSeed.slug,
          _status: 'published',
          categories: [category.id],
          specSchemaType: categorySeed.specSchemaType,
          priceInINR: productSeed.priceInINR,
          priceInINREnabled: true,
          inventory: productSeed.inventory,
          gallery: [{ image: media.id }],
          specs: productSeed.specs,
          ...(productSeed.priceTiers ? { priceTiers: productSeed.priceTiers } : {}),
        } as any,
        req,
      })

      if (productSeed.backorderLeadTimeDays) {
        await payload.update({
          collection: 'products',
          id: product.id,
          data: {
            stockStatus: 'backorder',
            leadTimeDays: productSeed.backorderLeadTimeDays,
          } as any,
          req,
        })
      }

      productDocs[productSeed.slug] = { id: product.id, title: product.title }
    }
  }

  // -------------------------------------------------------------------------
  // Site settings
  // -------------------------------------------------------------------------

  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      organizationName: 'Picmychip Maker Supply',
      description: 'Electronics, robotics, and maker components — spec-verified and ready to ship.',
      foundingDate: '2021-01-01',
    },
    req,
  })

  // -------------------------------------------------------------------------
  // Header / footer nav
  // -------------------------------------------------------------------------

  const navLink = (label: string, url: string) => ({
    link: { type: 'custom' as const, url, label, newTab: false },
  })

  await payload.updateGlobal({
    slug: 'header',
    data: {
      navItems: [
        navLink('Shop', '/shop'),
        navLink('Guides', '/guides'),
        navLink('About', '/about'),
      ],
    },
    req,
  })

  await payload.updateGlobal({
    slug: 'footer',
    data: {
      navItems: [
        navLink('About', '/about'),
        navLink('Guides', '/guides'),
        navLink('Shop', '/shop'),
      ],
    },
    req,
  })

  // -------------------------------------------------------------------------
  // Homepage
  // -------------------------------------------------------------------------

  const categoryIds = CATEGORY_SEEDS.map((c) => categoryDocs[c.slug]!.id)

  await createResilient(
    payload,
    'pages',
    'home',
    {
      title: 'Home',
      slug: 'home',
      _status: 'published',
      hero: {
        type: 'illustrated',
        illustrationKey: 'workshop',
        richText: richText([
          heading('Electronics, Robotics & Maker Components'),
          paragraph(
            'Drone motors, single-board computers, microcontrollers, mechanical parts, workbench tools, and 3D printing filament — every listing shows the specs that actually matter.',
          ),
        ]),
        links: [
          {
            link: {
              type: 'custom',
              url: '/shop',
              label: 'Shop All Products',
              newTab: false,
              appearance: 'default',
            },
          },
          {
            link: {
              type: 'custom',
              url: '/guides',
              label: 'Browse Guides',
              newTab: false,
              appearance: 'outline',
            },
          },
        ],
      },
      layout: [
        {
          blockType: 'illustratedCategoryGrid',
          heading: 'Shop by Category',
          categories: categoryIds,
        },
        {
          blockType: 'archive',
          introContent: richText([heading('Featured Products')]),
          populateBy: 'collection',
          limit: 8,
        },
        {
          blockType: 'content',
          columns: [
            {
              size: 'oneThird',
              richText: richText([
                heading('Spec-Verified', 'h3'),
                paragraph(
                  'Every listing shows the real numbers — KV rating, clock speed, print temperature — not just marketing copy.',
                ),
              ]),
              enableLink: false,
            },
            {
              size: 'oneThird',
              richText: richText([
                heading('Fast Shipping', 'h3'),
                paragraph('In-stock orders ship within 1 business day.'),
              ]),
              enableLink: false,
            },
            {
              size: 'oneThird',
              richText: richText([
                heading('Built by Makers', 'h3'),
                paragraph('Curated by people who actually build drones, robots, and prints.'),
              ]),
              enableLink: false,
            },
          ],
        },
        {
          blockType: 'faq',
          heading: 'Frequently Asked Questions',
          items: [
            {
              question: "What's your return policy?",
              answer: richText([
                paragraph(
                  'Unopened components can be returned within 30 days of delivery for a full refund.',
                ),
              ]),
            },
          ],
        },
      ],
    },
    req,
  )

  // -------------------------------------------------------------------------
  // About page
  // -------------------------------------------------------------------------

  await createResilient(
    payload,
    'pages',
    'about',
    {
      title: 'About',
      slug: 'about',
      _status: 'published',
      hero: {
        type: 'lowImpact',
        richText: richText([heading('About Picmychip Maker Supply')]),
      },
      layout: [
        {
          blockType: 'content',
          columns: [
            {
              size: 'full',
              richText: richText([
                heading('Our Story', 'h3'),
                paragraph(
                  "Picmychip Maker Supply was founded to give hobbyists, robotics builders, and drone pilots a single source for spec-verified components — no more guessing whether a motor's KV rating or a board's RAM is actually what the listing says.",
                ),
              ]),
              enableLink: false,
            },
            {
              size: 'full',
              richText: richText([
                heading('Warranty & Returns', 'h3'),
                paragraph(
                  'All components carry a 90-day defect warranty. Unopened items can be returned within 30 days of delivery.',
                ),
              ]),
              enableLink: false,
            },
            {
              size: 'full',
              richText: richText([
                heading('Sourcing', 'h3'),
                paragraph(
                  'We work directly with component manufacturers and verify specs in-house before anything goes live on the site.',
                ),
              ]),
              enableLink: false,
            },
          ],
        },
      ],
    },
    req,
  )

  // -------------------------------------------------------------------------
  // Guides
  // -------------------------------------------------------------------------

  await createResilient(
    payload,
    'guides',
    'choosing-drone-motors',
    {
      title: 'Complete Guide to Choosing Drone Motors',
      slug: 'choosing-drone-motors',
      _status: 'published',
      relatedCategory: categoryDocs['drone-motors']!.id,
      hero: {
        type: 'illustrated',
        illustrationKey: 'drone-motors',
        richText: richText([
          paragraph(
            'A 5-inch freestyle build typically wants a 1700-2000KV motor on 4S-6S; racing frames favor lighter, higher-KV setups, while cinematic rigs run lower KV for smoother, more efficient flight.',
          ),
        ]),
      },
      layout: [
        {
          blockType: 'content',
          columns: [
            {
              size: 'full',
              richText: richText([
                heading('Stator Size'),
                paragraph(
                  "A motor's stator size — printed as a 4-digit code like 2207 — encodes diameter and height in millimeters. Larger stators produce more torque and thrust but add weight and cost.",
                ),
                heading('KV Rating'),
                paragraph(
                  'KV describes RPM per volt with no load. Lower-KV motors turn larger propellers efficiently at lower current draw; higher-KV motors suit smaller props and higher-RPM racing setups.',
                ),
              ]),
              enableLink: false,
            },
          ],
        },
        {
          blockType: 'faq',
          heading: 'FAQ',
          items: CATEGORY_SEEDS.find((c) => c.slug === 'drone-motors')!.faq.map((entry) => ({
            question: entry.question,
            answer: richText([paragraph(entry.answer)]),
          })),
        },
        {
          blockType: 'comparisonTable',
          heading: 'Motor Comparison',
          products: [
            productDocs['2207-racing-motor-1750kv']!.id,
            productDocs['2306-freestyle-motor-1900kv']!.id,
          ],
        },
      ],
    },
    req,
  )

  await createResilient(
    payload,
    'guides',
    'pla-vs-petg-vs-abs',
    {
      title: 'PLA vs PETG vs ABS: Choosing the Right Filament',
      slug: 'pla-vs-petg-vs-abs',
      _status: 'published',
      relatedCategory: categoryDocs['3d-printing-filaments']!.id,
      hero: {
        type: 'illustrated',
        illustrationKey: 'filaments',
        richText: richText([
          paragraph(
            'PLA is the easiest material to print and best for prototypes and display parts; PETG adds toughness and heat resistance for functional parts; ABS offers the highest heat resistance but needs an enclosed printer and good ventilation.',
          ),
        ]),
      },
      layout: [
        {
          blockType: 'content',
          columns: [
            {
              size: 'full',
              richText: richText([
                heading('PLA'),
                paragraph(
                  'Low warping, no enclosure needed, and the widest range of print-temperature tolerance — the default choice for most prints.',
                ),
                heading('PETG'),
                paragraph(
                  'Tougher and more heat-resistant than PLA, with better layer adhesion for functional, load-bearing parts.',
                ),
                heading('ABS'),
                paragraph(
                  'The most heat-resistant of the three, but prone to warping without an enclosed, heated print environment.',
                ),
              ]),
              enableLink: false,
            },
          ],
        },
        {
          blockType: 'faq',
          heading: 'FAQ',
          items: CATEGORY_SEEDS.find((c) => c.slug === '3d-printing-filaments')!.faq.map(
            (entry) => ({
              question: entry.question,
              answer: richText([paragraph(entry.answer)]),
            }),
          ),
        },
        {
          blockType: 'comparisonTable',
          heading: 'Filament Comparison',
          products: [
            productDocs['pla-filament-175mm-black']!.id,
            productDocs['petg-filament-175mm-natural']!.id,
          ],
        },
      ],
    },
    req,
  )

  payload.logger.info(
    `Maker-store content seeded: ${CATEGORY_SEEDS.length} categories, ${productSlugs.length} products.`,
  )

  return { categories: CATEGORY_SEEDS.length, products: productSlugs.length }
}
