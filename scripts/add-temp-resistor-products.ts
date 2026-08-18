import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

// Temporary test products, per user request — a 1KΩ and 100Ω resistor at ₹0.50 each, with
// simple generated images (real resistor color-band convention: brown-black-red = 1KΩ,
// brown-black-brown = 100Ω) since these aren't meant to be permanent catalog entries.
const resistorSvg = (bands: [string, string, string]) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200">
  <line x1="20" y1="100" x2="130" y2="100" stroke="#8a8a8a" stroke-width="6" />
  <line x1="270" y1="100" x2="380" y2="100" stroke="#8a8a8a" stroke-width="6" />
  <rect x="130" y="60" width="140" height="80" rx="16" fill="#e8c895" stroke="#c9a86c" stroke-width="2" />
  <rect x="165" y="60" width="14" height="80" fill="${bands[0]}" />
  <rect x="195" y="60" width="14" height="80" fill="${bands[1]}" />
  <rect x="225" y="60" width="14" height="80" fill="${bands[2]}" />
</svg>
`.trim()

const RESISTOR_COLORS: Record<string, string> = {
  black: '#1a1a1a',
  brown: '#7b3f1d',
  red: '#d1362f',
}

const run = async () => {
  const payload = await getPayload({ config })

  const products = [
    {
      title: '1KΩ Resistor',
      slug: '1k-ohm-resistor-temp',
      priceInPaise: 50,
      bands: [RESISTOR_COLORS.brown, RESISTOR_COLORS.black, RESISTOR_COLORS.red] as [string, string, string],
    },
    {
      title: '100Ω Resistor',
      slug: '100-ohm-resistor-temp',
      priceInPaise: 50,
      bands: [RESISTOR_COLORS.brown, RESISTOR_COLORS.black, RESISTOR_COLORS.brown] as [string, string, string],
    },
  ]

  for (const p of products) {
    const svg = resistorSvg(p.bands)
    const buffer = Buffer.from(svg)

    const media = await payload.create({
      collection: 'media',
      data: { alt: p.title },
      file: {
        data: buffer,
        mimetype: 'image/svg+xml',
        name: `${p.slug}.svg`,
        size: buffer.length,
      },
      overrideAccess: true,
    })

    const product = await payload.create({
      collection: 'products',
      data: {
        title: p.title,
        slug: p.slug,
        _status: 'published',
        priceInINR: p.priceInPaise,
        priceInINREnabled: true,
        inventory: 100,
        weightInGrams: 1,
        gallery: [{ image: media.id }],
        hsnCode: '8533',
      } as any,
      overrideAccess: true,
      context: { disableRevalidate: true },
    })

    payload.logger.info(`Created product "${p.title}" (id ${product.id}) with image (media ${media.id})`)
  }

  payload.logger.info('Done.')
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
