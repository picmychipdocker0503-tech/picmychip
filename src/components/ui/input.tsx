import * as React from 'react'

import { cn } from '@/utilities/cn'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      // Password managers (LastPass, 1Password, Bitwarden) inject an icon
      // element into the DOM right after form inputs — if that happens
      // between server render and client hydration, React sees an
      // unexpected extra node and throws a hydration-mismatch error. These
      // attributes ask the extensions not to touch these fields.
      data-lpignore="true"
      data-1p-ignore=""
      data-bwignore="true"
      data-form-type="other"
      className={cn(
        'input border-input bg-background file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
