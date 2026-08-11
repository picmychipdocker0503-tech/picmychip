import { cn } from '@/utilities/cn'

type ProgressProps = {
  value: number
  className?: string
}

export function Progress({ value, className }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return <progress className={cn('progress progress-primary h-2 w-full', className)} max={100} value={clamped} />
}
