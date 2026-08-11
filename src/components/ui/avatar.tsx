'use client'

import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'

import { cn } from '@/utilities/cn'

function Avatar({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root data-slot="avatar" className={cn('avatar size-10', className)} {...props} />
  )
}

function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <div className="rounded-full">
      <AvatarPrimitive.Image
        data-slot="avatar-image"
        className={cn('size-full object-cover', className)}
        {...props}
      />
    </div>
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <div className="bg-muted text-muted-foreground flex items-center justify-center rounded-full text-sm font-medium">
      <AvatarPrimitive.Fallback data-slot="avatar-fallback" className={cn(className)} {...props} />
    </div>
  )
}

export { Avatar, AvatarImage, AvatarFallback }
