import { RichText } from '@/components/RichText'
import type { BannerBlock as BannerBlockProps } from '@/payload-types'
import { cn } from '@/utilities/cn'
import React from 'react'

export const BannerBlock: React.FC<
  BannerBlockProps & {
    id?: string | number
    className?: string
  }
> = ({ className, content, style }) => {
  return (
    <div className={cn('mx-auto my-8 w-full', className)}>
      <div
        className={cn('border py-6 px-8 flex items-center justify-center rounded-2xl shadow-sm', {
          'border-primary bg-gradient-to-r from-primary/10 to-accent/10': style === 'info',
          'border-error bg-gradient-to-r from-error/10 to-error/5': style === 'error',
          'border-success bg-gradient-to-r from-success/10 to-success/5': style === 'success',
          'border-warning bg-gradient-to-r from-warning/10 to-warning/5': style === 'warning',
        })}
      >
        <div className="text-center">
          <RichText data={content} enableGutter={false} enableProse={false} />
        </div>
      </div>
    </div>
  )
}
