import React, { useId } from 'react'

export const CapacitorTypes: React.FC<{ className?: string }> = ({ className }) => {
  const id = useId()

  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 400 225" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#eff6ff" />
          <stop offset="100%" stopColor="#fff7ed" />
        </linearGradient>
        <linearGradient id={`${id}-elec`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#1e3a5f" />
          <stop offset="50%" stopColor="#2f5583" />
          <stop offset="100%" stopColor="#1e3a5f" />
        </linearGradient>
        <linearGradient id={`${id}-ceramic`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#7fb3e0" />
          <stop offset="100%" stopColor="#4f8fc7" />
        </linearGradient>
        <linearGradient id={`${id}-tant`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#e8a33d" />
          <stop offset="100%" stopColor="#c97f1e" />
        </linearGradient>
      </defs>

      <rect fill={`url(#${id}-bg)`} height="225" width="400" />

      {/* ceramic disc */}
      <g transform="translate(78 112)">
        <path d="M0 30v18M0 30h0" stroke="#9ca3af" strokeLinecap="round" strokeWidth="4" />
        <path d="M-2 -60v30M2 -60v30" stroke="#9ca3af" strokeLinecap="round" strokeWidth="4" />
        <ellipse cx="0" cy="0" fill={`url(#${id}-ceramic)`} rx="34" ry="30" />
        <ellipse cx="0" cy="0" fill="none" rx="34" ry="30" stroke="#3f6f9c" strokeWidth="2" />
        <text fill="#e6f1fb" fontFamily="ui-sans-serif, system-ui" fontSize="11" fontWeight="700" textAnchor="middle" y="5">
          104
        </text>
        <text fill="#3f6f9c" fontFamily="ui-sans-serif, system-ui" fontSize="11" fontWeight="600" textAnchor="middle" y="58">
          Ceramic
        </text>
      </g>

      {/* electrolytic can */}
      <g transform="translate(200 112)">
        <path d="M-14 46v22M14 46v22" stroke="#9ca3af" strokeLinecap="round" strokeWidth="4" />
        <rect fill={`url(#${id}-elec)`} height="92" rx="10" width="56" x="-28" y="-46" />
        <rect fill="#0f2038" height="14" rx="4" width="56" x="-28" y="-46" />
        <path d="M-28 -8h56" stroke="#e8eef5" strokeOpacity="0.55" strokeWidth="2" />
        <text fill="#e8eef5" fontFamily="ui-sans-serif, system-ui" fontSize="18" fontWeight="700" textAnchor="middle" x="-16" y="26">
          −
        </text>
        <text fill="#5b8fc7" fontFamily="ui-sans-serif, system-ui" fontSize="11" fontWeight="600" textAnchor="middle" y="66">
          Electrolytic
        </text>
      </g>

      {/* tantalum bead */}
      <g transform="translate(316 112)">
        <path d="M-8 34v14M8 34v14" stroke="#9ca3af" strokeLinecap="round" strokeWidth="4" />
        <path d="M-24 34 Q-24 -32 0 -32 Q24 -32 24 34 Z" fill={`url(#${id}-tant)`} />
        <rect fill="#7c4a0f" height="6" rx="2" width="12" x="-6" y="-30" />
        <text fill="#3f6f9c" fontFamily="ui-sans-serif, system-ui" fontSize="11" fontWeight="600" textAnchor="middle" y="58">
          Tantalum
        </text>
      </g>
    </svg>
  )
}
