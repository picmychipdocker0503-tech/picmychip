import React from 'react'

type Segment = { label: string; value: number; color: string }

type Props = {
  segments: Segment[]
  size?: number
}

/**
 * Dependency-free SVG donut — each segment is a circle stroked with
 * stroke-dasharray/stroke-dashoffset rather than a charting library.
 */
export const DonutChart: React.FC<Props> = ({ segments, size = 120 }) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1
  const radius = size / 2 - 10
  const circumference = 2 * Math.PI * radius

  let cumulative = 0

  return (
    <div className="flex items-center gap-4">
      <svg height={size} viewBox={`0 0 ${size} ${size}`} width={size}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {segments.map((segment) => {
            const fraction = segment.value / total
            const dash = fraction * circumference
            const offset = cumulative * circumference
            cumulative += fraction

            return (
              <circle
                cx={size / 2}
                cy={size / 2}
                fill="none"
                key={segment.label}
                r={radius}
                stroke={segment.color}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeWidth={12}
              />
            )
          })}
        </g>
      </svg>

      <ul className="flex flex-col gap-1.5">
        {segments.map((segment) => (
          <li className="flex items-center gap-2 text-xs" key={segment.label}>
            <span className="inline-block size-2.5 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
            <span className="text-base-content/80">{segment.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
