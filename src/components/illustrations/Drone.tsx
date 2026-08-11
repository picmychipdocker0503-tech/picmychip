import React from 'react'

export const Drone: React.FC<{ className?: string }> = ({ className }) => (
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
    <rect x="46" y="50" width="28" height="20" rx="4" />
    <path d="M46 54 22 30M74 54l24-24M46 66 22 90M74 66l24 24" />
    <circle cx="18" cy="26" r="14" />
    <circle cx="102" cy="26" r="14" />
    <circle cx="18" cy="94" r="14" />
    <circle cx="102" cy="94" r="14" />
    <path d="M60 50v-8M56 42h8" />
  </svg>
)
