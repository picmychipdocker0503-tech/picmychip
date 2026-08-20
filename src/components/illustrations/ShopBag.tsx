import React from 'react'

export const ShopBag: React.FC<{ className?: string }> = ({ className }) => (
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
    <path d="M28 42h64l-4 54a6 6 0 0 1-6 6H38a6 6 0 0 1-6-6Z" />
    <path d="M42 42v-8a18 18 0 0 1 36 0v8" />
    <rect x="50" y="60" width="20" height="14" rx="2" />
    <path d="M54 60v-4M66 60v-4M54 78v4M66 78v4" />
  </svg>
)
