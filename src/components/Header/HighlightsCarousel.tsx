'use client'

import { HeadphonesIcon, RotateCcwIcon, ShieldCheckIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'

const HIGHLIGHTS = [
  { Icon: HeadphonesIcon, label: 'Human Support' },
  { Icon: ShieldCheckIcon, label: 'Buyer Protection' },
  { Icon: RotateCcwIcon, label: '7-Day Returns' },
] as const

const ROTATE_MS = 2800

/**
 * A small auto-rotating pill next to the account/sign-in links, cycling
 * through the same trust messages the full-width HighlightsBar used to show
 * site-wide — same rotation pattern as AnnouncementTicker (setInterval +
 * remount-on-index-change for the fade/slide transition).
 */
export function HighlightsCarousel() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setIndex((prev) => (prev + 1) % HIGHLIGHTS.length), ROTATE_MS)
    return () => clearInterval(interval)
  }, [])

  const { Icon, label } = HIGHLIGHTS[index]

  return (
    <span className="border-primary/20 bg-primary/10 text-primary inline-flex min-w-[150px] items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold">
      <Icon className="size-3.5 shrink-0" />
      <span className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300" key={index}>
        {label}
      </span>
    </span>
  )
}
