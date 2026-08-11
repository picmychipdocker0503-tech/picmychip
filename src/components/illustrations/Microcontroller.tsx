import React from 'react'

const PIN_OFFSETS = [-30, -18, -6, 6, 18, 30]

export const Microcontroller: React.FC<{ className?: string }> = ({ className }) => (
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
    <rect x="36" y="36" width="48" height="48" rx="3" />
    <circle cx="44" cy="44" r="2.5" fill="currentColor" stroke="none" />
    {PIN_OFFSETS.map((offset) => (
      <line key={`t-${offset}`} x1={60 + offset} y1="36" x2={60 + offset} y2="24" />
    ))}
    {PIN_OFFSETS.map((offset) => (
      <line key={`b-${offset}`} x1={60 + offset} y1="84" x2={60 + offset} y2="96" />
    ))}
    {PIN_OFFSETS.map((offset) => (
      <line key={`l-${offset}`} x1="36" y1={60 + offset} x2="24" y2={60 + offset} />
    ))}
    {PIN_OFFSETS.map((offset) => (
      <line key={`r-${offset}`} x1="84" y1={60 + offset} x2="96" y2={60 + offset} />
    ))}
  </svg>
)
