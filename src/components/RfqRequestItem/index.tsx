import { Button } from '@/components/ui/button'
import { RfqSubmission } from '@/payload-types'
import { cn } from '@/utilities/cn'
import { formatDateTime } from '@/utilities/formatDateTime'
import Link from 'next/link'

type Props = {
  submission: RfqSubmission
}

const STATUS_LABELS: Record<NonNullable<RfqSubmission['status']>, string> = {
  new: 'New',
  reviewing: 'Reviewing',
  quoted: 'Quoted',
  won: 'Won',
  lost: 'Lost',
  closed: 'Closed',
}

export const RfqStatusBadge: React.FC<{ status?: RfqSubmission['status'] | null; className?: string }> = ({
  status,
  className,
}) => {
  if (!status) return null
  return (
    <div
      className={cn('text-xs tracking-widest font-semibold uppercase py-0 px-2 rounded w-fit', className, {
        'bg-primary/10': status === 'new' || status === 'reviewing',
        'bg-success': status === 'quoted' || status === 'won',
        'bg-destructive/10 text-destructive': status === 'lost',
      })}
    >
      {STATUS_LABELS[status]}
    </div>
  )
}

export const RfqRequestItem: React.FC<Props> = ({ submission }) => {
  const lineItemCount = submission.lineItems?.length ?? 0
  const itemsLabel = lineItemCount === 1 ? 'line item' : 'line items'

  return (
    <div className="bg-card border rounded-lg px-4 py-2 md:px-6 md:py-4 flex flex-col sm:flex-row gap-12 sm:items-center sm:justify-between">
      <div className="flex flex-col gap-4">
        <h3 className="text-sm uppercase font-mono tracking-widest text-primary/50 truncate max-w-48 sm:max-w-none">
          {submission.ticketId}
        </h3>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-6">
          <p className="text-xl">
            <time dateTime={submission.createdAt}>
              {formatDateTime({ date: submission.createdAt, format: 'MMMM dd, yyyy' })}
            </time>
          </p>

          <RfqStatusBadge status={submission.status} />
        </div>

        <p className="flex gap-2 text-xs text-primary/80">
          {lineItemCount > 0 && (
            <span>
              {lineItemCount} {itemsLabel}
            </span>
          )}
          {submission.bomFile && (
            <>
              {lineItemCount > 0 && <span>•</span>}
              <span>BOM file attached</span>
            </>
          )}
        </p>
      </div>

      <Button variant="outline" asChild className="self-start sm:self-auto">
        <Link href={`/rfq-requests/${submission.id}`}>View Request</Link>
      </Button>
    </div>
  )
}
