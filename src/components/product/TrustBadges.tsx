import { LockIcon, RotateCcwIcon, ShieldCheckIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const BADGES = [
  { icon: LockIcon, label: 'Secure Payment', href: undefined },
  { icon: ShieldCheckIcon, label: 'Spec-Verified Parts', href: undefined },
  { icon: RotateCcwIcon, label: '30-Day Returns', href: '/terms' },
]

export const TrustBadges: React.FC = () => (
  <ul className="text-muted-foreground flex flex-wrap gap-x-5 gap-y-2 border-t pt-4 text-xs">
    {BADGES.map(({ icon: Icon, label, href }) => (
      <li className="flex items-center gap-1.5" key={label}>
        <Icon className="size-4" />
        {href ? (
          <Link className="hover:text-foreground hover:underline" href={href}>
            {label}
          </Link>
        ) : (
          label
        )}
      </li>
    ))}
  </ul>
)
