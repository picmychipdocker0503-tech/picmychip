'use client'

import React from 'react'
import { ChevronRight } from 'lucide-react'
import { useAddresses } from '@payloadcms/plugin-ecommerce/client/react'
import { formatAddressLine } from '@/components/addresses/AddressItem'
import { Badge } from '@/components/ui/badge'
import { CreateAddressModal } from '@/components/addresses/CreateAddressModal'

export const AddressListing: React.FC = () => {
  const { addresses } = useAddresses()

  if (!addresses || addresses.length === 0) {
    return <p className="text-muted-foreground text-sm">No addresses found.</p>
  }

  return (
    <ul className="flex flex-col divide-y">
      {addresses.map((address) => {
        const isDefault = Boolean(address.isDefaultBilling || address.isDefaultShipping)

        return (
          <li key={address.id}>
            <CreateAddressModal
              addressID={address.id}
              initialData={address}
              trigger={
                <button
                  type="button"
                  className="flex items-center gap-3 w-full text-left cursor-pointer py-4 hover:bg-accent/40 rounded-md -mx-2 px-2 transition-colors"
                >
                  <div className="grow">
                    <p className="font-medium flex items-center gap-2">
                      {address.firstName} {address.lastName}
                      {isDefault && (
                        <Badge variant="secondary" className="font-normal">
                          Default
                        </Badge>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">{formatAddressLine(address)}</p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                </button>
              }
            />
          </li>
        )
      })}
    </ul>
  )
}
