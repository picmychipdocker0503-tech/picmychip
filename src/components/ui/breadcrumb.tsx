import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import Link from 'next/link'

import { cn } from '@/utilities/cn'

function Breadcrumb({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav data-slot="breadcrumb" aria-label="breadcrumb" className={cn(className)} {...props} />
  )
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="breadcrumb-list"
      className={cn('breadcrumbs text-muted-foreground p-0 text-sm', className)}
      {...props}
    />
  )
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<'li'>) {
  return <li data-slot="breadcrumb-item" className={cn(className)} {...props} />
}

function BreadcrumbLink({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<typeof Link> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : Link

  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn('hover:text-foreground transition-colors', className)}
      {...props}
    />
  )
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn('text-foreground font-medium', className)}
      {...props}
    />
  )
}

export { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage }
