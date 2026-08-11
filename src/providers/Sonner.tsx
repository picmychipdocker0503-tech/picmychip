'use client'

import { useTheme } from '@/providers/Theme'
import { Toaster } from 'sonner'

// Sonner only knows light/dark for its own chrome — our extra themes
// (high-contrast, warm are light-family; midnight is dark-family) map down
// to whichever one they're visually closest to.
const DARK_FAMILY_THEMES = new Set(['dark', 'midnight'])

export const SonnerProvider = ({ children }: { children?: React.ReactNode }) => {
  const { theme } = useTheme()

  return (
    <>
      {children}

      <Toaster
        richColors
        position="bottom-left"
        theme={theme && DARK_FAMILY_THEMES.has(theme) ? 'dark' : 'light'}
      />
    </>
  )
}
