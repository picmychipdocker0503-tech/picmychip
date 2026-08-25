import React, { useId } from 'react'

export const Inductors: React.FC<{ className?: string }> = ({ className }) => {
  const id = useId()
  const coilX = [140, 168, 196, 224, 252]

  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 400 225" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#eff6ff" />
          <stop offset="100%" stopColor="#fef9c3" />
        </linearGradient>
        <linearGradient id={`${id}-copper`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f0a868" />
          <stop offset="100%" stopColor="#c9711f" />
        </linearGradient>
      </defs>

      <rect fill={`url(#${id}-bg)`} height="225" width="400" />

      {/* magnetic field lines */}
      {[0, 1, 2].map((i) => (
        <path
          d={`M${132 - i * 14} 112 q${58 + i * 14} -${58 + i * 16} ${116 + i * 28} 0`}
          fill="none"
          key={i}
          stroke="#60a5fa"
          strokeDasharray="6 7"
          strokeLinecap="round"
          strokeOpacity={0.55 - i * 0.12}
          strokeWidth="2.5"
        />
      ))}
      {[0, 1, 2].map((i) => (
        <path
          d={`M${132 - i * 14} 112 q${58 + i * 14} ${58 + i * 16} ${116 + i * 28} 0`}
          fill="none"
          key={`b${i}`}
          stroke="#60a5fa"
          strokeDasharray="6 7"
          strokeLinecap="round"
          strokeOpacity={0.55 - i * 0.12}
          strokeWidth="2.5"
        />
      ))}

      {/* core rod */}
      <rect fill="#94a3b8" height="14" rx="7" width="150" x="118" y="105" />

      {/* leads */}
      <path d="M84 112h34M282 112h34" stroke="#c9711f" strokeLinecap="round" strokeWidth="6" />

      {/* copper coil loops */}
      {coilX.map((x) => (
        <ellipse
          cx={x}
          cy="112"
          fill="none"
          key={x}
          rx="13"
          ry="26"
          stroke={`url(#${id}-copper)`}
          strokeWidth="7"
        />
      ))}

      <text fill="#a8580f" fontFamily="ui-sans-serif, system-ui" fontSize="13" fontWeight="700" x="150" y="168">
        Coil + core = inductance
      </text>
    </svg>
  )
}
