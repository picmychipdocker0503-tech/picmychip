import React from 'react'

type Props = {
  label: string
  maxValue: number
  value: string
  valueRaw: number
}

/**
 * Single-hue horizontal bar (magnitude data → one hue, per dataviz skill) —
 * a thin track with a rounded-end fill sized relative to the row set's max,
 * plus a direct label so the exact value doesn't rely on comparing bar
 * lengths by eye.
 */
export const BarRow: React.FC<Props> = ({ label, value, valueRaw, maxValue }) => {
  const widthPercent = maxValue > 0 ? Math.max((valueRaw / maxValue) * 100, 3) : 0

  return (
    <div className="flex items-center gap-3">
      <span className="text-base-content/80 w-32 shrink-0 truncate text-sm" title={label}>
        {label}
      </span>
      <div className="bg-base-200 h-2.5 flex-1 overflow-hidden rounded-full">
        <div className="bg-primary h-full rounded-full" style={{ width: `${widthPercent}%` }} />
      </div>
      <span className="text-base-content w-16 shrink-0 text-right text-sm font-medium">{value}</span>
    </div>
  )
}
