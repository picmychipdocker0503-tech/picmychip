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
        'group text-muted-foreground hover:bg-muted hover:text-foreground relative inline-flex size-10 items-center justify-center rounded-full transition-[background-color,color,transform] duration-200 active:scale-95',
        bounce && 'scale-125',
        className,
      )}
      type="button"
      {...rest}
    >
      <ShoppingBagIcon className="pmc-icon-anim size-5 group-hover:animate-[pmc-icon-pop_0.5s_ease-in-out]" />
      <NavIconBadge count={quantity ?? 0} />
    </button>
  )
}
