'use client'

import type { SiteSetting } from '@/payload-types'

import { AdminBar } from '@/components/AdminBar'
import { AnnouncementTicker } from './AnnouncementTicker'
import { cn } from '@/utilities/cn'
import { CurrencySwitcher } from '@/components/CurrencySwitcher'
import { getSocialIcon } from '@/utilities/getSocialIcon'
import { PhoneIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

type Props = {
  announcementBar: SiteSetting['announcementBar']
  socialLinks: NonNullable<SiteSetting['sameAs']>
  supportPhone?: string | null
}

export function TopUtilityBar({ announcementBar, socialLinks, supportPhone }: Props) {
  const [showAdminBar, setShowAdminBar] = useState(false)

  return (
    <div className="hidden border-b border-neutral-800 bg-neutral-950 py-2.5 text-xs tracking-wide text-neutral-50 md:block">
      <div className="container flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          {(announcementBar?.messages?.length ?? 0) > 0 && (
            <span className="relative flex size-1.5 shrink-0">
              <span className="bg-success absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
              <span className="bg-success relative inline-flex size-1.5 rounded-full" />
            </span>
          )}
          <AnnouncementTicker announcementBar={announcementBar} />
        </div>

        <div className="ml-auto flex items-center gap-5">
          {supportPhone && (
            <a
              className="flex items-center gap-1.5 text-neutral-400 transition-colors hover:text-white"
              href={`tel:${supportPhone.replace(/\s+/g, '')}`}
            >
              <PhoneIcon className="size-3.5" />
              {supportPhone}
            </a>
          )}

          {socialLinks.length > 0 && (
            <div className="flex items-center gap-3 border-l border-neutral-800 pl-5">
              {socialLinks.map((social, index) => {
                const Icon = getSocialIcon(social.url)
                if (!Icon) return null
                return (
                  <a
                    aria-label="Social link"
                    className="text-neutral-400 transition-colors hover:text-white"
                    href={social.url}
                    key={index}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <Icon className="size-3.5" />
                  </a>
                )
              })}
            </div>
          )}

          <CurrencySwitcher className="select select-ghost select-xs w-auto bg-transparent text-neutral-50" />

          <div className="flex items-center gap-5 border-l border-neutral-800 pl-5">
            <Link className="text-neutral-400 transition-colors hover:text-white" href="/contact">
              Help
            </Link>
            <Link className="text-neutral-400 transition-colors hover:text-white" href="/find-order">
              Track order
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
