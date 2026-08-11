import type { Footer, SiteSetting } from '@/payload-types'

import { CustomerSupport } from '@/components/Footer/CustomerSupport'
import { FooterColumns } from '@/components/Footer/FooterColumns'
import { FooterMenu } from '@/components/Footer/menu'
import { NewsletterForm } from '@/components/Footer/NewsletterForm'
import { PaymentBadges } from '@/components/Footer/PaymentBadges'
import { ShipToPills } from '@/components/Footer/ShipToPills'
import { LogoIcon } from '@/components/icons/logo'
import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { getSocialIcon } from '@/utilities/getSocialIcon'
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
    <footer className="bg-neutral-950 text-sm text-neutral-400">
      {/* Newsletter */}
      <div className="container pt-16">
        <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 px-8 py-10 sm:px-12">
          <div className="bg-primary/20 pointer-events-none absolute top-1/2 right-0 size-64 -translate-y-1/2 translate-x-1/3 rounded-full blur-3xl" />
          <div className="relative flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
            <div>
              <span className="eyebrow">Newsletter</span>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {footer.newsletterHeading || "Don't Miss Out Latest Trends & Offers"}
              </h2>
              {footer.newsletterCopy && <p className="mt-2 text-neutral-400">{footer.newsletterCopy}</p>}
            </div>
            <NewsletterForm />
          </div>
        </div>
      </div>

      {/* Brand */}
      <div className="container pt-16">
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <div className="flex flex-col gap-4">
            <Link className="flex items-center gap-3" href="/">
              <LogoIcon className="text-primary w-9" />
              <span className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {SITE_NAME || 'Picmychip'}
              </span>
            </Link>
            <p className="text-primary text-base font-medium sm:text-lg">Everything for your next build.</p>
            {siteSettings?.description && <p className="max-w-sm text-neutral-400">{siteSettings.description}</p>}

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
                    className="flex size-9 items-center justify-center rounded-full border border-neutral-800 text-neutral-400 transition-colors hover:border-neutral-600 hover:text-white"
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
      <div className="container mt-16 border-t border-neutral-800 pt-12">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">
          <FooterColumns columns={footer.columns} />

          {!footer.columns?.length && (
            <Suspense
              fallback={
                <div className="flex h-[188px] w-[200px] flex-col gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div className="h-6 w-full animate-pulse rounded bg-neutral-800" key={i} />
                  ))}
                </div>
              }
            >
              <FooterMenu menu={menu} />
            </Suspense>
          )}

          <div className="shrink-0 border-neutral-800 lg:w-72 lg:border-l lg:pl-16">
            <h3 className="mb-5 text-xs font-semibold tracking-wider text-neutral-500 uppercase">Customer Support</h3>
            <CustomerSupport supportEmail={siteSettings?.supportEmail} supportPhone={siteSettings?.supportPhone} />
          </div>
        </div>
      </div>

      <div className="mt-12 border-t border-neutral-800 py-8 text-sm">
        <div className="container mx-auto flex w-full flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex flex-col items-center gap-3 md:items-start">
            <PaymentBadges />
            <p className="text-center text-xs tracking-wide text-neutral-500 md:text-left">
              &copy; {copyrightName || 'Picmychip™'}, all rights reserved.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 md:items-end">
            <div className="text-neutral-300">
              <ThemeSelector />
            </div>
            <div className="flex flex-col items-center gap-1 text-center text-xs tracking-wide text-neutral-500 md:items-end md:text-right">
              <p>Secure payments via PayU</p>
              <p>CIN : U47912KA2024PTC189267</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
