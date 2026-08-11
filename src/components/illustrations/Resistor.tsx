import React from 'react'

export const Resistor: React.FC<{ className?: string }> = ({ className }) => (
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
    <path d="M6 60h26M88 60h26" />
    <rect x="32" y="44" width="56" height="32" rx="8" />
    <path d="M46 44v32M58 44v32M70 44v32" />
  </svg>
)
