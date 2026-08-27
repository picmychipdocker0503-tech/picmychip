'use client'

import type { CartItem } from '@/components/Cart'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import clsx from 'clsx'
import { XIcon } from 'lucide-react'
import React, { useState } from 'react'

export function DeleteItemButton({ item }: { item: CartItem }) {
  // `isLoading` from useCart() is one shared flag for the whole cart, not
  // per-line — using it here would disable every other line's remove
  // button while any single line's request is in flight.
  const { removeItem } = useCart()
  const [isRemoving, setIsRemoving] = useState(false)
  const itemId = item.id

  return (
    <form>
      <button
        aria-label="Remove cart item"
        className={clsx(
          'ease hover:cursor-pointer flex h-[17px] w-[17px] items-center justify-center rounded-full bg-neutral-500 transition-all duration-200',
          {
            'cursor-not-allowed px-0': !itemId || isRemoving,
          },
        )}
        disabled={!itemId || isRemoving}
        onClick={(e: React.FormEvent<HTMLButtonElement>) => {
          e.preventDefault()
          if (itemId) {
            setIsRemoving(true)
            removeItem(itemId).finally(() => setIsRemoving(false))
          }
        }}
        type="button"
      >
        <XIcon className="hover:text-accent-3 mx-px h-4 w-4 text-white dark:text-black" />
      </button>
    </form>
  )
}
