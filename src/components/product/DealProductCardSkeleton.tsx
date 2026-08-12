import React from 'react'

export const DealProductCardSkeleton: React.FC = () => (
  <div className="bg-card border-border flex h-full flex-col items-center gap-4 rounded-2xl border p-6 text-center">
    <div className="animate-shimmer h-5 w-3/4 rounded" />
    <div className="animate-shimmer h-6 w-1/3 rounded" />
    <div className="animate-shimmer aspect-square w-full max-w-40 rounded-lg" />
    <div className="mt-1 flex w-full items-center justify-between gap-2">
      <div className="animate-shimmer h-4 w-16 rounded" />
      <div className="animate-shimmer h-7 w-24 rounded-full" />
    </div>
  </div>
)
