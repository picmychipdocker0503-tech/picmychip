import { cn } from '@/utilities/cn'
import React from 'react'

type Props = {
  rating: number
  className?: string
  size?: 'xs' | 'sm' | 'md'
}

const SIZE_CLASS: Record<NonNullable<Props['size']>, string> = {
  xs: 'rating-xs',
  sm: 'rating-sm',
  md: '',
}

/** Read-only star rating, 1-5. Renders nothing for an out-of-range value. */
export const RatingStars: React.FC<Props> = ({ rating, className, size = 'sm' }) => {
  const rounded = Math.round(Math.min(5, Math.max(0, rating)))

  if (!rounded) return null

  return (
    <div aria-label={`Rated ${rounded} out of 5 stars`} className={cn('rating', SIZE_CLASS[size], className)} role="img">
      {[1, 2, 3, 4, 5].map((value) => (
        <div
          aria-current={value === rounded}
          className={cn('mask mask-star-2', value <= rounded ? 'bg-orange' : 'bg-base-300')}
          key={value}
        />
      ))}
    </div>
  )
}
