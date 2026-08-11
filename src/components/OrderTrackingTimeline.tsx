import { CheckIcon } from 'lucide-react'
import React from 'react'

import { cn } from '@/utilities/cn'

type Props = {
  courierName?: string | null
  status?: string | null
  trackingNumber?: string | null
}

export const OrderTrackingTimeline: React.FC<Props> = ({ status, trackingNumber, courierName }) => {
  if (status === 'cancelled' || status === 'refunded') {
    return (
      <p className="text-muted-foreground text-sm capitalize">
        This order was {status}.
      </p>
    )
  }

  const hasShipped = Boolean(trackingNumber)
  const isCompleted = status === 'completed'

  const steps = [
    { label: 'Order placed', done: true },
    { label: 'Processing', done: true },
    { label: 'Shipped', done: hasShipped || isCompleted },
    { label: 'Delivered', done: isCompleted },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center">
        {steps.map((step, index) => (
          <React.Fragment key={step.label}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex size-7 items-center justify-center rounded-full border-2 text-xs font-semibold',
                  step.done
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground',
                )}
              >
                {step.done ? <CheckIcon className="size-3.5" /> : index + 1}
              </div>
              <span className="text-muted-foreground max-w-16 text-center text-xs">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn('mx-1 h-0.5 flex-1', steps[index + 1].done ? 'bg-primary' : 'bg-border')}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {trackingNumber && (
        <p className="text-sm">
          <span className="text-muted-foreground">
            {courierName ? `${courierName} tracking number: ` : 'Tracking number: '}
          </span>
          <span className="font-medium">{trackingNumber}</span>
        </p>
      )}
    </div>
  )
}
