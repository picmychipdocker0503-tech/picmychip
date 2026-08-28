import type { SiteSetting } from '@/payload-types'

import { getServerSideURL } from '@/utilities/getURL'
import { richTextToPlainText } from '@/utilities/richTextToPlainText'

export const buildOrganizationJsonLd = (siteSettings: SiteSetting | null) => {
  const logo = typeof siteSettings?.logo === 'object' ? siteSettings.logo?.url : undefined
  const address = siteSettings?.officeAddress

  const hasAddress = Boolean(
    address?.streetAddress || address?.addressLocality || address?.addressRegion || address?.postalCode,
  )

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteSettings?.organizationName || undefined,
    description: siteSettings?.description || undefined,
    foundingDate: siteSettings?.foundingDate || undefined,
    logo: logo ? `${getServerSideURL()}${logo}` : undefined,
    email: siteSettings?.supportEmail || undefined,
    telephone: siteSettings?.supportPhone || undefined,
    address: hasAddress
      ? {
          '@type': 'PostalAddress',
          streetAddress: address?.streetAddress || undefined,
          addressLocality: address?.addressLocality || undefined,
          addressRegion: address?.addressRegion || undefined,
          postalCode: address?.postalCode || undefined,
          addressCountry: address?.addressCountry || undefined,
        }
      : undefined,
    sameAs: siteSettings?.sameAs?.map((item) => item.url).filter(Boolean),
    url: getServerSideURL(),
  }
}

/** WebSite schema with a Sitelinks SearchBox action — lets Google render a
 * search box directly in this site's search result, pointing at the shop's
 * search query param. */
export const buildWebSiteJsonLd = () => {
  const url = getServerSideURL()

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Picmychip',
    url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/shop?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

type CollectionPageJsonLdArgs = {
  name: string
  description?: string | null
  url: string
  items: { name: string; url: string; imageUrl?: string | null }[]
}

export const buildCollectionPageJsonLd = ({ name, description, url, items }: CollectionPageJsonLdArgs) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name,
  description: description || undefined,
  url,
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: item.url,
      name: item.name,
      image: item.imageUrl || undefined,
    })),
  },
})

export const buildBreadcrumbListJsonLd = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    item: item.url,
    name: item.name,
    position: index + 1,
  })),
})

export const buildFaqPageJsonLd = (items: { question: string; answer: unknown }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((item) => ({
    '@type': 'Question',
    acceptedAnswer: {
      '@type': 'Answer',
      // Answers come from two sources: CMS richText (Lexical JSON) or plain
      // strings (e.g. auto-generated per-product FAQs) — only run the
      // Lexical flattener on the former, or it silently returns ''.
      text: typeof item.answer === 'string' ? item.answer : richTextToPlainText(item.answer),
    },
    name: item.question,
  })),
})

type ArticleJsonLdArgs = {
  authorName?: string | null
  dateModified: string
  datePublished: string
  description?: string | null
  imageUrl?: string | null
  organizationName?: string | null
  title: string
  url: string
}

/**
 * `Article` for content with no named author (technical guides), `BlogPosting`
 * for author-bylined posts — both read the same way by search/answer engines,
 * but the type signals the content genre and `author` is only meaningful
 * when there's a real byline to attach it to.
 */
export const buildArticleJsonLd = ({
  authorName,
  dateModified,
  datePublished,
  description,
  imageUrl,
  organizationName,
  title,
  url,
}: ArticleJsonLdArgs) => ({
  '@context': 'https://schema.org',
  '@type': authorName ? 'BlogPosting' : 'Article',
  author: authorName
    ? { '@type': 'Person', name: authorName }
    : organizationName
      ? { '@type': 'Organization', name: organizationName }
      : undefined,
  dateModified,
  datePublished,
  description: description || undefined,
  headline: title,
  image: imageUrl || undefined,
  mainEntityOfPage: url,
  publisher: organizationName ? { '@type': 'Organization', name: organizationName } : undefined,
  url,
})

type ProductJsonLdArgs = {
  description?: string | null
  hasStock: boolean
  imageUrl?: string | null
  price?: number | null
  lowPrice?: number | null
  highPrice?: number | null
  title: string
  url: string
  averageRating?: number
  reviewCount?: number
  brand?: string | null
  sku?: string | null
  mpn?: string | null
  gtin?: string | null
}

/** Offers valid for 90 days from generation — long enough that Google won't
 * flag it as stale between rebuilds, short enough to force a periodic refresh
 * rather than an offer with no real-world expiry. */
const OFFER_VALID_DAYS = 90

export const buildProductJsonLd = ({
  description,
  hasStock,
  imageUrl,
  price,
  lowPrice,
  highPrice,
  title,
  url,
  averageRating,
  reviewCount,
  brand,
  sku,
  mpn,
  gtin,
}: ProductJsonLdArgs) => ({
  name: title,
  '@context': 'https://schema.org',
  '@type': 'Product',
  description,
  image: imageUrl,
  brand: brand ? { '@type': 'Brand', name: brand } : undefined,
  sku: sku || undefined,
  mpn: mpn || undefined,
  gtin: gtin || undefined,
  offers: {
    ...(typeof lowPrice === 'number' && typeof highPrice === 'number' && lowPrice !== highPrice
      ? { '@type': 'AggregateOffer', lowPrice, highPrice }
      : { '@type': 'Offer', price }),
    availability: hasStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    url,
    priceCurrency: 'INR',
    priceValidUntil: new Date(Date.now() + OFFER_VALID_DAYS * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
  },
  ...(reviewCount && reviewCount > 0
    ? {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: averageRating,
          reviewCount,
        },
      }
    : {}),
  url,
})
