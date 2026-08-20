import { getRequestConfig } from 'next-intl/server'

import en from '../../messages/en.json'

// Locale is fixed to English at the backend rather than resolved per-request
// from a cookie. `next-intl`'s translation-key architecture (`useTranslations`)
// stays in place for the ~18 files that use it for UI-chrome strings (buttons,
// labels, aria-labels — no CMS/page content runs through this), but nothing
// here reads `cookies()`/`headers()` anymore. That matters beyond just this
// file: any dynamic API call in the root layout's request-config forces
// EVERY route in the app out of static rendering, since the layout wraps
// every page. With this resolved statically, that's no longer the case.
export default getRequestConfig(async () => {
  return { locale: 'en', messages: en }
})
