import React from 'react'

export const ShippingBox: React.FC<{ className?: string }> = ({ className }) => (
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
    <path d="M60 12 106 36V84L60 108 14 84V36Z" />
    <path d="M14 36 60 58 106 36" />
    <path d="M60 58v50" />
    <path d="M37 24 83 46" />
  </svg>
)
