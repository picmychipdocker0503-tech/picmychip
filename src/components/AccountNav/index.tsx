'use client'

import { Button } from '@/components/ui/button'
import { LogOutIcon, MapPinIcon, PackageIcon, SlidersIcon } from '@/components/icons/AccountNavIcons'
import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Props = {
  className?: string
}

export const AccountNav: React.FC<Props> = ({ className }) => {
  const pathname = usePathname()

  return (
    <div className={clsx(className)}>
      <ul className="flex flex-col gap-2">
        <li>
          <Button asChild variant="link">
            <Link
              href="/account"
              className={clsx('text-primary/50 hover:text-primary flex items-center gap-2 hover:no-underline', {
                'text-primary': pathname === '/account',
              })}
            >
              <SlidersIcon />
              Account settings
            </Link>
          </Button>
        </li>

        <li>
          <Button asChild variant="link">
            <Link
              href="/account/addresses"
              className={clsx('text-primary/50 hover:text-primary flex items-center gap-2 hover:no-underline', {
                'text-primary': pathname === '/account/addresses',
              })}
            >
              <MapPinIcon />
              Addresses
            </Link>
          </Button>
        </li>

        <li>
          <Button
            asChild
            variant="link"
            className={clsx('text-primary/50 hover:text-primary flex items-center gap-2 hover:no-underline', {
              'text-primary': pathname === '/orders' || pathname.includes('/orders'),
            })}
          >
            <Link href="/orders">
              <PackageIcon />
              Orders
            </Link>
          </Button>
        </li>
      </ul>

      <hr className="w-full border-white/5" />

      <Button
        asChild
        variant="link"
        className={clsx('text-primary/50 hover:text-primary flex items-center gap-2 hover:no-underline', {
          'text-primary': pathname === '/logout',
        })}
      >
        <Link href="/logout">
          <LogOutIcon />
          Log out
        </Link>
      </Button>
    </div>
  )
}
