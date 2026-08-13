import type { Footer, SiteSetting } from '@/payload-types'

import { CustomerSupport } from '@/components/Footer/CustomerSupport'
import { FooterColumns } from '@/components/Footer/FooterColumns'
import { FooterMenu } from '@/components/Footer/menu'
import { NewsletterForm } from '@/components/Footer/NewsletterForm'
import { PaymentBadges } from '@/components/Footer/PaymentBadges'
import { ShipToPills } from '@/components/Footer/ShipToPills'
import { Wordmark } from '@/components/icons/Wordmark'
import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { getSocialIcon } from '@/utilities/getSocialIcon'
import { Headset } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

const { COMPANY_NAME, SITE_NAME } = process.env

export async function Footer() {
  const footer: Footer = await getCachedGlobal('footer', 1)()
  const siteSettings: SiteSetting = await getCachedGlobal('site-settings', 1)()
  const menu = footer.navItems || []
  const socialLinks = siteSettings?.sameAs ?? []

  const copyrightName = COMPANY_NAME || SITE_NAME || ''

  return (
    <footer className="bg-muted text-muted-foreground text-sm">
      {/* Newsletter */}
      <div className="container pt-16">
        <div className="border-border bg-card relative overflow-hidden rounded-2xl border px-8 py-10 sm:px-12">
          <div className="bg-primary/20 pointer-events-none absolute top-1/2 right-0 size-64 -translate-y-1/2 translate-x-1/3 rounded-full blur-3xl" />
          <div className="relative flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
            <div>
              <span className="eyebrow">Newsletter</span>
              <h2 className="text-foreground mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                {footer.newsletterHeading || "Don't Miss Out Latest Trends & Offers"}
              </h2>
              {footer.newsletterCopy && <p className="text-muted-foreground mt-2">{footer.newsletterCopy}</p>}
            </div>
            <NewsletterForm />
          </div>
        </div>
      </div>

      {/* Brand */}
      <div className="container pt-16">
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Link className="flex items-center" href="/">
                <Wordmark
                  className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl"
                  iconClassName="text-primary"
                  iconSize={34}
                  name={SITE_NAME || 'Picmychip'}
                />
              </Link>
              <p className="text-primary text-sm font-medium sm:text-base">
                Everything for your next build.
              </p>
            </div>
            {siteSettings?.description && (
              <p className="text-muted-foreground max-w-sm">{siteSettings.description}</p>
            )}

            <ShipToPills />
          </div>

          {socialLinks.length > 0 && (
            <div className="flex items-center gap-3">
              {socialLinks.map((social, index) => {
                const Icon = getSocialIcon(social.url)
                if (!Icon) return null
                return (
                  <a
                    aria-label="Social link"
                    className="border-border text-muted-foreground hover:border-primary/40 hover:text-foreground flex size-9 items-center justify-center rounded-full border transition-colors"
                    href={social.url}
                    key={index}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <Icon className="size-4" />
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Link columns + support */}
      <div className="border-border container mt-16 border-t pt-12">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">
          <FooterColumns columns={footer.columns} />

          {!footer.columns?.length && (
            <Suspense
              fallback={
                <div className="flex h-[188px] w-[200px] flex-col gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div className="bg-border h-6 w-full animate-pulse rounded" key={i} />
                  ))}
                </div>
              }
            >
              <FooterMenu menu={menu} />
            </Suspense>
          )}

          <div className="border-border shrink-0 lg:w-72 lg:border-l lg:pl-16">
            <h3 className="text-muted-foreground mb-5 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
              <Headset className="size-3.5" />
              Customer Support
            </h3>
            <CustomerSupport supportEmail={siteSettings?.supportEmail} supportPhone={siteSettings?.supportPhone} />
          </div>
        </div>
      </div>

      <div className="border-border mt-12 border-t py-8 text-sm">
        <div className="container mx-auto flex w-full flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex flex-col items-center gap-3 md:items-start">
            <PaymentBadges />
            <p className="text-muted-foreground text-center text-xs tracking-wide md:text-left">
              &copy; {copyrightName || 'Picmychip™'}, all rights reserved.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 md:items-end">
            <ThemeSelector />
            <div className="text-muted-foreground flex flex-col items-center gap-1 text-center text-xs tracking-wide md:items-end md:text-right">
              <p>Secure payments via PayU</p>
              <p>CIN : U47912KA2024PTC189267</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
