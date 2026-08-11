import React from 'react'

const PIN_OFFSETS = [-24, -12, 0, 12, 24]

export const Chip: React.FC<{ className?: string }> = ({ className }) => (
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
    <rect x="42" y="24" width="36" height="72" rx="4" />
    <circle cx="50" cy="34" r="2.5" fill="currentColor" stroke="none" />
    {PIN_OFFSETS.map((offset) => (
      <line key={`l-${offset}`} x1="42" y1={60 + offset} x2="24" y2={60 + offset} />
    ))}
    {PIN_OFFSETS.map((offset) => (
      <line key={`r-${offset}`} x1="78" y1={60 + offset} x2="96" y2={60 + offset} />
    ))}
  </svg>
)
