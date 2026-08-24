'use client'

import React from 'react'
import { MapPin } from 'lucide-react'
import type { Address } from '@/payload-types'
import { Badge } from '@/components/ui/badge'
import { CreateAddressModal } from '@/components/addresses/CreateAddressModal'

type Props = {
  address: Partial<Omit<Address, 'country'>> & { country?: string } // Allow address to be partial and entirely optional as this is entirely for display purposes
  /**
   * Completely override the default actions
   */
  actions?: React.ReactNode
  /**
   * Insert elements before the actions
   */
  beforeActions?: React.ReactNode
  /**
   * Insert elements after the actions
   */
  afterActions?: React.ReactNode
  /**
   * Hide all actions
   */
  hideActions?: boolean
}

export const formatAddressLine = (address: Props['address']) =>
  [
    address.addressLine1,
    address.addressLine2,
    address.city,
    `${address.postalCode || ''} ${address.state || ''}`.trim(),
    address.country,
  ]
    .filter(Boolean)
    .join(', ')

export const AddressItem: React.FC<Props> = ({
  address,
  actions,
  hideActions = false,
  beforeActions,
  afterActions,
}) => {
  if (!address) {
    return null
  }

  const isDefault = Boolean(address.isDefaultBilling || address.isDefaultShipping)

  return (
    <div className="flex items-center gap-4">
      <div className="grow flex items-start gap-3">
        <MapPin className="size-5 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <p className="font-medium flex items-center gap-2">
            {address.title && <span>{address.title} </span>}
            {address.firstName} {address.lastName}
            {isDefault && (
              <Badge variant="secondary" className="font-normal">
                Default
              </Badge>
            )}
          </p>
          {address.company && <p className="text-sm text-muted-foreground">{address.company}</p>}
          <p className="text-sm text-muted-foreground">{formatAddressLine(address)}</p>
          {address.phone && <p className="text-sm text-muted-foreground">{address.phone}</p>}
        </div>
      </div>

      {!hideActions && address.id && (
        <div className="shrink flex flex-col gap-2">
          {actions ? (
            actions
          ) : (
            <>
              {beforeActions}
              <CreateAddressModal addressID={address.id} initialData={address} buttonText="Edit" />
              {afterActions}
            </>
          )}
        </div>
      )}
    </div>
  )
}
