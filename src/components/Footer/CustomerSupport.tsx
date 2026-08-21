'use client'

import { useFeaturebase } from 'featurebase-js/react'
import { ensureFeaturebaseBooted } from '@/lib/featurebase'
import { HeadphonesIcon, MailIcon, PhoneIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import React from 'react'

type Props = {
  supportEmail?: string | null
  supportPhone?: string | null
}

export const CustomerSupport: React.FC<Props> = ({ supportEmail, supportPhone }) => {
  const { show } = useFeaturebase()
  const t = useTranslations('footer.customerSupport')
  const email = supportEmail || 'sales@Picmychip.com'

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <HeadphonesIcon className="text-muted-foreground mt-0.5 size-5 shrink-0" />
        <div>
          <div className="text-foreground font-semibold">{t('askSpecialist')}</div>
          <div className="text-muted-foreground text-sm">{t('hereToHelp')}</div>
          <button
            className="text-primary text-sm font-semibold hover:underline"
            onClick={() => {
              ensureFeaturebaseBooted()
              show()
            }}
            type="button"
          >
            {t('startChat')}
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <MailIcon className="text-muted-foreground mt-0.5 size-5 shrink-0" />
        <div>
          <div className="text-foreground font-semibold">{t('emailUs')}</div>
          <div className="text-muted-foreground text-sm">{t('getBackSoon')}</div>
          <a className="text-primary text-sm font-semibold hover:underline" href={`mailto:${email}`}>
            {email}
          </a>
        </div>
      </div>

      {supportPhone && (
        <div className="flex items-start gap-3">
          <PhoneIcon className="text-muted-foreground mt-0.5 size-5 shrink-0" />
          <div>
            <div className="text-foreground font-semibold">{t('callUs')}</div>
            <div className="text-muted-foreground text-sm">{t('speakWithTeam')}</div>
            <a
              className="text-primary text-sm font-semibold hover:underline"
              href={`tel:${supportPhone.replace(/\s+/g, '')}`}
            >
              {supportPhone}
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
