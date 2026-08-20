import type { ContactInfoBlock as ContactInfoBlockProps } from '@/payload-types'

import { MapPinIcon, PhoneIcon } from 'lucide-react'
import React from 'react'

export const ContactInfoBlock: React.FC<
  ContactInfoBlockProps & {
    id?: string | number
  }
> = ({ heading, address, mapQuery, phones }) => {
  const phoneList = (phones || '')
    .split('\n')
    .map((phone) => phone.trim())
    .filter(Boolean)

  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery || address)}&output=embed`

  return (
    <section className="container">
      <div className="border-border bg-card grid gap-8 rounded-3xl border p-8 sm:p-10 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          {heading && <h2 className="text-foreground text-2xl font-bold tracking-tight">{heading}</h2>}

          <div className="flex items-start gap-3">
            <MapPinIcon className="text-primary mt-0.5 size-5 shrink-0" />
            <p className="text-muted-foreground text-sm whitespace-pre-line">{address}</p>
          </div>

          {phoneList.length > 0 && (
            <div className="flex flex-col gap-2">
              {phoneList.map((phone) => (
                <a
                  className="text-foreground hover:text-primary flex items-center gap-3 text-sm font-medium transition-colors"
                  href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                  key={phone}
                >
                  <PhoneIcon className="text-primary size-4 shrink-0" />
                  {phone}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="border-border h-72 w-full overflow-hidden rounded-2xl border lg:h-full">
          <iframe
            className="h-full w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={mapSrc}
            style={{ border: 0 }}
            title={heading || 'Our location'}
          />
        </div>
      </div>
    </section>
  )
}
