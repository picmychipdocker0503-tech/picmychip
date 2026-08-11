import React from 'react'

export const ProductGridItemSkeleton: React.FC = () => (
  <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
    <div className="aspect-square animate-shimmer" />
    <div className="p-4 flex flex-col gap-3">
      <div className="animate-shimmer h-4 w-3/4 rounded" />
      <div className="flex items-center justify-between">
        <div className="animate-shimmer h-5 w-1/3 rounded" />
        <div className="animate-shimmer h-8 w-16 rounded-lg" />
      </div>
    </div>
  </div>
)
