import React from 'react'

export const CommunityVoice: React.FC<{ className?: string }> = ({ className }) => (
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
    <rect x="16" y="24" width="62" height="44" rx="10" />
    <path d="M34 68l-6 15 17-15" />
    <circle cx="34" cy="46" r="2" fill="currentColor" stroke="none" />
    <circle cx="47" cy="46" r="2" fill="currentColor" stroke="none" />
    <circle cx="60" cy="46" r="2" fill="currentColor" stroke="none" />
    <path
      d="M86 58l3.5 7.5 8 1.2-5.8 5.6 1.4 8-7.1-3.7-7.1 3.7 1.4-8-5.8-5.6 8-1.2Z"
      fill="currentColor"
      stroke="none"
    />
  </svg>
)
