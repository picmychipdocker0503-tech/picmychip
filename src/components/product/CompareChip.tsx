'use client'

import { useRouter } from 'next/navigation'
import React from 'react'
import { XIcon } from 'lucide-react'

import { useCompare } from '@/providers/Compare'

type Props = {
  productId: string
  title: string
  allIds: string[]
}

export const CompareChip: React.FC<Props> = ({ productId, title, allIds }) => {
  const router = useRouter()
  const { toggle } = useCompare()

  const remove = () => {
    toggle(productId)
    const remaining = allIds.filter((id) => id !== productId)
    router.push(remaining.length ? `/compare?ids=${remaining.join(',')}` : '/compare')
  }

  return (
    <button
      className="border-border flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm"
      onClick={remove}
      type="button"
    >
      {title}
      <XIcon className="size-3.5" />
    </button>
  )
}
