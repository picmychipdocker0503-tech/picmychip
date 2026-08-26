import React from 'react'

type Props = {
  label: string
  value: string
  warn?: boolean
}

export const StatTile: React.FC<Props> = ({ label, value, warn }) => (
  <div className="border-base-content/10 bg-base-100/40 pmc-rounded-box relative flex flex-col gap-1 overflow-hidden border p-4 pl-5 shadow-md backdrop-blur-xl">
    <span className={`absolute inset-y-0 left-0 w-1 ${warn ? 'bg-warning' : 'bg-primary'}`} aria-hidden="true" />
    <span className="text-base-content/60 text-sm font-medium">{label}</span>
    <span className={`text-3xl font-black tracking-tight ${warn ? 'text-warning' : 'text-base-content'}`}>{value}</span>
  </div>
)
