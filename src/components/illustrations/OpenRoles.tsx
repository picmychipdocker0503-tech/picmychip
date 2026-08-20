import React from 'react'

export const OpenRoles: React.FC<{ className?: string }> = ({ className }) => (
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
    <path d="M46 36v-8a6 6 0 0 1 6-6h16a6 6 0 0 1 6 6v8" />
    <rect x="18" y="36" width="84" height="58" rx="8" />
    <path d="M18 58h84" />
    <rect x="50" y="50" width="20" height="16" rx="2" />
    <path d="M38 74h10M72 74h10" strokeDasharray="4 4" />
  </svg>
)
