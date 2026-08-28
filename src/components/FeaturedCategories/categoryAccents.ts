// Each category gets its own accent instead of one uniform muted/primary
// tint, so the grid reads as a color-coded parts index at a glance. Shared
// between the desktop grid and MobileFeaturedCategories.
export const CATEGORY_ACCENTS: Record<
  string,
  { icon: string; bg: string; border: string; hoverBg: string; hoverBorder: string }
> = {
  resistor: {
    icon: 'text-amber-600',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/25',
    hoverBg: 'group-hover:bg-amber-500/20',
    hoverBorder: 'group-hover:border-amber-500/50',
  },
  connectors: {
    icon: 'text-slate-600',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/25',
    hoverBg: 'group-hover:bg-slate-500/20',
    hoverBorder: 'group-hover:border-slate-500/50',
  },
  'drone-parts': {
    icon: 'text-sky-600',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/25',
    hoverBg: 'group-hover:bg-sky-500/20',
    hoverBorder: 'group-hover:border-sky-500/50',
  },
  capacitor: {
    icon: 'text-blue-600',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/25',
    hoverBg: 'group-hover:bg-blue-500/20',
    hoverBorder: 'group-hover:border-blue-500/50',
  },
  diode: {
    icon: 'text-red-600',
    bg: 'bg-red-500/10',
    border: 'border-red-500/25',
    hoverBg: 'group-hover:bg-red-500/20',
    hoverBorder: 'group-hover:border-red-500/50',
  },
  'usb-cables': {
    icon: 'text-emerald-600',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/25',
    hoverBg: 'group-hover:bg-emerald-500/20',
    hoverBorder: 'group-hover:border-emerald-500/50',
  },
  inductor: {
    icon: 'text-orange-600',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/25',
    hoverBg: 'group-hover:bg-orange-500/20',
    hoverBorder: 'group-hover:border-orange-500/50',
  },
  ic: {
    icon: 'text-violet-600',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/25',
    hoverBg: 'group-hover:bg-violet-500/20',
    hoverBorder: 'group-hover:border-violet-500/50',
  },
}

export const DEFAULT_ACCENT = {
  icon: 'text-primary',
  bg: 'bg-primary/10',
  border: 'border-primary/25',
  hoverBg: 'group-hover:bg-primary/20',
  hoverBorder: 'group-hover:border-primary/50',
}
