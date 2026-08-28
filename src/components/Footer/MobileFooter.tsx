import type { Footer, SiteSetting } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { CustomerSupport } from '@/components/Footer/CustomerSupport'
import { FooterMenu } from '@/components/Footer/menu'
import { NewsletterForm } from '@/components/Footer/NewsletterForm'
import { PaymentBadges } from '@/components/Footer/PaymentBadges'
import { ShipToPills } from '@/components/Footer/ShipToPills'
import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { getFooterColumnIcon } from '@/utilities/getFooterColumnIcon'
import { getNavLinkIcon } from '@/utilities/getNavLinkIcon'
import { getSocialIcon } from '@/utilities/getSocialIcon'
import { ChevronDownIcon, Headset } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

type Props = {
  copyrightName: string
  footer: Footer
  menu: Footer['navItems']
  siteSettings: SiteSetting | null
  socialLinks: NonNullable<SiteSetting['sameAs']>
}

/**
 * The storefront's mobile footer — same CMS data as the desktop footer
 * (passed down as props, not re-fetched), composed for a phone screen
 * instead of squeezed into desktop's multi-column grid: a slimmer newsletter
 * row, and link columns collapsed into native `<details>` accordions instead
 * of always-expanded columns, so the footer doesn't become a long wall of
 * links to scroll past.
 */
export function MobileFooter({ copyrightName, footer, menu, siteSettings, socialLinks }: Props) {
  const columns = footer.columns ?? []

  return (
    <div className="md:hidden">
      {/* Newsletter — slim row, not the full glass-card treatment desktop gets */}
      <div className="container pt-10">
        <div className="border-border bg-card rounded-2xl border p-5">
          <span className="eyebrow">Newsletter</span>
          <h2 className="text-foreground mt-1.5 mb-3 text-lg font-semibold tracking-tight">
            {footer.newsletterHeading || "Don't Miss Out Latest Trends & Offers"}
          </h2>
          <NewsletterForm />
        </div>
      </div>

      {/* Brand */}
      <div className="container mt-8 flex flex-col gap-4">
        <Link className="flex items-center" href="/">
          <Image alt={process.env.SITE_NAME || 'Picmychip'} className="h-8 w-auto" height={155} src="/pmc-logo.png" width={430} />
        </Link>
        {siteSettings?.description && <p className="text-muted-foreground text-sm">{siteSettings.description}</p>}
        <ShipToPills />
      </div>

      {/* Link columns as accordions — falls back to a flat menu list when
          this footer isn't using the icon-grouped columns structure. */}
      {columns.length === 0 && (menu?.length ?? 0) > 0 && (
        <div className="border-border container mt-8 border-t pt-6">
          <FooterMenu menu={menu} />
        </div>
      )}
      {columns.length > 0 && (
        <div className="border-border container mt-8 divide-y divide-border border-t">
          {columns.map((column, index) => {
            const Icon = getFooterColumnIcon(column.title ?? '')

            return (
              <details className="group py-4" key={column.id ?? index}>
                <summary className="text-foreground flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
                  <span className="flex items-center gap-2">
                    <Icon className="text-muted-foreground size-4" />
                    {column.title}
                  </span>
                  <ChevronDownIcon className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <ul className="mt-3 flex flex-col gap-3 pl-6">
                  {(column.links ?? []).map((item, linkIndex) => {
                    const label = item.link?.label ?? ''
                    const LinkIcon = getNavLinkIcon(label)

                    return (
                      <li key={item.id ?? linkIndex}>
                        <CMSLink
                          appearance="link"
                          className="text-muted-foreground inline-flex items-center gap-2 text-sm"
                          {...item.link}
                          label={undefined}
                        >
                          <LinkIcon className="text-primary/60 size-3.5 shrink-0" />
                          <span>{label}</span>
                        </CMSLink>
                      </li>
                    )
                  })}
                </ul>
              </details>
            )
          })}
        </div>
      )}

      {/* Support */}
      <div className="border-border container mt-2 border-t py-6">
        <h3 className="text-muted-foreground mb-4 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
          <Headset className="size-3.5" />
          Customer Support
        </h3>
        <CustomerSupport supportEmail={siteSettings?.supportEmail} supportPhone={siteSettings?.supportPhone} />
      </div>

      {socialLinks.length > 0 && (
        <div className="container flex items-center gap-3 pb-6">
          {socialLinks.map((social, index) => {
            const Icon = getSocialIcon(social.url)
            if (!Icon) return null
            return (
              <a
                aria-label="Social link"
                className="border-border text-muted-foreground flex size-9 items-center justify-center rounded-full border"
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

      {/* Bottom bar */}
      <div className="border-border container flex flex-col items-center gap-4 border-t py-6 text-center text-xs">
        <PaymentBadges />
        <ThemeSelector />
        <p className="text-muted-foreground tracking-wide">&copy; {copyrightName || 'Picmychip™'}, all rights reserved.</p>
        <p className="text-muted-foreground tracking-wide">CIN : U47912KA2024PTC189267</p>
      </div>
    </div>
  )
}
