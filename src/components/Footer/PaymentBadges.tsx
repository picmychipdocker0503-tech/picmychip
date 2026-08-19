import { AmexIcon, MastercardIcon, RuPayIcon, UpiIcon, VisaIcon } from '@/components/icons/payments'
import { getTranslations } from 'next-intl/server'

// Payment method brand names (Visa, Mastercard, ...) are trademarks, not UI
// copy — they stay the same in every locale, so they're not translation keys.
const badges = [
  { label: 'Visa', Icon: VisaIcon },
  { label: 'Mastercard', Icon: MastercardIcon },
  { label: 'RuPay', Icon: RuPayIcon },
  { label: 'UPI', Icon: UpiIcon },
  { label: 'American Express', Icon: AmexIcon },
]

export async function PaymentBadges() {
  const t = await getTranslations('footer')

  return (
    <div className="flex items-center gap-1.5" role="list" aria-label={t('paymentMethodsLabel')}>
      {badges.map(({ label, Icon }) => (
        <span key={label} role="listitem" aria-label={label} className="block h-6 w-10">
          <Icon className="h-full w-full" />
        </span>
      ))}
    </div>
  )
}
