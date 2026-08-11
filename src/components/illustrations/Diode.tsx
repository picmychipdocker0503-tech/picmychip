import React from 'react'

export const Diode: React.FC<{ className?: string }> = ({ className }) => (
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
    <path d="M6 60h32M82 60h32" />
    <rect x="38" y="42" width="44" height="36" rx="6" />
    <path d="M68 42v36" />
  </svg>
)
