export type Theme =
  | 'dark'
  | 'light'
  | 'high-contrast'
  | 'midnight'
  | 'warm'
  | 'ocean'
  | 'circuit'
  | 'sunset'
  | 'cupcake'
  | 'bumblebee'
  | 'emerald'
  | 'corporate'
  | 'synthwave'
  | 'retro'
  | 'cyberpunk'
  | 'valentine'
  | 'halloween'
  | 'garden'
  | 'forest'
  | 'aqua'
  | 'autumn'
  | 'business'
  | 'acid'
  | 'lemonade'
  | 'night'
  | 'coffee'
  | 'winter'
  | 'dim'
  | 'nord'
  | 'caramellatte'
  | 'abyss'
  | 'silk'

export interface ThemeContextType {
  setTheme: (theme: Theme | null) => void // eslint-disable-line no-unused-vars
  theme?: Theme | null
}

const VALID_THEMES: Theme[] = [
  'dark',
  'light',
  'high-contrast',
  'midnight',
  'warm',
  'ocean',
  'circuit',
  'sunset',
  'cupcake',
  'bumblebee',
  'emerald',
  'corporate',
  'synthwave',
  'retro',
  'cyberpunk',
  'valentine',
  'halloween',
  'garden',
  'forest',
  'aqua',
  'autumn',
  'business',
  'acid',
  'lemonade',
  'night',
  'coffee',
  'winter',
  'dim',
  'nord',
  'caramellatte',
  'abyss',
  'silk',
]

export function themeIsValid(string: null | string): string is Theme {
  return string ? (VALID_THEMES as string[]).includes(string) : false
}
