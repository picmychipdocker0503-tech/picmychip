import { getCachedGlobal } from '@/utilities/getGlobals'

import './index.css'
import { HeaderClient } from './index.client'

export async function Header() {
  const header = await getCachedGlobal('header', 1)()
  const siteSettings = await getCachedGlobal('site-settings', 1)()

  return <HeaderClient header={header} siteSettings={siteSettings} />
}
