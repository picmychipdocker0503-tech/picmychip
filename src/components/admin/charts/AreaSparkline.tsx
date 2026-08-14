import React from 'react'

type Props = {
  data: number[]
  color?: 'primary' | 'accent' | 'info'
  height?: number
}

const COLOR_VARS: Record<NonNullable<Props['color']>, string> = {
  primary: 'var(--color-primary)',
  accent: 'var(--color-accent)',
  info: 'var(--color-info-content)',
}

/**
 * Dependency-free SVG area/line chart — straight-line segments through each
 * point (no bezier smoothing) rather than pulling in a charting library,
 * consistent with RevenueTrendChart's plain-CSS approach elsewhere in this
 * admin. Reads as a smooth trend once there are a dozen+ points, which is
 * the only place this is used (14/30-day series).
 */
export const AreaSparkline: React.FC<Props> = ({ data, color = 'primary', height = 120 }) => {
  const width = 400
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const gradientId = React.useId()

  const points = data.map((value, index) => {
    const x = (index / Math.max(data.length - 1, 1)) * width
    const y = height - ((value - min) / range) * (height - 8) - 4
    return { x, y }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`
  const strokeColor = COLOR_VARS[color]

  return (
    <svg
      className="w-full"
      height={height}
      preserveAspectRatio="none"
      style={{ display: 'block' }}
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
      <path d={linePath} fill="none" stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </svg>
  )
}
