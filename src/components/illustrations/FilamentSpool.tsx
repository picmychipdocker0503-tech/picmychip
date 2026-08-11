import React from 'react'

export const FilamentSpool: React.FC<{ className?: string }> = ({ className }) => (
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
    <ellipse cx="60" cy="26" rx="42" ry="12" />
    <ellipse cx="60" cy="94" rx="42" ry="12" />
    <path d="M18 26v68M102 26v68" />
    <path d="M28 40c16 8 48 8 64 0M26 54c18 9 50 9 68 0M26 68c18 9 50 9 68 0M28 80c16 8 48 8 64 0" />
    <circle cx="60" cy="26" r="6" />
  </svg>
)
