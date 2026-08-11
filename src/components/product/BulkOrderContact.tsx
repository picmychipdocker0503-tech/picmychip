'use client'

import { useFeaturebase } from 'featurebase-js/react'
import { MailIcon, MessageCircleIcon } from 'lucide-react'
import React from 'react'

type Props = {
  supportEmail?: string | null
}

export const BulkOrderContact: React.FC<Props> = ({ supportEmail }) => {
  const { show } = useFeaturebase()
  const email = supportEmail || 'sales@Picmychip.com'

  return (
    <div className="border-border bg-muted/30 flex flex-col gap-3 rounded-lg border p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="text-muted-foreground">For bulk orders or B2B inquiries:</span>
      <div className="flex flex-wrap items-center gap-4">
        <a className="text-primary inline-flex items-center gap-1.5 font-medium hover:underline" href={`mailto:${email}`}>
          <MailIcon className="size-4" />
          {email}
        </a>
        <button
          className="text-primary inline-flex items-center gap-1.5 font-medium hover:underline"
          onClick={show}
          type="button"
        >
          <MessageCircleIcon className="size-4" />
          Chat with us
        </button>
      </div>
    </div>
  )
}
