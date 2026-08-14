import type { Metadata } from 'next'

import { getServerSideURL } from './getURL'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description: 'Genuine electronic components, sourced and shipped fast.',
  images: [
    {
      url: `${getServerSideURL()}/icons/icon-512.png`,
    },
  ],
  siteName: 'Picmychip',
  title: 'Picmychip',
}

export const mergeOpenGraph = (og?: Partial<Metadata['openGraph']>): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
