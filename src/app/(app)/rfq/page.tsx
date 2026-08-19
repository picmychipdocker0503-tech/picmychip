import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { RfqPageClient } from '@/components/rfq/RfqPageClient'

export default function RfqPage() {
  return <RfqPageClient />
}

export const metadata: Metadata = {
  description: 'Upload a BOM or submit a multi-line RFQ and get pricing, availability, and lead times from our sourcing team.',
  openGraph: mergeOpenGraph({
    title: 'RFQ & BOM Sourcing',
    url: '/rfq',
  }),
  title: 'RFQ & BOM Sourcing',
}
