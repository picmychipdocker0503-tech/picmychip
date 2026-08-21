'use client'

import type { SiteSetting } from '@/payload-types'

import { AnnouncementTicker } from './AnnouncementTicker'
import { cn } from '@/utilities/cn'
import { CurrencySwitcher } from '@/components/CurrencySwitcher'
import { getSocialIcon } from '@/utilities/getSocialIcon'
import { ensureFeaturebaseBooted } from '@/lib/featurebase'
import { useFeatureFlags } from '@/lib/useFeatureFlags'
import { useFeaturebase } from 'featurebase-js/react'
import { HelpCircleIcon, MailIcon, MessageCircleIcon, PhoneIcon, TruckIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

type Props = {
  announcementBar: SiteSetting['announcementBar']
  socialLinks: NonNullable<SiteSetting['sameAs']>
  supportEmail?: string | null
  supportPhone?: string | null
}

export function TopUtilityBar({ announcementBar, socialLinks, supportEmail, supportPhone }: Props) {
  const t = useTranslations('topbar')
  const { show: showChat } = useFeaturebase()
  const flags = useFeatureFlags()
  const hasAnnouncement = (announcementBar?.messages?.length ?? 0) > 0

  return (
    <div className="hidden border-b border-neutral-800 bg-neutral-950 py-2.5 text-xs tracking-wide text-neutral-50 md:block">
      <div className="container flex items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          {hasAnnouncement && (
            <div className="flex items-center gap-2.5">
              <span className="relative flex size-1.5 shrink-0">
                <span className="bg-success absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                <span className="bg-success relative inline-flex size-1.5 rounded-full" />
              </span>
              <AnnouncementTicker announcementBar={announcementBar} />
            </div>
          )}

          {supportEmail && (
            <a
              className={cn(
                'hidden items-center gap-1.5 text-neutral-400 transition-colors hover:text-white lg:flex',
                hasAnnouncement && 'border-l border-neutral-800 pl-5',
              )}
              href={`mailto:${supportEmail}`}
            >
              <MailIcon className="size-3.5" />
              {supportEmail}
            </a>
          )}

          {supportPhone && (
            <a
              className="flex items-center gap-1.5 text-neutral-400 transition-colors hover:text-white"
              href={`tel:${supportPhone.replace(/\s+/g, '')}`}
            >
              <PhoneIcon className="size-3.5" />
              {supportPhone}
            </a>
          )}
        </div>

        <div className="ml-auto flex items-center gap-5">
          <button
            aria-label="Start chat"
            className="flex items-center gap-1.5 text-neutral-400 transition-colors hover:text-white"
            onClick={() => {
              ensureFeaturebaseBooted()
              showChat()
            }}
            type="button"
          >
            <MessageCircleIcon className="size-3.5" />
            {t('chat')}
          </button>

          <CurrencySwitcher className="select select-ghost select-xs w-auto bg-transparent text-neutral-50" />

          <div className="flex items-center gap-5 border-l border-neutral-800 pl-5">
            <Link
              className="flex items-center gap-1.5 text-neutral-400 transition-colors hover:text-white"
              href="/contact"
            >
              <HelpCircleIcon className="size-3.5" />
              {t('help')}
            </Link>
            {flags.trackOrder && (
              <Link
                className="flex items-center gap-1.5 text-neutral-400 transition-colors hover:text-white"
                href="/find-order"
              >
                <TruckIcon className="size-3.5" />
                {t('trackOrder')}
              </Link>
            )}
          </div>

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
        </div>
      </div>
    </div>
  )
}
