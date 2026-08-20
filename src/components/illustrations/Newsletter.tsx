import React from 'react'

export const Newsletter: React.FC<{ className?: string }> = ({ className }) => (
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
    <rect x="14" y="30" width="72" height="52" rx="8" />
    <path d="M14 36l36 26 36-26" />
    <path d="M82 14v10M77 19h10M74 12l4 4M92 12l-4 4" />
  </svg>
)
