import React from 'react'

const TEETH = 8

export const Gear: React.FC<{ className?: string }> = ({ className }) => {
  const teeth = Array.from({ length: TEETH }, (_, i) => {
    const angle = (i / TEETH) * 2 * Math.PI
    const x1 = 60 + Math.cos(angle) * 34
    const y1 = 60 + Math.sin(angle) * 34
    const x2 = 60 + Math.cos(angle) * 46
    const y2 = 60 + Math.sin(angle) * 46
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
  })

  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {teeth}
      <circle cx="60" cy="60" r="34" />
      <circle cx="60" cy="60" r="12" />
    </svg>
  )
}
