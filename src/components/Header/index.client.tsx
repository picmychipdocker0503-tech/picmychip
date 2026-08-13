'use client'

import type { Header, SiteSetting } from 'src/payload-types'

import type { CategoryMenuGroup } from '@/utilities/categoryMenuGroups'

import { MainHeader } from './MainHeader'
import { TopUtilityBar } from './TopUtilityBar'

type Props = {
  header: Header
  shopCategoryGroups: CategoryMenuGroup[]
  siteSettings: SiteSetting
}

export function HeaderClient({ header, shopCategoryGroups, siteSettings }: Props) {
  return (
    <>
      <TopUtilityBar
        announcementBar={siteSettings?.announcementBar}
        socialLinks={siteSettings?.sameAs ?? []}
        supportEmail={siteSettings?.supportEmail}
        supportPhone={siteSettings?.supportPhone}
      />
      <MainHeader header={header} shopCategoryGroups={shopCategoryGroups} />
    </>
  )
}
