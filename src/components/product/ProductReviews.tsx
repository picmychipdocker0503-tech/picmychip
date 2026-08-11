import { RatingStars } from '@/components/RatingStars'
import { ReviewForm } from '@/components/product/ReviewForm'
import { formatDateTime } from '@/utilities/formatDateTime'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

type Props = {
  productId: number
}

export const ProductReviews: React.FC<Props> = async ({ productId }) => {
  const payload = await getPayload({ config: configPromise })

  const { docs: reviews } = await payload.find({
    collection: 'reviews',
    depth: 1,
    limit: 50,
    overrideAccess: false,
    sort: '-createdAt',
    where: {
      and: [{ product: { equals: productId } }, { status: { equals: 'approved' } }],
    },
  })

  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Customer Reviews</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <RatingStars rating={averageRating} size="md" />
            <span className="text-muted-foreground text-sm">
              {averageRating.toFixed(1)} ({reviews.length} review{reviews.length === 1 ? '' : 's'})
            </span>
          </div>
        )}
      </div>

      <div className="border-border bg-muted/20 rounded-lg border p-4">
        <h3 className="mb-3 text-sm font-semibold">Write a review</h3>
        <ReviewForm productId={productId} />
      </div>

      {reviews.length === 0 ? (
        <p className="text-muted-foreground text-sm">No reviews yet — be the first to share your thoughts.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {reviews.map((review) => {
            const customerName =
              typeof review.customer === 'object' ? review.customer?.name : undefined

            return (
              <li className="border-border border-b pb-4 last:border-b-0" key={review.id}>
                <div className="flex items-center gap-2">
                  <RatingStars rating={review.rating} />
                  {review.verifiedPurchase && (
                    <span className="text-success text-xs font-medium">Verified Purchase</span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm">
                  <span className="font-medium text-foreground">{customerName || 'Anonymous'}</span>
                  <span className="text-muted-foreground">
                    {formatDateTime({ date: review.createdAt, format: 'MMM d, yyyy' })}
                  </span>
                </div>
                {review.comment && <p className="text-muted-foreground mt-2 text-sm">{review.comment}</p>}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
