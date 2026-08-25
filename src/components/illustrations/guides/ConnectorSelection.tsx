import React, { useId } from 'react'

export const ConnectorSelection: React.FC<{ className?: string }> = ({ className }) => {
  const id = useId()

  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 400 225" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#f5f3ff" />
          <stop offset="100%" stopColor="#fff7ed" />
        </linearGradient>
        <linearGradient id={`${id}-usb`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
      </defs>

      <rect fill={`url(#${id}-bg)`} height="225" width="400" />

      {/* JST connector */}
      <g transform="translate(90 112)">
        <path d="M-4 34v18M8 34v18" stroke="#dc2626" strokeLinecap="round" strokeWidth="4" />
        <rect fill="#18181b" height="40" rx="6" width="40" x="-20" y="-6" />
        <rect fill="#3f3f46" height="40" rx="4" width="10" x="-14" y="-6" />
        <rect fill="#3f3f46" height="40" rx="4" width="10" x="4" y="-6" />
        <text fill="#57534e" fontFamily="ui-sans-serif, system-ui" fontSize="11" fontWeight="600" textAnchor="middle" y="70">
          JST
        </text>
      </g>

      {/* USB shell */}
      <g transform="translate(200 112)">
        <rect fill={`url(#${id}-usb)`} height="30" rx="4" width="60" x="-30" y="-15" />
        <rect fill="#475569" height="30" rx="4" width="60" x="-30" y="-15" fillOpacity="0" stroke="#64748b" strokeWidth="1.5" />
        <rect fill="#1e293b" height="10" rx="2" width="44" x="-22" y="-5" />
        <path d="M-30 -15v-16h60v16" fill="none" stroke="#94a3b8" strokeWidth="2" />
        <text fill="#57534e" fontFamily="ui-sans-serif, system-ui" fontSize="11" fontWeight="600" textAnchor="middle" y="46">
          USB
        </text>
      </g>

      {/* pin header */}
      <g transform="translate(310 112)">
        <rect fill="#1c1917" height="18" rx="3" width="66" x="-33" y="-9" />
        {[-27, -18, -9, 0, 9, 18, 27].map((x) => (
          <rect fill="#d4af37" height="30" key={x} width="4" x={x - 2} y="-24" />
        ))}
        <text fill="#57534e" fontFamily="ui-sans-serif, system-ui" fontSize="11" fontWeight="600" textAnchor="middle" y="46">
          Pin header
        </text>
      </g>
    </svg>
  )
}
