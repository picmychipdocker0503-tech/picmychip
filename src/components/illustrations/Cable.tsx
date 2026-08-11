import React from 'react'

export const Cable: React.FC<{ className?: string }> = ({ className }) => (
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
    <rect x="8" y="46" width="20" height="28" rx="4" />
    <rect x="92" y="46" width="20" height="28" rx="4" />
    <path d="M28 60h6c12 0 12-18 24-18s12 36 24 36 12-18 24-18h6" />
  </svg>
)
