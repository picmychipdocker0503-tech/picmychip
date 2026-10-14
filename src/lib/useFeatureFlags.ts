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
  compareProducts: true,
  zohoPayments: false,
  bulkPricing: true,
  bulkPricingTiers: [],
  updatedAt: '',
  createdAt: '',
}

// One request per page load, shared by every caller — cart lines each read
// the bulk pricing settings, and shouldn't each refetch the global.
let flagsRequest: Promise<FeatureFlag> | null = null

const loadFlags = () => {
  flagsRequest ??= fetch(`${getClientSideURL()}/api/globals/feature-flags`, { credentials: 'include' })
    .then((res) => res.json())
    .then((data) => ({ ...DEFAULTS, ...data }))
    .catch(() => {
      flagsRequest = null
      return DEFAULTS
    })
  return flagsRequest
}

/** Client-side reader for the `feature-flags` global (publicly readable). */
export const useFeatureFlags = (): FeatureFlag => {
  const [flags, setFlags] = useState<FeatureFlag>(DEFAULTS)

  useEffect(() => {
    let active = true
    loadFlags().then((data) => {
      if (active) setFlags(data)
    })
    return () => {
      active = false
    }
  }, [])

  return flags
}
