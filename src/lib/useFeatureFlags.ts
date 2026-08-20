'use client'

import type { FeatureFlag } from '@/payload-types'

import { getClientSideURL } from '@/utilities/getURL'
import { useEffect, useState } from 'react'

const DEFAULTS: FeatureFlag = {
  id: 0,
  cashOnDelivery: true,
  giftCards: true,
  coupons: true,
  backInStockAlerts: true,
  recentlyViewed: true,
  searchAutocomplete: true,
  trackOrder: true,
  trustedByBrands: true,
  rewardsProgram: false,
  freeShippingBanner: false,
  updatedAt: '',
  createdAt: '',
}

/** Client-side reader for the `feature-flags` global (publicly readable). */
export const useFeatureFlags = (): FeatureFlag => {
  const [flags, setFlags] = useState<FeatureFlag>(DEFAULTS)

  useEffect(() => {
    fetch(`${getClientSideURL()}/api/globals/feature-flags`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setFlags({ ...DEFAULTS, ...data }))
      .catch(() => {})
  }, [])

  return flags
}
