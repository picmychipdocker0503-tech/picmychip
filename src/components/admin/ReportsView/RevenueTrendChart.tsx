import React from 'react'

import { formatDateTime } from '@/utilities/formatDateTime'

type Props = {
  data: { date: string; revenue: number }[]
  formatCurrency: (amount: number) => string
}

/**
 * 14-day revenue trend as thin single-hue columns (one series → no legend
 * needed per dataviz skill). Every bar carries its exact value in a native
 * `title` tooltip; only every 3rd date gets a visible axis label to avoid
 * crowding, which is the "selective direct labels" rule rather than a label
 * on every point.
 */
export const RevenueTrendChart: React.FC<Props> = ({ data, formatCurrency }) => {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1)

  return (
    <div className="flex h-32 items-end gap-1.5">
      {data.map((point, index) => {
        const heightPercent = Math.max((point.revenue / maxRevenue) * 100, point.revenue > 0 ? 4 : 1.5)
        const showLabel = index === 0 || index === data.length - 1 || index % 3 === 0

        return (
          <div className="flex flex-1 flex-col items-center gap-1" key={point.date}>
            <div className="flex h-24 w-full items-end">
              <div
                className="bg-primary w-full rounded-t-sm"
                style={{ height: `${heightPercent}%`, opacity: point.revenue > 0 ? 1 : 0.25 }}
                title={`${formatDateTime({ date: point.date, format: 'MMM d' })}: ${formatCurrency(point.revenue)}`}
              />
            </div>
            <span className="text-base-content/50 text-[10px] whitespace-nowrap">
              {showLabel ? formatDateTime({ date: point.date, format: 'MMM d' }) : ''}
            </span>
          </div>
        )
      })}
    </div>
  )
}
