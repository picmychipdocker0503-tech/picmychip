import React from 'react'

type Props = {
  label: string
  value: string
  warn?: boolean
}

export const StatTile: React.FC<Props> = ({ label, value, warn }) => (
  <div className="border-base-content/10 bg-base-100/40 pmc-rounded-box flex flex-col gap-1 border p-4 shadow-md backdrop-blur-xl">
    <span className="text-base-content/70 text-sm">{label}</span>
    <span className={`text-3xl font-bold ${warn ? 'text-warning' : 'text-base-content'}`}>{value}</span>
  </div>
)
