'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAddresses } from '@payloadcms/plugin-ecommerce/client/react'
import { defaultCountries as supportedCountries } from '@payloadcms/plugin-ecommerce/client/react'
import { Address, Config } from '@/payload-types'
import { SearchableSelect } from '@/components/ui/searchable-select'

import { INDIAN_STATES, resolveStateByGstin } from '@/lib/indianStates'
import {
  fetchDistricts,
  fetchOffices,
  findStateSlug,
  type PincodeApiDistrict,
  type PincodeApiOffice,
} from '@/lib/indiaPincodeApi'
import { titles } from './constants'
import { Button } from '@/components/ui/button'
import { deepMergeSimple } from 'payload/shared'
import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'

type AddressFormValues = {
  title?: string | null
  firstName?: string | null
  lastName?: string | null
  company?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
  country?: string | null
  phone?: string | null
  /** Not part of the Address collection — carried through to the parent (see CheckoutPage) for the order's GST invoice. */
  gstin?: string | null
}

type Props = {
  addressID?: Config['db']['defaultIDType']
  initialData?: Omit<Address, 'country' | 'id' | 'updatedAt' | 'createdAt'> & { country?: string }
  callback?: (data: Partial<Address>) => void
  /**
   * If true, the form will not submit to the API.
   */
  skipSubmission?: boolean
}

const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/

export const AddressForm: React.FC<Props> = ({
  addressID,
  initialData,
  callback,
  skipSubmission,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<AddressFormValues>({
    defaultValues: { country: 'IN', ...initialData },
  })

  const { createAddress, updateAddress } = useAddresses()

  const stateName = watch('state')
  const [districts, setDistricts] = useState<PincodeApiDistrict[]>([])
  const [offices, setOffices] = useState<PincodeApiOffice[]>([])
  const [selectedDistrictSlug, setSelectedDistrictSlug] = useState('')
  const [selectedCity, setSelectedCity] = useState(initialData?.city || '')
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [loadingOffices, setLoadingOffices] = useState(false)
  const isFirstStateLoad = useRef(true)

  const sortedDistricts = React.useMemo(
    () => [...districts].sort((a, b) => a.name.localeCompare(b.name)),
    [districts],
  )
  const sortedCityOptions = React.useMemo(
    () =>
      Array.from(new Set(offices.map((o) => o.officeName)))
        .sort((a, b) => a.localeCompare(b))
        .map((officeName) => ({ value: officeName, label: officeName })),
    [offices],
  )
  const countryOptions = React.useMemo(
    () =>
      supportedCountries.map((country) => {
        const value = typeof country === 'string' ? country : country.value
        const label =
          typeof country === 'string' ? country : typeof country.label === 'string' ? country.label : value
        return { value, label }
      }),
    [],
  )

  // Cascade step 1: State -> Districts. Re-runs whenever the state changes,
  // whether by direct selection or auto-detected from a GSTIN below.
  useEffect(() => {
    if (!stateName) {
      setDistricts([])
      return
    }

    const keepExistingSelection = isFirstStateLoad.current
    isFirstStateLoad.current = false

    if (!keepExistingSelection) {
      setSelectedDistrictSlug('')
      setOffices([])
      setSelectedCity('')
      setValue('city', '')
      setValue('postalCode', '')
    }

    let cancelled = false
    setLoadingDistricts(true)
    findStateSlug(stateName)
      .then((slug) => (slug ? fetchDistricts(slug) : Promise.resolve([])))
      .then((result) => {
        if (!cancelled) setDistricts(result)
      })
      .catch(() => {
        if (!cancelled) setDistricts([])
      })
      .finally(() => {
        if (!cancelled) setLoadingDistricts(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateName])

  // Cascade step 2: District -> City/Pincode options.
  useEffect(() => {
    if (!stateName || !selectedDistrictSlug) {
      setOffices([])
      return
    }

    let cancelled = false
    setLoadingOffices(true)
    findStateSlug(stateName)
      .then((slug) => (slug ? fetchOffices(slug, selectedDistrictSlug) : Promise.resolve([])))
      .then((result) => {
        if (!cancelled) setOffices(result)
      })
      .catch(() => {
        if (!cancelled) setOffices([])
      })
      .finally(() => {
        if (!cancelled) setLoadingOffices(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateName, selectedDistrictSlug])

  const handleGstinChange = useCallback(
    (value: string) => {
      const upper = value.toUpperCase()
      setValue('gstin', upper)

      if (upper.length === 15 && GSTIN_PATTERN.test(upper)) {
        const matchedState = resolveStateByGstin(upper)
        if (matchedState) setValue('state', matchedState.name, { shouldValidate: true })
      }
    },
    [setValue],
  )

  const handleCitySelect = useCallback(
    (officeName: string) => {
      setSelectedCity(officeName)
      setValue('city', officeName, { shouldValidate: true })
      const office = offices.find((o) => o.officeName === officeName)
      if (office?.pincode) setValue('postalCode', office.pincode, { shouldValidate: true })
    },
    [offices, setValue],
  )

  const onSubmit = useCallback(
    async (data: AddressFormValues) => {
      const newData = deepMergeSimple(initialData || {}, data)

      if (!skipSubmission) {
        if (addressID) {
          await updateAddress(addressID, newData)
        } else {
          await createAddress(newData)
        }
      }

      if (callback) {
        callback(newData)
      }
    },
    [initialData, skipSubmission, callback, addressID, updateAddress, createAddress],
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <FormItem className="shrink">
            <Label htmlFor="title">Title</Label>
            <input type="hidden" {...register('title')} />
            <SearchableSelect
              id="title"
              options={titles.map((title) => ({ value: title, label: title }))}
              value={watch('title') || undefined}
              onValueChange={(value) => setValue('title', value, { shouldValidate: true })}
              placeholder="Title"
            />
            {errors.title && <FormError message={errors.title.message} />}
          </FormItem>

          <FormItem>
            <Label htmlFor="firstName">First name*</Label>
            <Input
              id="firstName"
              autoComplete="given-name"
              {...register('firstName', { required: 'First name is required.' })}
            />
            {errors.firstName && <FormError message={errors.firstName.message} />}
          </FormItem>

          <FormItem>
            <Label htmlFor="lastName">Last name*</Label>
            <Input
              autoComplete="family-name"
              id="lastName"
              {...register('lastName', { required: 'Last name is required.' })}
            />
            {errors.lastName && <FormError message={errors.lastName.message} />}
          </FormItem>
        </div>

        <FormItem>
          <Label htmlFor="phone">Phone</Label>
          <Input type="tel" id="phone" autoComplete="mobile tel" {...register('phone')} />
          {errors.phone && <FormError message={errors.phone.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="company">Company</Label>
          <Input id="company" autoComplete="organization" {...register('company')} />
          {errors.company && <FormError message={errors.company.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="gstin">GSTIN (optional)</Label>
          <Input
            id="gstin"
            maxLength={15}
            placeholder="For a GST tax invoice"
            {...register('gstin')}
            onChange={(e) => handleGstinChange(e.target.value)}
          />
          <p className="text-muted-foreground text-xs">State is auto-selected once a valid GSTIN is entered.</p>
        </FormItem>

        <FormItem>
          <Label htmlFor="addressLine1">Address line 1*</Label>
          <Input
            id="addressLine1"
            autoComplete="address-line1"
            {...register('addressLine1', { required: 'Address line 1 is required.' })}
          />
          {errors.addressLine1 && <FormError message={errors.addressLine1.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="addressLine2">Address line 2</Label>
          <Input id="addressLine2" autoComplete="address-line2" {...register('addressLine2')} />
          {errors.addressLine2 && <FormError message={errors.addressLine2.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="state">State</Label>
          <input type="hidden" {...register('state')} />
          <SearchableSelect
            id="state"
            className="w-full"
            options={INDIAN_STATES.map((state) => ({ value: state.name, label: state.name }))}
            value={stateName || undefined}
            onValueChange={(value) => setValue('state', value, { shouldValidate: true })}
            placeholder="State"
            searchPlaceholder="Search states…"
          />
          {errors.state && <FormError message={errors.state.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="district">District</Label>
          <SearchableSelect
            id="district"
            className="w-full"
            disabled={!stateName || loadingDistricts}
            options={sortedDistricts.map((district) => ({ value: district.slug, label: district.name }))}
            value={selectedDistrictSlug || undefined}
            onValueChange={setSelectedDistrictSlug}
            placeholder={!stateName ? 'Select a state first' : loadingDistricts ? 'Loading…' : 'District'}
            searchPlaceholder="Search districts…"
          />
        </FormItem>

        <FormItem>
          <Label htmlFor="city">City*</Label>
          <input type="hidden" {...register('city', { required: 'City is required.' })} />
          <SearchableSelect
            id="city"
            className="w-full"
            disabled={!selectedDistrictSlug || loadingOffices}
            options={sortedCityOptions}
            value={selectedCity || undefined}
            onValueChange={handleCitySelect}
            placeholder={!selectedDistrictSlug ? 'Select a district first' : loadingOffices ? 'Loading…' : 'City'}
            searchPlaceholder="Search cities…"
          />
          {errors.city && <FormError message={errors.city.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="postalCode">Zip Code*</Label>
          <Input
            id="postalCode"
            {...register('postalCode', { required: 'Postal code is required.' })}
          />
          <p className="text-muted-foreground text-xs">Auto-filled from the selected city — editable if needed.</p>
          {errors.postalCode && <FormError message={errors.postalCode.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="country">Country*</Label>
          <input type="hidden" {...register('country', { required: 'Country is required.' })} />
          <SearchableSelect
            id="country"
            className="w-full"
            options={countryOptions}
            value={watch('country') || 'IN'}
            onValueChange={(value) => setValue('country', value, { shouldValidate: true })}
            placeholder="Country"
            searchPlaceholder="Search countries…"
          />
          {errors.country && <FormError message={errors.country.message} />}
        </FormItem>
      </div>

      <Button type="submit">Submit</Button>
    </form>
  )
}
