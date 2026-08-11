import React from 'react'

export const Toolbox: React.FC<{ className?: string }> = ({ className }) => (
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
    <rect x="14" y="48" width="92" height="52" rx="4" />
    <path d="M44 48v-8a6 6 0 0 1 6-6h20a6 6 0 0 1 6 6v8" />
    <path d="M14 68h92" />
    <rect x="50" y="60" width="20" height="16" rx="2" />
    <circle cx="60" cy="68" r="2" fill="currentColor" stroke="none" />
  </svg>
)
