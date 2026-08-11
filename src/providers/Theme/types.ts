export type Theme = 'dark' | 'light' | 'high-contrast' | 'midnight' | 'warm'

export interface ThemeContextType {
  setTheme: (theme: Theme | null) => void // eslint-disable-line no-unused-vars
  theme?: Theme | null
}

const VALID_THEMES: Theme[] = ['dark', 'light', 'high-contrast', 'midnight', 'warm']

export function themeIsValid(string: null | string): string is Theme {
  return string ? (VALID_THEMES as string[]).includes(string) : false
}
