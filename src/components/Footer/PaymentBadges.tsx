import { AmexIcon, MastercardIcon, RuPayIcon, UpiIcon, VisaIcon } from '@/components/icons/payments'

const badges = [
  { label: 'Visa', Icon: VisaIcon },
  { label: 'Mastercard', Icon: MastercardIcon },
  { label: 'RuPay', Icon: RuPayIcon },
  { label: 'UPI', Icon: UpiIcon },
  { label: 'American Express', Icon: AmexIcon },
]

export function PaymentBadges() {
  return (
    <div className="flex items-center gap-1.5" role="list" aria-label="Accepted payment methods">
      {badges.map(({ label, Icon }) => (
        <span key={label} role="listitem" aria-label={label} className="block h-6 w-10">
          <Icon className="h-full w-full" />
        </span>
      ))}
    </div>
  )
}
