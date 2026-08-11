'use client'

import { cn } from '@/utilities/cn'
import React, { useEffect, useState } from 'react'

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number }

const getTimeLeft = (endDate: string): TimeLeft | null => {
  const diff = new Date(endDate).getTime() - Date.now()
  if (diff <= 0) return null

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

type Props = {
  endDate: string
  className?: string
  /** Called once the countdown reaches zero, so the parent can hide the whole strip. */
  onExpire?: () => void
}

/**
 * Renders null both before mount (avoids an SSR/client hydration mismatch on
 * a value that ticks every second) and once `endDate` has passed — the
 * parent block should wrap its urgency chrome around this, not the reverse.
 */
export const CountdownTimer: React.FC<Props> = ({ endDate, className, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)

  useEffect(() => {
    setTimeLeft(getTimeLeft(endDate))

    const interval = setInterval(() => {
      const next = getTimeLeft(endDate)
      setTimeLeft(next)
      if (!next) {
        clearInterval(interval)
        onExpire?.()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [endDate, onExpire])

  if (!timeLeft) return null

  const units: { label: string; value: number; pulse?: boolean }[] = [
    { label: 'd', value: timeLeft.days },
    { label: 'h', value: timeLeft.hours },
    { label: 'm', value: timeLeft.minutes },
    { label: 's', value: timeLeft.seconds, pulse: true },
  ]

  return (
    <div className={cn('flex items-center gap-3 font-mono', className)}>
      {units.map((unit) => (
        <span className="flex items-baseline gap-1" key={unit.label}>
          <span className={cn('text-lg font-bold tabular-nums', unit.pulse && 'animate-pulse')}>
            {String(unit.value).padStart(2, '0')}
          </span>
          <span className="text-muted-foreground text-xs">{unit.label}</span>
        </span>
      ))}
    </div>
  )
}
