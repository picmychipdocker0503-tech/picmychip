import React, { useId } from 'react'

export const DiodeBasics: React.FC<{ className?: string }> = ({ className }) => {
  const id = useId()

  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 400 225" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#fef2f2" />
          <stop offset="100%" stopColor="#fff7ed" />
        </linearGradient>
        <linearGradient id={`${id}-body`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#3f3f46" />
          <stop offset="100%" stopColor="#18181b" />
        </linearGradient>
      </defs>

      <rect fill={`url(#${id}-bg)`} height="225" width="400" />

      {/* schematic symbol, glowing */}
      <g transform="translate(140 78)">
        <path d="M-46 0h30M46 0h-14" stroke="#57534e" strokeLinecap="round" strokeWidth="4" />
        <path d="M-16 -22L14 0L-16 22Z" fill="#f97316" fillOpacity="0.9" />
        <path d="M14 -22v44" stroke="#57534e" strokeLinecap="round" strokeWidth="4" />
        <path d="M-30 -34h8M-24 -40h8M-18 -46h8" stroke="#f97316" strokeLinecap="round" strokeWidth="3" />
      </g>
      <text fill="#c2410c" fontFamily="ui-sans-serif, system-ui" fontSize="12" fontWeight="700" x="82" y="126">
        Forward current →
      </text>

      {/* physical diode body */}
      <g transform="translate(260 130)">
        <path d="M-70 0h34M70 0h-34" stroke="#78716c" strokeLinecap="round" strokeWidth="5" />
        <rect fill={`url(#${id}-body)`} height="30" rx="15" width="72" x="-36" y="-15" />
        <rect fill="#f5f5f4" height="30" width="8" x="22" y="-15" />
        <text fill="#78716c" fontFamily="ui-sans-serif, system-ui" fontSize="11" fontWeight="600" textAnchor="middle" y="42">
          Cathode band
        </text>
        <path d="M0 -32l6 10h-12z" fill="#a8a29e" />
      </g>
    </svg>
  )
}
