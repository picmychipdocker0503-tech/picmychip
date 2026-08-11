import React from 'react'

export const Inductor: React.FC<{ className?: string }> = ({ className }) => (
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
    <path d="M6 60h14" />
    <path d="M20 60q10 -24 20 0t20 0t20 0t20 0" />
    <path d="M100 60h14" />
  </svg>
)
