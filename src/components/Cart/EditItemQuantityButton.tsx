'use client'

import { CartItem } from '@/components/Cart'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import clsx from 'clsx'
import { MinusIcon, PlusIcon } from 'lucide-react'
import React, { useMemo, useState } from 'react'

export function EditItemQuantityButton({ type, item }: { item: CartItem; type: 'minus' | 'plus' }) {
  // `isLoading` from useCart() is one shared flag for the whole cart, not
  // per-line — using it here would disable every other line's +/- buttons
  // while any single line's request is in flight. Track this row's own
  // pending state instead.
  const { decrementItem, incrementItem } = useCart()
  const [isUpdating, setIsUpdating] = useState(false)

  const disabled = useMemo(() => {
    if (!item.id) return true

    const target =
      item.variant && typeof item.variant === 'object'
        ? item.variant
        : item.product && typeof item.product === 'object'
          ? item.product
          : null

    if (
      target &&
      typeof target === 'object' &&
      target.inventory !== undefined &&
      target.inventory !== null
    ) {
      if (type === 'plus' && item.quantity !== undefined && item.quantity !== null) {
        return item.quantity >= target.inventory
      }
    }

    return false
  }, [item, type])

  return (
    <form>
      <button
        disabled={disabled || isUpdating}
        aria-label={type === 'plus' ? 'Increase item quantity' : 'Reduce item quantity'}
        className={clsx(
          'ease hover:cursor-pointer flex h-full min-w-[36px] max-w-[36px] flex-none items-center justify-center rounded-full px-2 transition-all duration-200 hover:border-neutral-800 hover:opacity-80',
          {
            'cursor-not-allowed': disabled || isUpdating,
            'ml-auto': type === 'minus',
          },
        )}
        onClick={(e: React.FormEvent<HTMLButtonElement>) => {
          e.preventDefault()

          if (item.id) {
            setIsUpdating(true)
            const request = type === 'plus' ? incrementItem(item.id) : decrementItem(item.id)
            request.finally(() => setIsUpdating(false))
          }
        }}
        type="button"
      >
        {type === 'plus' ? (
          <PlusIcon className="h-4 w-4 dark:text-neutral-500 hover:text-blue-300" />
        ) : (
          <MinusIcon className="h-4 w-4 dark:text-neutral-500 hover:text-blue-300" />
        )}
      </button>
    </form>
  )
}
