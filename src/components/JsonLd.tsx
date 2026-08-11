import React from 'react'

type Props = {
  data: object
}

export const JsonLd: React.FC<Props> = ({ data }) => (
  <script dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} type="application/ld+json" />
)
