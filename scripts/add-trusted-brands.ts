import 'dotenv/config'
import { getPayload } from 'payload'
import sharp from 'sharp'
import config from '../src/payload.config'

type BrandSpec = {
  title: string
  slug: string
  logoUrl: string
}

const BRANDS: BrandSpec[] = [
  {
    title: 'Visteon',
    slug: 'visteon',
    logoUrl:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhIW9dMrGsgBUNYUppi8mO_hw4k_UoawvnHfheMs020q9dqPrhyQ4ravc&s=10',
  },
  {
    title: 'VVDN Technologies',
    slug: 'vvdn-technologies',
    logoUrl: 'https://www.vvdntech.com/images/vvdn_site_logo.svg',
  },
]

// Generic placeholder used only if a brand's real logo can't be downloaded —
// a plain "company" glyph so the brand strip still shows something coherent
// instead of a broken image.
const DUMMY_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#f4f4f5"/>
  <g fill="none" stroke="#a1a1aa" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <rect x="60" y="50" width="80" height="120"/>
    <path d="M60 170V50h80v120"/>
    <path d="M78 68h12M110 68h12M78 92h12M110 92h12M78 116h12M110 116h12M78 140h24"/>
  </g>
</svg>`

const fetchAsBuffer = async (url: string): Promise<{ buffer: Buffer; mimetype: string } | null> => {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const arrayBuffer = await response.arrayBuffer()
    const mimetype = response.headers.get('content-type') || 'image/png'
    return { buffer: Buffer.from(arrayBuffer), mimetype }
  } catch {
    return null
  }
}

const run = async () => {
  const payload = await getPayload({ config })

  const dummyLogoBuffer = await sharp(Buffer.from(DUMMY_LOGO_SVG)).png().toBuffer()

  const newBrandIds: number[] = []

  for (const brand of BRANDS) {
    const { docs: existing } = await payload.find({
      collection: 'brands',
      where: { slug: { equals: brand.slug } },
      limit: 1,
    })

    if (existing[0]) {
      payload.logger.info(`Brand "${brand.title}" already exists, skipping.`)
      newBrandIds.push(existing[0].id)
      continue
    }

    const downloaded = await fetchAsBuffer(brand.logoUrl)

    const logoDoc = await payload.create({
      collection: 'media',
      data: { alt: `${brand.title} logo` },
      file: {
        data: downloaded?.buffer ?? dummyLogoBuffer,
        mimetype: downloaded?.mimetype ?? 'image/png',
        name: downloaded ? `${brand.slug}-logo.${downloaded.mimetype.includes('svg') ? 'svg' : 'png'}` : `${brand.slug}-logo-placeholder.png`,
        size: (downloaded?.buffer ?? dummyLogoBuffer).length,
      },
    })

    payload.logger.info(
      downloaded
        ? `Downloaded real logo for "${brand.title}".`
        : `Could not download logo for "${brand.title}" — used placeholder icon instead.`,
    )

    const brandDoc = await payload.create({
      collection: 'brands',
      data: {
        title: brand.title,
        slug: brand.slug,
        logo: logoDoc.id,
      },
    })

    newBrandIds.push(brandDoc.id)
    payload.logger.info(`Created brand "${brand.title}".`)
  }

  // Append to the homepage's existing brandStrip block rather than
  // replacing it, so Texas Instruments/STMicro/etc. stay in the carousel.
  const { docs: homeDocs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
  })
  const home = homeDocs[0]

  if (home) {
    const layout = home.layout ?? []
    const brandStripIndex = layout.findIndex((block) => block.blockType === 'brandStrip')

    if (brandStripIndex >= 0) {
      const brandStripBlock = layout[brandStripIndex] as { brands?: (number | null)[] }
      const existingIds = (brandStripBlock.brands ?? []).filter((id): id is number => typeof id === 'number')
      const mergedIds = Array.from(new Set([...existingIds, ...newBrandIds]))

      const nextLayout = layout.map((block, index) =>
        index === brandStripIndex ? { ...block, brands: mergedIds } : block,
      )

      await payload.update({
        collection: 'pages',
        id: home.id,
        data: { layout: nextLayout },
        context: { disableRevalidate: true },
      })
      payload.logger.info(`Updated homepage brand strip with ${newBrandIds.length} new brand(s).`)
    } else {
      payload.logger.warn('No brandStrip block found on the homepage — brands created but not linked.')
    }
  }

  payload.logger.info('Done.')
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
