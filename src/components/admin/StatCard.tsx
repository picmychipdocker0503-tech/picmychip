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
 * pill, icon badge top-right, colored accent bar on the leading edge. Used
 * above list views and on the dashboard so both surfaces share one visual
 * language.
 */
export const StatCard: React.FC<Props> = ({ label, value, subStat, icon, warn, href }) => {
  const Tag = href ? 'a' : 'div'

  return (
    <Tag
      className="group border-base-content/10 bg-base-100 pmc-rounded-box relative flex flex-col gap-3 overflow-hidden border p-4 pl-5 shadow-sm no-underline transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      {...(href ? { href } : {})}
    >
      <span
        className={`absolute inset-y-0 left-0 w-1 ${warn ? 'bg-warning' : 'bg-primary'}`}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between">
        <span className="text-base-content/60 text-sm font-medium">{label}</span>
        <span
          className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm transition-transform duration-200 group-hover:scale-110 ${
            warn ? 'from-warning/30 to-warning/10 text-warning' : 'from-primary/30 to-primary/10 text-primary'
          }`}
        >
          {icon}
        </span>
      </div>
      <div>
        <div className="text-base-content text-3xl font-black tracking-tight">{value}</div>
        {subStat ? (
          <div
            className={`mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              warn ? 'bg-warning/12 text-warning' : 'bg-base-content/5 text-base-content/50'
            }`}
          >
            {subStat}
          </div>
        ) : null}
      </div>
    </Tag>
  )
}
