'use client'

import { NavIconBadge } from '@/components/ui/nav-icon-badge'
import { cn } from '@/utilities/cn'
import { ShoppingBagIcon } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

export function OpenCartButton({
  className,
  quantity,
  ...rest
}: {
  className?: string
  quantity?: number
}) {
  const [bounce, setBounce] = useState(false)
  const previousQuantity = useRef(quantity)

  useEffect(() => {
    if (
      typeof quantity === 'number' &&
      typeof previousQuantity.current === 'number' &&
      quantity > previousQuantity.current
    ) {
      setBounce(true)
      const timeout = setTimeout(() => setBounce(false), 400)
      previousQuantity.current = quantity
      return () => clearTimeout(timeout)
    }

    previousQuantity.current = quantity
  }, [quantity])

  return (
    <button
      aria-label="Open cart"
      className={cn(
        'btn btn-ghost btn-circle relative transition-transform duration-200',
        bounce && 'scale-125',
        className,
      )}
      type="button"
      {...rest}
    >
      <ShoppingBagIcon className="size-5" />
      <NavIconBadge count={quantity ?? 0} />
    </button>
  )
}
