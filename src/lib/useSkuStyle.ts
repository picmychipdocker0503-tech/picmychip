'use client'

import { getClientSideURL } from '@/utilities/getURL'
import { useEffect, useState } from 'react'

export type SkuStyle = {
  show: boolean
  textColor: string
}

const DEFAULTS: SkuStyle = {
  show: false,
  textColor: '#4169e1',
}

/**
 * Client-side reader for SiteSettings.skuStyle (the site-settings global is
 * publicly readable) — one shared source of truth for the SKU text color
 * everywhere it's shown (product detail page, category listings, shop),
 * instead of each surface hardcoding its own.
 */
export const useSkuStyle = (): SkuStyle => {
  const [style, setStyle] = useState<SkuStyle>(DEFAULTS)

  useEffect(() => {
    fetch(`${getClientSideURL()}/api/globals/site-settings`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) =>
        setStyle({
          show: data?.skuStyle?.show ?? DEFAULTS.show,
          textColor: data?.skuStyle?.textColor || DEFAULTS.textColor,
        }),
      )
      .catch(() => {})
  }, [])

  return style
}
