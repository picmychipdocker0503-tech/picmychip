import React from 'react'

const PIN_OFFSETS = [-30, -18, -6, 6, 18, 30]

export const Connector: React.FC<{ className?: string }> = ({ className }) => (
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
    <rect x="24" y="46" width="72" height="28" rx="4" />
    {PIN_OFFSETS.map((offset) => (
      <line key={`t-${offset}`} x1={60 + offset} y1="46" x2={60 + offset} y2="28" />
    ))}
    {PIN_OFFSETS.map((offset) => (
      <line key={`b-${offset}`} x1={60 + offset} y1="74" x2={60 + offset} y2="92" />
    ))}
  </svg>
)
