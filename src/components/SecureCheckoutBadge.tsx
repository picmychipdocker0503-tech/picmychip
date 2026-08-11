import { LockIcon, ShieldCheckIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

export const SecureCheckoutBadge: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`text-muted-foreground flex flex-col gap-2 text-xs ${className ?? ''}`}>
    <div className="flex flex-wrap items-center gap-4">
      <span className="flex items-center gap-1.5">
        <LockIcon className="text-success size-3.5" />
        SSL encrypted checkout
      </span>
      <span className="flex items-center gap-1.5">
        <ShieldCheckIcon className="text-success size-3.5" />
        Payments processed securely by PayU
      </span>
    </div>
    <p>
      By placing an order you agree to our{' '}
      <Link className="text-primary underline" href="/terms">
        Terms &amp; Refund Policy
      </Link>
      .
    </p>
  </div>
)
