import clsx from 'clsx'
import React from 'react'

import { Price } from '@/components/Price'

type Props = {
  amount: number
  position?: 'bottom' | 'center'
  title: string
}

export const Label: React.FC<Props> = ({ amount, position = 'bottom', title }) => {
  return (
    <div
      className={clsx('absolute bottom-0 left-0 flex w-full px-4 pb-4 @container/label', {
        '': position === 'center',
      })}
    >
      <div className="flex items-end justify-between text-sm grow font-semibold ">
        <h3 className="border-border bg-card/80 text-foreground mr-4 line-clamp-2 rounded-full border p-2 px-3 leading-none tracking-tight backdrop-blur-md">
          {title}
        </h3>

        <Price
          amount={amount}
          className="bg-primary text-primary-foreground flex-none rounded-full p-2"
          currencyCodeClassName="hidden @[275px]/label:inline"
        />
      </div>
    </div>
  )
}
