import React from 'react'

export const CircuitBoard: React.FC<{ className?: string }> = ({ className }) => (
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
    <rect x="12" y="12" width="96" height="96" rx="6" />
    <path d="M30 12v20M30 92v16M60 12v14M60 96v12M90 12v24M90 88v20" />
    <path d="M12 40h20M96 40h12M12 66h14M100 66h8M12 84h24M92 84h16" />
    <circle cx="30" cy="40" r="4" />
    <circle cx="60" cy="66" r="4" />
    <circle cx="90" cy="84" r="4" />
    <circle cx="46" cy="52" r="3" />
    <circle cx="76" cy="34" r="3" />
    <rect x="42" y="60" width="16" height="16" rx="2" />
  </svg>
)
