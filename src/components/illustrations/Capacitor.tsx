import React from 'react'

export const Capacitor: React.FC<{ className?: string }> = ({ className }) => (
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
    <path d="M6 60h22M92 60h22" />
    <rect x="28" y="34" width="64" height="52" rx="26" />
    <path d="M42 44v32" />
    <path d="M35 52h-4M35 68h-4" />
  </svg>
)
