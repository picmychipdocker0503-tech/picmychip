import React from 'react'

export const EmptyState: React.FC<{ className?: string }> = ({ className }) => (
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
    <path d="M20 50 60 32l40 18v34L60 102 20 84Z" />
    <path d="M20 50l40 18 40-18M60 68v34" />
    <path d="M40 41l40 18" strokeDasharray="4 4" />
  </svg>
)
