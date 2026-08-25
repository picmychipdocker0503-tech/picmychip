import React, { useId } from 'react'

export const ResistorColorCode: React.FC<{ className?: string }> = ({ className }) => {
  const id = useId()

  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 400 225" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#fff7ed" />
          <stop offset="100%" stopColor="#ffedd5" />
        </linearGradient>
        <linearGradient id={`${id}-body`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f3d8ad" />
          <stop offset="55%" stopColor="#e4bd82" />
          <stop offset="100%" stopColor="#cf9f5c" />
        </linearGradient>
      </defs>

      <rect fill={`url(#${id}-bg)`} height="225" width="400" />

      {/* leads */}
      <path d="M60 112h58M282 112h58" stroke="#9a8a72" strokeLinecap="round" strokeWidth="5" />

      {/* body */}
      <rect fill={`url(#${id}-body)`} height="56" rx="16" width="164" x="118" y="84" />
      <rect fill="none" height="56" rx="16" stroke="#b98a4a" strokeOpacity="0.4" strokeWidth="1.5" width="164" x="118" y="84" />

      {/* color bands: 1k ohm, 5% tolerance -> brown, black, red, gold */}
      <rect fill="#5c3a21" height="56" width="12" x="140" y="84" />
      <rect fill="#1c1917" height="56" width="12" x="166" y="84" />
      <rect fill="#c0392b" height="56" width="12" x="192" y="84" />
      <rect fill="#d4af37" height="56" width="12" x="252" y="84" />

      {/* legend swatches */}
      {[
        { color: '#5c3a21', label: '1', x: 132 },
        { color: '#1c1917', label: '0', x: 168 },
        { color: '#c0392b', label: '×100', x: 208 },
        { color: '#d4af37', label: '±5%', x: 258 },
      ].map((band) => (
        <g key={band.label} transform={`translate(${band.x} 154)`}>
          <circle cx="6" cy="6" fill={band.color} r="6" />
          <text fill="#7c5a33" fontFamily="ui-sans-serif, system-ui" fontSize="11" fontWeight="600" x="16" y="10">
            {band.label}
          </text>
        </g>
      ))}

      <text fill="#9a6a2f" fontFamily="ui-sans-serif, system-ui" fontSize="13" fontWeight="700" x="150" y="60">
        1 kΩ ±5%
      </text>
    </svg>
  )
}
