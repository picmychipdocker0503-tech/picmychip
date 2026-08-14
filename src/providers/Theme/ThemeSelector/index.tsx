'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/utilities/cn'
import React, { useState } from 'react'

import type { Theme } from '../types'

import { useTheme } from '..'
import { themeLocalStorageKey } from '../shared'

type ThemeValue = Theme | 'auto'

type ThemeOption = {
  value: ThemeValue
  label: string
  description: string
  swatch: { bg: string; primary: string }
}

// Swatch colors are hardcoded (not read from CSS vars) because the popover
// needs to preview every theme's colors at once, regardless of which theme
// is currently active on the page. Keep these in sync with the matching
// [data-theme='...'] blocks in globals.css.
const THEME_OPTIONS: ThemeOption[] = [
  {
    value: 'auto',
    label: 'Auto',
    description: 'Match system setting',
    swatch: {
      bg: 'linear-gradient(135deg, oklch(100% 0 0deg) 50%, oklch(14.5% 0 0deg) 50%)',
      primary: 'oklch(50% 0.16 155deg)',
    },
  },
  {
    value: 'light',
    label: 'Light',
    description: 'Clean & bright',
    swatch: { bg: 'oklch(98.5% 0 0deg)', primary: 'oklch(40% 0.15 155deg)' },
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Neutral black',
    swatch: { bg: 'oklch(14.5% 0 0deg)', primary: 'oklch(62% 0.16 155deg)' },
  },
  {
    value: 'high-contrast',
    label: 'High Contrast',
    description: 'AAA accessible',
    swatch: { bg: 'oklch(100% 0 0deg)', primary: 'oklch(30% 0.17 155deg)' },
  },
  {
    value: 'midnight',
    label: 'Midnight',
    description: 'Workshop at night',
    swatch: { bg: 'oklch(6% 0 0deg)', primary: 'oklch(58% 0.16 265deg)' },
  },
  {
    value: 'warm',
    label: 'Warm',
    description: 'Cream & tan',
    swatch: { bg: 'oklch(97% 0.015 75deg)', primary: 'oklch(52% 0.18 40deg)' },
  },
  {
    value: 'ocean',
    label: 'Ocean',
    description: 'Deep navy blue',
    swatch: { bg: 'oklch(16% 0.03 250deg)', primary: 'oklch(60% 0.16 235deg)' },
  },
  {
    value: 'circuit',
    label: 'Circuit',
    description: 'PCB green',
    swatch: { bg: 'oklch(97% 0.015 150deg)', primary: 'oklch(50% 0.15 155deg)' },
  },
  {
    value: 'sunset',
    label: 'Sunset',
    description: 'Coral & dusk',
    swatch: { bg: 'oklch(15% 0.03 20deg)', primary: 'oklch(62% 0.2 25deg)' },
  },
  {
    value: 'cupcake',
    label: 'Cupcake',
    description: 'Soft pink frosting',
    swatch: { bg: 'oklch(96% 0.02 350deg)', primary: 'oklch(68% 0.11 195deg)' },
  },
  {
    value: 'bumblebee',
    label: 'Bumblebee',
    description: 'Golden & sweet',
    swatch: { bg: 'oklch(96% 0.02 90deg)', primary: 'oklch(58% 0.17 80deg)' },
  },
  {
    value: 'emerald',
    label: 'Emerald',
    description: 'Cool mint green',
    swatch: { bg: 'oklch(96% 0.02 160deg)', primary: 'oklch(52% 0.15 165deg)' },
  },
  {
    value: 'corporate',
    label: 'Corporate',
    description: 'Crisp steel blue',
    swatch: { bg: 'oklch(96% 0.02 240deg)', primary: 'oklch(48% 0.16 245deg)' },
  },
  {
    value: 'synthwave',
    label: 'Synthwave',
    description: 'Retro neon glow',
    swatch: { bg: 'oklch(15% 0.03 320deg)', primary: 'oklch(65% 0.25 330deg)' },
  },
  {
    value: 'retro',
    label: 'Retro',
    description: 'Vintage olive',
    swatch: { bg: 'oklch(96% 0.02 80deg)', primary: 'oklch(55% 0.15 45deg)' },
  },
  {
    value: 'cyberpunk',
    label: 'Cyberpunk',
    description: 'Electric yellow',
    swatch: { bg: 'oklch(96% 0.02 95deg)', primary: 'oklch(65% 0.24 340deg)' },
  },
  {
    value: 'valentine',
    label: 'Valentine',
    description: 'Rose & blush',
    swatch: { bg: 'oklch(96% 0.02 10deg)', primary: 'oklch(60% 0.2 350deg)' },
  },
  {
    value: 'halloween',
    label: 'Halloween',
    description: 'Pumpkin night',
    swatch: { bg: 'oklch(15% 0.03 45deg)', primary: 'oklch(65% 0.22 50deg)' },
  },
  {
    value: 'garden',
    label: 'Garden',
    description: 'Fresh botanical',
    swatch: { bg: 'oklch(96% 0.02 140deg)', primary: 'oklch(50% 0.15 140deg)' },
  },
  {
    value: 'forest',
    label: 'Forest',
    description: 'Deep woodland',
    swatch: { bg: 'oklch(15% 0.03 150deg)', primary: 'oklch(58% 0.16 150deg)' },
  },
  {
    value: 'aqua',
    label: 'Aqua',
    description: 'Teal deep sea',
    swatch: { bg: 'oklch(15% 0.03 200deg)', primary: 'oklch(68% 0.14 195deg)' },
  },
  {
    value: 'autumn',
    label: 'Autumn',
    description: 'Burnt rust',
    swatch: { bg: 'oklch(96% 0.02 50deg)', primary: 'oklch(48% 0.18 35deg)' },
  },
  {
    value: 'business',
    label: 'Business',
    description: 'Formal navy',
    swatch: { bg: 'oklch(15% 0.03 240deg)', primary: 'oklch(58% 0.11 230deg)' },
  },
  {
    value: 'acid',
    label: 'Acid',
    description: 'Neon lime',
    swatch: { bg: 'oklch(96% 0.02 120deg)', primary: 'oklch(72% 0.24 115deg)' },
  },
  {
    value: 'lemonade',
    label: 'Lemonade',
    description: 'Citrus fresh',
    swatch: { bg: 'oklch(96% 0.02 100deg)', primary: 'oklch(52% 0.15 95deg)' },
  },
  {
    value: 'night',
    label: 'Night',
    description: 'Indigo dusk',
    swatch: { bg: 'oklch(15% 0.03 255deg)', primary: 'oklch(62% 0.2 255deg)' },
  },
  {
    value: 'coffee',
    label: 'Coffee',
    description: 'Roasted brown',
    swatch: { bg: 'oklch(15% 0.03 50deg)', primary: 'oklch(55% 0.12 55deg)' },
  },
  {
    value: 'winter',
    label: 'Winter',
    description: 'Icy pale blue',
    swatch: { bg: 'oklch(96% 0.02 220deg)', primary: 'oklch(50% 0.16 215deg)' },
  },
  {
    value: 'dim',
    label: 'Dim',
    description: 'Muted twilight',
    swatch: { bg: 'oklch(15% 0.03 260deg)', primary: 'oklch(62% 0.16 260deg)' },
  },
  {
    value: 'nord',
    label: 'Nord',
    description: 'Nordic frost',
    swatch: { bg: 'oklch(96% 0.02 225deg)', primary: 'oklch(50% 0.1 225deg)' },
  },
  {
    value: 'caramellatte',
    label: 'Caramellatte',
    description: 'Warm latte',
    swatch: { bg: 'oklch(96% 0.02 70deg)', primary: 'oklch(48% 0.13 60deg)' },
  },
  {
    value: 'abyss',
    label: 'Abyss',
    description: 'Deepest indigo',
    swatch: { bg: 'oklch(15% 0.03 270deg)', primary: 'oklch(58% 0.18 250deg)' },
  },
  {
    value: 'silk',
    label: 'Silk',
    description: 'Ivory smooth',
    swatch: { bg: 'oklch(96% 0.02 55deg)', primary: 'oklch(58% 0.13 50deg)' },
  },
]

const Swatch: React.FC<{ option: ThemeOption; size?: 'sm' | 'md' }> = ({ option, size = 'md' }) => (
  <span
    className={cn(
      'relative inline-flex shrink-0 overflow-hidden rounded-full border border-white/20 shadow-sm ring-1 ring-black/5',
      size === 'sm' ? 'size-5' : 'size-7',
    )}
    style={{ background: option.swatch.bg }}
  >
    <span
      className="absolute bottom-0 right-0 size-[55%] rounded-tl-full"
      style={{ background: option.swatch.primary }}
    />
  </span>
)

export const ThemeSelector: React.FC = () => {
  const { setTheme } = useTheme()
  const [value, setValue] = useState<ThemeValue | ''>('')

  const onThemeChange = (themeToSet: ThemeValue) => {
    if (themeToSet === 'auto') {
      setTheme(null)
      setValue('auto')
    } else {
      setTheme(themeToSet)
      setValue(themeToSet)
    }
  }

  React.useEffect(() => {
    const preference = window.localStorage.getItem(themeLocalStorageKey)
    setValue((preference as ThemeValue | null) ?? 'auto')
  }, [])

  const current = THEME_OPTIONS.find((option) => option.value === value) ?? THEME_OPTIONS[0]

  return (
    <Select onValueChange={onThemeChange} value={value}>
      <SelectTrigger className="border-border bg-background/60 text-foreground hover:bg-background hover:border-primary/40 mb-0 h-auto w-auto gap-2.5 rounded-full py-1.5 pl-2.5 pr-3 backdrop-blur-sm transition-colors">
        <SelectValue placeholder="Theme">
          <Swatch option={current} size="sm" />
          <span className="text-sm font-medium">{current.label}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end" className="w-64 rounded-2xl p-1.5">
        {THEME_OPTIONS.map((option) => (
          <SelectItem className="rounded-xl py-2.5 pl-2.5" key={option.value} value={option.value}>
            <Swatch option={option} />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold leading-none">{option.label}</span>
              <span className="text-muted-foreground text-xs leading-none">{option.description}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
