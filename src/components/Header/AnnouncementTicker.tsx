'use client'

import type { SiteSetting } from '@/payload-types'
import { XIcon } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

type Props = {
  announcementBar: SiteSetting['announcementBar']
}

export const AnnouncementTicker: React.FC<Props> = ({ announcementBar }) => {
  const messages = announcementBar?.messages ?? []
  const [index, setIndex] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (messages.length <= 1) return

    const interval = setInterval(
      () => setIndex((prev) => (prev + 1) % messages.length),
      (announcementBar?.rotateSeconds || 5) * 1000,
    )

    return () => clearInterval(interval)
  }, [messages.length, announcementBar?.rotateSeconds])

  if (dismissed || messages.length === 0) return null

  const message = messages[index]

  return (
    <div className="flex items-center gap-2">
      <span className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300" key={index}>
        {message?.link?.url ? (
          <Link className="hover:underline" href={message.link.url}>
            {message.text}
          </Link>
        ) : (
          message?.text
        )}
      </span>
      {announcementBar?.dismissible && (
        <button aria-label="Dismiss announcement" onClick={() => setDismissed(true)} type="button">
          <XIcon className="size-3" />
        </button>
      )}
    </div>
  )
}
