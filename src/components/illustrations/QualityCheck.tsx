import React from 'react'

export const QualityCheck: React.FC<{ className?: string }> = ({ className }) => (
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
    <rect x="32" y="20" width="56" height="82" rx="6" />
    <rect x="46" y="14" width="28" height="12" rx="3" />
    <path d="M45 60 55 70 76 46" />
  </svg>
)
