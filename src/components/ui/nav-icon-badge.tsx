type Props = {
  count: number
}

export function NavIconBadge({ count }: Props) {
  return (
    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
      {count}
    </span>
  )
}
