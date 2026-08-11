'use client'

import { useEffect } from 'react'

import { useRecentlyViewed } from '@/providers/RecentlyViewed'

export const TrackRecentlyViewed: React.FC<{ productId: string }> = ({ productId }) => {
  const { track } = useRecentlyViewed()

  useEffect(() => {
    track(productId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  return null
}
