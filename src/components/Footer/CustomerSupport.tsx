'use client'

import { useFeaturebase } from 'featurebase-js/react'
import { HeadphonesIcon, MailIcon, PhoneIcon } from 'lucide-react'
import React from 'react'

type Props = {
  supportEmail?: string | null
  supportPhone?: string | null
}

export const CustomerSupport: React.FC<Props> = ({ supportEmail, supportPhone }) => {
  const { show } = useFeaturebase()
  const email = supportEmail || 'sales@Picmychip.com'

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <HeadphonesIcon className="text-muted-foreground mt-0.5 size-5 shrink-0" />
        <div>
          <div className="text-foreground font-semibold">Ask a specialist</div>
          <div className="text-muted-foreground text-sm">We're here to help</div>
          <button className="text-primary text-sm font-semibold hover:underline" onClick={show} type="button">
            Start chat
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <MailIcon className="text-muted-foreground mt-0.5 size-5 shrink-0" />
        <div>
          <div className="text-foreground font-semibold">Email us</div>
          <div className="text-muted-foreground text-sm">We'll get back to you soon</div>
          <a className="text-primary text-sm font-semibold hover:underline" href={`mailto:${email}`}>
            {email}
          </a>
        </div>
      </div>

      {supportPhone && (
        <div className="flex items-start gap-3">
          <PhoneIcon className="text-muted-foreground mt-0.5 size-5 shrink-0" />
          <div>
            <div className="text-foreground font-semibold">Call us</div>
            <div className="text-muted-foreground text-sm">Speak with our team</div>
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
