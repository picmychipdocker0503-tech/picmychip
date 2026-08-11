'use client'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/providers/Auth'
import { getClientSideURL } from '@/utilities/getURL'
import { StarIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { toast } from 'sonner'

type Props = {
  productId: number
}

export const ReviewForm: React.FC<Props> = ({ productId }) => {
  const { user } = useAuth()
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (user === null) {
    return (
      <p className="text-muted-foreground text-sm">
        <Link className="text-primary hover:underline" href="/login">
          Sign in
        </Link>{' '}
        to write a review.
      </p>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error('Please select a star rating.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`${getClientSideURL()}/api/reviews`, {
        body: JSON.stringify({ product: productId, rating, comment }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to submit review')

      toast.success('Thanks! Your review has been submitted for approval.')
      setRating(0)
      setComment('')
      router.refresh()
    } catch {
      toast.error('There was a problem submitting your review.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            aria-label={`Rate ${value} out of 5`}
            key={value}
            onClick={() => setRating(value)}
            onMouseEnter={() => setHoverRating(value)}
            onMouseLeave={() => setHoverRating(0)}
            type="button"
          >
            <StarIcon
              className={
                value <= (hoverRating || rating)
                  ? 'size-6 fill-orange text-orange'
                  : 'text-muted-foreground size-6'
              }
            />
          </button>
        ))}
      </div>
      <Textarea
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience with this product (optional)"
        value={comment}
      />
      <Button className="w-fit" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  )
}
