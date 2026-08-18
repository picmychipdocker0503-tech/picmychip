'use client'

import { useCallback, useRef } from 'react'

const MAX_TILT_DEG = 8

/**
 * Mouse-tracked 3D tilt (perspective rotateX/rotateY) + a glare highlight
 * that follows the cursor — mutates the DOM directly via refs instead of
 * useState, so a mousemove doesn't trigger a React re-render per pixel.
 * Skips entirely under prefers-reduced-motion, leaving whatever static hover
 * state (e.g. a CSS group-hover scale) the element already has.
 */
export function useTilt3D<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const glareRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useRef(false)

  const onMouseEnter = useCallback(() => {
    reduceMotion.current =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent<T>) => {
    if (reduceMotion.current) return
    const el = ref.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    const rotateY = (px - 0.5) * MAX_TILT_DEG * 2
    const rotateX = (0.5 - py) * MAX_TILT_DEG * 2

    el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`

    if (glareRef.current) {
      glareRef.current.style.background = `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgb(255 255 255 / 0.35), transparent 60%)`
      glareRef.current.style.opacity = '1'
    }
  }, [])

  const onMouseLeave = useCallback(() => {
    const el = ref.current
    if (el) el.style.transform = ''
    if (glareRef.current) glareRef.current.style.opacity = '0'
  }, [])

  return { glareRef, onMouseEnter, onMouseLeave, onMouseMove, ref }
}
