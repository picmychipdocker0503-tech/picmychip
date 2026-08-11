import React from 'react'

export const Warning: React.FC<{ className?: string }> = ({ className }) => (
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
    <path d="M60 16 108 100H12Z" />
    <path d="M60 48v26" />
    <circle cx="60" cy="86" r="2.5" fill="currentColor" stroke="none" />
  </svg>
)
