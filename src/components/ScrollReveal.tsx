'use client'

import { cn } from '@/utilities/cn'
import React, { useEffect, useRef, useState } from 'react'

type Props = {
  children: React.ReactNode
  className?: string
  /** Position within a staggered group (e.g. a card grid) — delays the reveal proportionally. */
  index?: number
  staggerMs?: number
}

/**
 * Fade + slight upward slide on scroll-into-view, via IntersectionObserver —
 * no animation library, reuses the tw-animate-css utilities already used by
 * shadcn's Sheet/Dialog primitives elsewhere in this repo. Kept deliberately
 * subtle/fast: this is a catalog-dense store, not an editorial site.
 */
export const ScrollReveal: React.FC<Props> = ({ children, className, index = 0, staggerMs = 60 }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      className={cn('duration-500', visible ? 'animate-in fade-in-0 slide-in-from-bottom-2' : 'opacity-0', className)}
      ref={ref}
      style={visible ? { animationDelay: `${index * staggerMs}ms`, animationFillMode: 'backwards' } : undefined}
    >
      {children}
    </div>
  )
}
