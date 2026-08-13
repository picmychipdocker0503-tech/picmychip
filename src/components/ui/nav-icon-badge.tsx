type Props = {
  count: number
}

export function NavIconBadge({ count }: Props) {
  if (count <= 0) return null

  return (
    <span className="ring-card absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white ring-2">
      {count > 99 ? '99+' : count}
    </span>
  )
}
