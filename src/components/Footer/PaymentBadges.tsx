const badges = [
  { label: 'Visa', text: 'VISA' },
  { label: 'Mastercard', text: 'MC' },
  { label: 'RuPay', text: 'RuPay' },
  { label: 'UPI', text: 'UPI' },
  { label: 'American Express', text: 'AMEX' },
]

export function PaymentBadges() {
  return (
    <div className="flex items-center gap-1.5" role="list" aria-label="Accepted payment methods">
      {badges.map((badge) => (
        <span
          key={badge.label}
          role="listitem"
          aria-label={badge.label}
          className="border-border text-muted-foreground flex h-6 min-w-10 items-center justify-center rounded-sm border px-1.5 text-[10px] font-semibold tracking-tight"
        >
          {badge.text}
        </span>
      ))}
    </div>
  )
}
