import React from 'react'

export const Team: React.FC<{ className?: string }> = ({ className }) => (
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
    <circle cx="46" cy="40" r="16" />
    <path d="M14 102c0-22 14-36 32-36s32 14 32 36" />
    <circle cx="82" cy="46" r="12" />
    <path d="M62 102c0-16 10-27 24-27s24 11 24 27" />
  </svg>
)
