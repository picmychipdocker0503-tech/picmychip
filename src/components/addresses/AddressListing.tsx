'use client'

import React, { useState } from 'react'
import { ChevronRight, Trash2 } from 'lucide-react'
import { useAddresses } from '@payloadcms/plugin-ecommerce/client/react'
import { formatAddressLine } from '@/components/addresses/AddressItem'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreateAddressModal } from '@/components/addresses/CreateAddressModal'

export const AddressListing: React.FC = () => {
  const { addresses, updateAddress } = useAddresses()
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // isActive defaults true — deactivated addresses are kept for historical
  // order snapshots (see the addresses collection field description) but
  // must not show up in the customer's own address book.
  const visibleAddresses = (addresses || []).filter((address) => address.isActive !== false)

  if (visibleAddresses.length === 0) {
    return <p className="text-muted-foreground text-sm">No addresses found.</p>
  }

  const handleDelete = async (addressID: number) => {
    if (!window.confirm('Delete this address?')) return
    setDeletingId(addressID)
    try {
      await updateAddress(addressID, { isActive: false })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <ul className="flex flex-col divide-y">
      {visibleAddresses.map((address) => {
        const isDefault = Boolean(address.isDefaultBilling || address.isDefaultShipping)

        return (
          <li key={address.id} className="flex items-center gap-2 py-1">
            <CreateAddressModal
              addressID={address.id}
              initialData={address}
              trigger={
                <button
                  type="button"
                  className="flex items-center gap-3 w-full text-left cursor-pointer py-3 hover:bg-accent/40 rounded-md -mx-2 px-2 transition-colors"
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
            <Button
              aria-label="Delete address"
              disabled={deletingId === address.id}
              onClick={() => address.id && handleDelete(address.id)}
              size="icon"
              type="button"
              variant="outline"
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        )
      })}
    </ul>
  )
}
