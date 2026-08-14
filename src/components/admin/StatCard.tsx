import React from 'react'

type Props = {
  label: string
  value: string
  subStat?: string
  icon: React.ReactNode
  warn?: boolean
  href?: string
}

/**
 * Mockup-style stat card: label top-left, big number below, small sub-stat
 * line, icon badge top-right. Used above list views and on the dashboard so
 * both surfaces share one visual language.
 */
export const StatCard: React.FC<Props> = ({ label, value, subStat, icon, warn, href }) => {
  const Tag = href ? 'a' : 'div'

  return (
    <Tag
      className="border-base-content/10 bg-base-100/60 pmc-rounded-box flex flex-col gap-3 border p-4 shadow-sm no-underline transition-shadow hover:shadow-md"
      {...(href ? { href } : {})}
    >
      <div className="flex items-start justify-between">
        <span className="text-base-content/60 text-sm">{label}</span>
        <span
          className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full ${
            warn ? 'bg-warning/15 text-warning' : 'bg-primary/12 text-primary'
          }`}
        >
          {icon}
        </span>
      </div>
      <div>
        <div className="text-base-content text-2xl font-bold">{value}</div>
        {subStat ? <div className="text-base-content/50 mt-0.5 text-xs">{subStat}</div> : null}
      </div>
    </Tag>
  )
}
