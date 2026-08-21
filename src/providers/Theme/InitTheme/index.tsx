import Script from 'next/script'
import React from 'react'

import { defaultTheme, themeLocalStorageKey } from '../shared'

export const InitTheme: React.FC = () => {
  return (
    <Script
      dangerouslySetInnerHTML={{
        __html: `
  (function () {
    function getImplicitPreference() {
      var mediaQuery = '(prefers-color-scheme: dark)'
      var mql = window.matchMedia(mediaQuery)
      var hasImplicitPreference = typeof mql.matches === 'boolean'

      if (hasImplicitPreference) {
        return mql.matches ? 'dark' : 'light'
      }

      return null
    }

    var validThemes = [
      'light', 'dark', 'high-contrast', 'midnight', 'warm', 'ocean', 'circuit', 'sunset',
      'cupcake', 'bumblebee', 'emerald', 'corporate', 'synthwave', 'retro', 'cyberpunk',
      'valentine', 'halloween', 'garden', 'forest', 'aqua', 'autumn', 'business', 'acid',
      'lemonade', 'night', 'coffee', 'winter', 'dim', 'nord', 'caramellatte', 'abyss', 'silk',
    ]

    function themeIsValid(theme) {
      return validThemes.indexOf(theme) !== -1
    }

    var themeToSet = '${defaultTheme}'
    var preference = window.localStorage.getItem('${themeLocalStorageKey}')

    if (themeIsValid(preference)) {
      themeToSet = preference
    } else {
      var implicitPreference = getImplicitPreference()

      if (implicitPreference) {
        themeToSet = implicitPreference
      }
    }

    document.documentElement.setAttribute('data-theme', themeToSet)
  })();
  `,
      }}
      id="theme-script"
      strategy="beforeInteractive"
    />
  )
}
