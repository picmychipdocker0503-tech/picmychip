import { getClientSideURL } from '@/utilities/getURL'

type TawkAPI = {
  maximize?: () => void
  hideWidget?: () => void
  showWidget?: () => void
  onLoad?: () => void
  setAttributes?: (attributes: Record<string, string>, callback?: (error?: unknown) => void) => void
  addEvent?: (event: string, metadata?: Record<string, unknown>, callback?: (error?: unknown) => void) => void
  addTags?: (tags: string[], callback?: (error?: unknown) => void) => void
}

declare global {
  interface Window {
    Tawk_API?: TawkAPI
  }
}

/** Opens the Tawk.to widget — the script itself is loaded once, site-wide, in the root layout. */
export function showTawkChat() {
  if (typeof window === 'undefined') return
  window.Tawk_API?.maximize?.()
}

/**
 * Safely runs `fn` once the real Tawk widget has initialized — `maximize`
 * (and the other API methods) only exist after the actual embed script has
 * loaded, not just the stub `Tawk_API` object seeded inline in the root
 * layout's <Script> tag. If it's already loaded, runs immediately; otherwise
 * chains onto Tawk_API.onLoad rather than overwriting it — the root layout
 * already sets its own onLoad (hides the widget bubble on mobile), and
 * clobbering that would silently break it the next time this runs.
 */
export function whenTawkReady(fn: () => void): void {
  if (typeof window === 'undefined') return

  if (typeof window.Tawk_API?.maximize === 'function') {
    fn()
    return
  }

  window.Tawk_API = window.Tawk_API || {}
  const previousOnLoad = window.Tawk_API.onLoad
  window.Tawk_API.onLoad = () => {
    previousOnLoad?.()
    fn()
  }
}

const BUSINESS_HOURS_TIMEZONE = 'Asia/Kolkata'
// Falls back to these if Site Settings > Tawk Chat Business Hours is blank
// or fails to load — same values as the hardcoded defaults before this was
// made admin-editable.
const DEFAULT_BUSINESS_HOURS_START_MINUTES = 9 * 60 // 9:00 AM
const DEFAULT_BUSINESS_HOURS_END_MINUTES = 18 * 60 + 30 // 6:30 PM
// Intl weekday shorthand — Sunday excluded (Mon–Sat only).
const BUSINESS_DAYS = new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])

function parseTimeToMinutes(value: unknown, fallback: number): number {
  if (typeof value !== 'string') return fallback
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim())
  if (!match) return fallback
  return Number(match[1]) * 60 + Number(match[2])
}

type BusinessHoursConfig = { startMinutes: number; endMinutes: number }

// Site Settings' tawkBusinessHours is fetched once and cached for a few
// minutes — isWithinBusinessHours runs on every guest add-to-cart, and
// refetching a rarely-changed admin setting that often would be wasteful.
const BUSINESS_HOURS_CACHE_TTL_MS = 5 * 60 * 1000
let cachedBusinessHours: { config: BusinessHoursConfig; fetchedAt: number } | null = null

async function getBusinessHoursConfig(): Promise<BusinessHoursConfig> {
  if (cachedBusinessHours && Date.now() - cachedBusinessHours.fetchedAt < BUSINESS_HOURS_CACHE_TTL_MS) {
    return cachedBusinessHours.config
  }

  try {
    const res = await fetch(`${getClientSideURL()}/api/globals/site-settings?depth=0`, { credentials: 'include' })
    const data = await res.json()
    const config: BusinessHoursConfig = {
      startMinutes: parseTimeToMinutes(data?.tawkBusinessHours?.startTime, DEFAULT_BUSINESS_HOURS_START_MINUTES),
      endMinutes: parseTimeToMinutes(data?.tawkBusinessHours?.endTime, DEFAULT_BUSINESS_HOURS_END_MINUTES),
    }
    cachedBusinessHours = { config, fetchedAt: Date.now() }
    return config
  } catch {
    return { startMinutes: DEFAULT_BUSINESS_HOURS_START_MINUTES, endMinutes: DEFAULT_BUSINESS_HOURS_END_MINUTES }
  }
}

/**
 * Mon–Sat, per Site Settings > Tawk Chat Business Hours (defaults to
 * 9 AM–6:30 PM if unset) — always evaluated against Asia/Kolkata, regardless
 * of the visitor's own device timezone. Fails closed (returns false) on any
 * error, since a proactive chat pop-open outside business hours (with no one
 * there to answer) is worse than one that doesn't fire when it maybe should.
 */
export async function isWithinBusinessHours(): Promise<boolean> {
  try {
    const { startMinutes, endMinutes } = await getBusinessHoursConfig()

    const now = new Date()
    const weekday = new Intl.DateTimeFormat('en-US', { timeZone: BUSINESS_HOURS_TIMEZONE, weekday: 'short' }).format(
      now,
    )
    if (!BUSINESS_DAYS.has(weekday)) return false

    const [hour, minute] = new Intl.DateTimeFormat('en-US', {
      timeZone: BUSINESS_HOURS_TIMEZONE,
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .reduce<number[]>((parts, part) => {
        if (part.type === 'hour' || part.type === 'minute') parts.push(Number(part.value))
        return parts
      }, [])
    if (Number.isNaN(hour) || Number.isNaN(minute)) return false

    const totalMinutes = hour * 60 + minute
    return totalMinutes >= startMinutes && totalMinutes < endMinutes
  } catch (error) {
    console.error('[tawk]', error)
    return false
  }
}

export type CartSummary = {
  itemCount: number
  totalValue: number
  currency: string
  items: string[]
}

/**
 * Tags a guest visitor in Tawk with their current cart context, so an agent
 * picking up the chat immediately sees what's in their cart without asking.
 */
export function tagGuestWithCart(cart: CartSummary): void {
  try {
    whenTawkReady(() => {
      window.Tawk_API?.setAttributes?.({
        userType: 'Guest',
        cartItemCount: String(cart.itemCount),
        cartValue: `${cart.currency} ${cart.totalValue.toFixed(2)}`,
        cartItems: cart.items.join(', '),
      })
      window.Tawk_API?.addTags?.(['guest', 'has-cart'])
    })
  } catch (error) {
    console.error('[tawk]', error)
  }
}

/**
 * Called after a guest (never a logged-in user — checked by the caller)
 * adds an item to their cart. Always tags/logs the event in Tawk; only pops
 * the widget open during business hours, so a guest browsing at 2 AM isn't
 * greeted by a chat window nobody's there to answer.
 */
export function notifyOnAddToCart(cart: CartSummary): void {
  tagGuestWithCart(cart)

  try {
    whenTawkReady(() => {
      window.Tawk_API?.addEvent?.('product-add-to-cart', {
        itemCount: cart.itemCount,
        cartValue: `${cart.currency} ${cart.totalValue.toFixed(2)}`,
        items: cart.items.join(', '),
      })
    })
  } catch (error) {
    console.error('[tawk]', error)
  }

  isWithinBusinessHours()
    .then((withinHours) => {
      if (!withinHours) return
      whenTawkReady(() => {
        window.Tawk_API?.maximize?.()
      })
    })
    .catch((error) => {
      console.error('[tawk]', error)
    })
}

export {}
