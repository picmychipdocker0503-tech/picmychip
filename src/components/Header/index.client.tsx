'use client'

import type { Header, SiteSetting } from 'src/payload-types'

import { MainHeader } from './MainHeader'
import { TopUtilityBar } from './TopUtilityBar'

type Props = {
  header: Header
  siteSettings: SiteSetting
}

export function HeaderClient({ header, siteSettings }: Props) {
  return (
    <>
      <TopUtilityBar
        announcementBar={siteSettings?.announcementBar}
        socialLinks={siteSettings?.sameAs ?? []}
        supportPhone={siteSettings?.supportPhone}
      />
      <MainHeader header={header} />
    </>
  )
}
