'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { useAddresses } from '@payloadcms/plugin-ecommerce/client/react'
import { defaultCountries as supportedCountries } from '@payloadcms/plugin-ecommerce/client/react'
import { Address, Config } from '@/payload-types'
import { SearchableSelect } from '@/components/ui/searchable-select'

import { INDIAN_STATES, resolveIndianState, resolveStateByGstin } from '@/lib/indianStates'
import {
  fetchDistricts,
  fetchOffices,
  findStateSlug,
  type PincodeApiDistrict,
  type PincodeApiOffice,
} from '@/lib/indiaPincodeApi'
import { titles } from './constants'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { deepMergeSimple } from 'payload/shared'
import { FloatingField, floatingFieldInputClassName } from '@/components/forms/FloatingField'
import { useAuth } from '@/providers/Auth'

type AddressFormValues = {
  title?: string | null
  firstName?: string | null
  lastName?: string | null
  company?: string | null
  email?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
  country?: string | null
  phone?: string | null
  /** Not part of the Address collection — carried through to the parent (see CheckoutPage) for the order's GST invoice. */
  gstin?: string | null
  /** Local-only: maps to both isDefaultBilling and isDefaultShipping on submit — see onSubmit. */
  isDefaultAddress?: boolean
}

type Props = {
  addressID?: Config['db']['defaultIDType']
  initialData?: Partial<Omit<Address, 'country' | 'id' | 'updatedAt' | 'createdAt'>> & { country?: string }
  callback?: (data: Partial<Address>) => void
  /**
   * If true, the form will not submit to the API.
   */
  skipSubmission?: boolean
  /** Renders a Cancel button next to Save that calls this instead of submitting. */
  onCancel?: () => void
}

const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/

export const AddressForm: React.FC<Props> = ({
  addressID,
  initialData,
  callback,
  skipSubmission,
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<AddressFormValues>({
    defaultValues: {
      country: 'IN',
      ...initialData,
      isDefaultAddress: Boolean(initialData?.isDefaultBilling || initialData?.isDefaultShipping),
    },
  })

  const { createAddress, updateAddress } = useAddresses()
  const { user } = useAuth()

  // Defaults the address's email to the account's login email so it's never
  // left blank — editable below for the (less common) case where order
  // updates for this specific address should go to someone else, e.g. a
  // different contact at a business address. Only fires when this address
  // has no email of its own yet (a brand-new address, no initialData.email)
  // and never overwrites something the user already typed.
  useEffect(() => {
    if (!initialData?.email && user?.email && !watch('email')) {
      setValue('email', user.email)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email])

  const stateName = watch('state')
  const [districts, setDistricts] = useState<PincodeApiDistrict[]>([])
  const [offices, setOffices] = useState<PincodeApiOffice[]>([])
  const [selectedDistrictSlug, setSelectedDistrictSlug] = useState('')
  const [selectedCity, setSelectedCity] = useState(initialData?.city || '')
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [loadingOffices, setLoadingOffices] = useState(false)
  // Tracks the actual value seen last, not "has this run before" — a plain
  // has-it-run-once boolean breaks under React Strict Mode's dev-only
  // double-invocation of effects on mount: the first pass flips it, so the
  // second pass (same stateName, nothing really changed) would wrongly read
  // "this is a real state change" and wipe the city/postalCode this effect
  // had just restored. Comparing against the previous value instead means
  // the second pass sees an unchanged value and correctly no-ops.
  const previousStateNameRef = useRef<string | undefined>(undefined)
  // Set by handlePostalCodeLookup right before it changes the district — the
  // District -> City effect below is the *only* place that sets `offices`
  // (a live pincode lookup used to also set it directly, racing this same
  // effect's own redundant re-fetch for the same district and losing
  // unpredictably). Consulted once that effect's own fetch resolves.
  const pendingPincodeMatchRef = useRef<string | null>(null)

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

    const isRealStateChange =
      previousStateNameRef.current !== undefined && previousStateNameRef.current !== stateName
    const keepExistingSelection = !isRealStateChange
    previousStateNameRef.current = stateName

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
      .then(async (slug) => {
        if (!slug) {
          if (!cancelled) setDistricts([])
          return
        }
        const districtList = await fetchDistricts(slug)
        if (cancelled) return
        // Set the district options before ever pointing `selectedDistrictSlug`
        // at one of them (below) — the District <Select> is controlled by
        // that slug, and Radix resets a controlled value that doesn't match
        // any of its current options back to empty. Setting the list first
        // means a match found below always lands on a Select that already
        // recognizes it.
        setDistricts(districtList)

        // Editing an existing address: city/pincode are already on file, but
        // the Address collection has no district field to restore, so the
        // District select (and, disabled behind it, City) would otherwise
        // stay empty forever — there's no reverse pincode/city -> district
        // lookup in this API, so every district's office list is checked for
        // a match instead. One-time cost on first load only, never on a
        // manual state change.
        const existingCity = initialData?.city
        const existingPostalCode = initialData?.postalCode
        if (keepExistingSelection && !selectedDistrictSlug && (existingCity || existingPostalCode)) {
          const matches = await Promise.all(
            districtList.map(async (district) => ({
              district,
              offices: await fetchOffices(slug, district.slug).catch(() => []),
            })),
          )
          const found = matches.find(({ offices }) =>
            offices.some(
              (office) =>
                (existingPostalCode && office.pincode === existingPostalCode) ||
                (existingCity && office.officeName === existingCity),
            ),
          )
          if (found && !cancelled) setSelectedDistrictSlug(found.district.slug)
        }
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
        if (cancelled) return

        // A pincode lookup just landed us on this district — narrow the
        // City options down to only the offices that actually carry that
        // pincode (a pincode commonly maps to several named offices; showing
        // the district's full, mostly-unrelated list would bury them),
        // and auto-select the first one as a convenient default.
        const pendingPincode = pendingPincodeMatchRef.current
        if (pendingPincode) {
          pendingPincodeMatchRef.current = null
          const matchingOffices = result.filter((office) => office.pincode === pendingPincode)
          if (matchingOffices.length > 0) {
            setOffices(matchingOffices)
            setSelectedCity(matchingOffices[0].officeName)
            setValue('city', matchingOffices[0].officeName, { shouldValidate: true })
            return
          }
        }

        setOffices(result)
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

  // Reverse direction of the State -> District -> City cascade above: typing
  // a complete pincode looks it up via India Post's own official pincode API
  // (the one source that actually goes pincode -> state/district, unlike the
  // static dataset the forward cascade uses) and auto-fills State, then finds
  // the matching district/office in that same static dataset so the selected
  // city stays a value the District/City selects actually recognize.
  const handlePostalCodeLookup = useCallback(
    async (pincode: string) => {
      if (!/^[0-9]{6}$/.test(pincode)) return

      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`)
        if (!res.ok) return
        const data = (await res.json()) as { PostOffice?: { State?: string }[] }[]
        const postOffice = data?.[0]?.PostOffice?.[0]
        const matchedState = resolveIndianState(postOffice?.State)
        if (!matchedState) return

        // Pre-seed the "previous state" tracker to this value before setValue
        // triggers the State -> Districts effect above — otherwise that
        // effect would treat this as a manual state change and reset the
        // postalCode/city this lookup is in the middle of filling in.
        previousStateNameRef.current = matchedState.name
        setValue('state', matchedState.name, { shouldValidate: true })
        // Force-reset first, even if the target district turns out to be the
        // one already selected — otherwise setSelectedDistrictSlug below
        // wouldn't register as a change and the District -> City effect
        // (which actually loads/filters the offices) would never re-fire.
        setSelectedDistrictSlug('')
        setSelectedCity('')
        setOffices([])

        const stateSlug = await findStateSlug(matchedState.name)
        if (!stateSlug) return

        const districtList = await fetchDistricts(stateSlug)
        setDistricts(districtList)

        const matches = await Promise.all(
          districtList.map(async (district) => ({
            district,
            offices: await fetchOffices(stateSlug, district.slug).catch(() => []),
          })),
        )
        const found = matches.find(({ offices }) => offices.some((office) => office.pincode === pincode))
        if (!found) return

        pendingPincodeMatchRef.current = pincode
        setSelectedDistrictSlug(found.district.slug)
      } catch {
        // Silent — pincode auto-fill is a convenience; the user can still pick State/District/City manually.
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
      const { isDefaultAddress, ...rest } = data
      const newData = deepMergeSimple(initialData || {}, {
        ...rest,
        isDefaultBilling: Boolean(isDefaultAddress),
        isDefaultShipping: Boolean(isDefaultAddress),
      })

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
      <div className="flex flex-col gap-3 mb-6">
        <FloatingField label="Country/region" htmlFor="country" required error={errors.country?.message}>
          <input type="hidden" {...register('country', { required: 'Country is required.' })} />
          <SearchableSelect
            id="country"
            className={floatingFieldInputClassName}
            options={countryOptions}
            value={watch('country') || 'IN'}
            onValueChange={(value) => setValue('country', value, { shouldValidate: true })}
            placeholder="Country"
            searchPlaceholder="Search countries…"
          />
        </FloatingField>

        <div className="flex gap-3">
          <FloatingField label="Title" htmlFor="title" className="max-w-28 shrink-0">
            <input type="hidden" {...register('title')} />
            <SearchableSelect
              id="title"
              className={floatingFieldInputClassName}
              options={titles.map((title) => ({ value: title, label: title }))}
              value={watch('title') || undefined}
              onValueChange={(value) => setValue('title', value, { shouldValidate: true })}
              placeholder="Title"
            />
          </FloatingField>

          <FloatingField label="First name" htmlFor="firstName" required error={errors.firstName?.message}>
            <Input
              id="firstName"
              autoComplete="given-name"
              className={floatingFieldInputClassName}
              {...register('firstName', { required: 'First name is required.' })}
            />
          </FloatingField>

          <FloatingField label="Last name" htmlFor="lastName" required error={errors.lastName?.message}>
            <Input
              autoComplete="family-name"
              id="lastName"
              className={floatingFieldInputClassName}
              {...register('lastName', { required: 'Last name is required.' })}
            />
          </FloatingField>
        </div>

        <FloatingField label="Company (optional)" htmlFor="company">
          <Input
            id="company"
            autoComplete="organization"
            className={floatingFieldInputClassName}
            {...register('company')}
          />
        </FloatingField>

        <div>
          <FloatingField label="Email" htmlFor="email" required error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              className={floatingFieldInputClassName}
              {...register('email', { required: 'Email is required.' })}
            />
          </FloatingField>
          <p className="text-muted-foreground text-xs mt-1">
            Order updates for this address go here — defaults to your account email, editable if this address has a different contact.
          </p>
        </div>

        <div>
          <FloatingField label="GSTIN (optional)" htmlFor="gstin">
            <Input
              id="gstin"
              maxLength={15}
              className={floatingFieldInputClassName}
              {...register('gstin')}
              onChange={(e) => handleGstinChange(e.target.value)}
            />
          </FloatingField>
          <p className="text-muted-foreground text-xs mt-1">State is auto-selected once a valid GSTIN is entered.</p>
        </div>

        <FloatingField label="Address" htmlFor="addressLine1" required error={errors.addressLine1?.message}>
          <Input
            id="addressLine1"
            autoComplete="address-line1"
            className={floatingFieldInputClassName}
            {...register('addressLine1', { required: 'Address line 1 is required.' })}
          />
        </FloatingField>

        <FloatingField label="Apartment, suite, etc (optional)" htmlFor="addressLine2">
          <Input
            id="addressLine2"
            autoComplete="address-line2"
            className={floatingFieldInputClassName}
            {...register('addressLine2')}
          />
        </FloatingField>

        <div className="flex flex-col md:flex-row gap-3">
          <FloatingField label="State" htmlFor="state" required error={errors.state?.message} className="md:w-1/3">
            <input type="hidden" {...register('state')} />
            <SearchableSelect
              id="state"
              className={floatingFieldInputClassName}
              options={INDIAN_STATES.map((state) => ({ value: state.name, label: state.name }))}
              value={stateName || undefined}
              onValueChange={(value) => setValue('state', value, { shouldValidate: true })}
              placeholder="State"
              searchPlaceholder="Search states…"
            />
          </FloatingField>

          <FloatingField label="District" htmlFor="district" className="md:w-1/3">
            <SearchableSelect
              id="district"
              className={floatingFieldInputClassName}
              disabled={!stateName || loadingDistricts}
              options={sortedDistricts.map((district) => ({ value: district.slug, label: district.name }))}
              value={selectedDistrictSlug || undefined}
              onValueChange={setSelectedDistrictSlug}
              placeholder={!stateName ? 'Select a state first' : loadingDistricts ? 'Loading…' : 'District'}
              searchPlaceholder="Search districts…"
            />
          </FloatingField>

          <FloatingField label="City" htmlFor="city" required error={errors.city?.message} className="md:w-1/3">
            <input type="hidden" {...register('city', { required: 'City is required.' })} />
            <SearchableSelect
              id="city"
              className={floatingFieldInputClassName}
              disabled={!selectedDistrictSlug || loadingOffices}
              options={sortedCityOptions}
              value={selectedCity || undefined}
              onValueChange={handleCitySelect}
              placeholder={!selectedDistrictSlug ? 'Select a district first' : loadingOffices ? 'Loading…' : 'City'}
              searchPlaceholder="Search cities…"
            />
          </FloatingField>
        </div>

        <div>
          <FloatingField
            label="PIN code"
            htmlFor="postalCode"
            required
            error={errors.postalCode?.message}
            className="md:w-1/3"
          >
            <Input
              id="postalCode"
              maxLength={6}
              className={floatingFieldInputClassName}
              {...register('postalCode', { required: 'Postal code is required.' })}
              onChange={(e) => {
                const value = e.target.value
                setValue('postalCode', value, { shouldValidate: true })
                if (value.length === 6) void handlePostalCodeLookup(value)
              }}
            />
          </FloatingField>
          <p className="text-muted-foreground text-xs mt-1">
            Auto-filled from the selected city, or type a pincode to auto-fill State/District/City.
          </p>
        </div>

        <FloatingField label="Phone" htmlFor="phone" error={errors.phone?.message}>
          <Input
            type="tel"
            id="phone"
            autoComplete="mobile tel"
            className={floatingFieldInputClassName}
            {...register('phone')}
          />
        </FloatingField>

        <label className="flex items-center gap-2 text-sm cursor-pointer select-none pt-1">
          <Checkbox
            checked={Boolean(watch('isDefaultAddress'))}
            onCheckedChange={(checked) => setValue('isDefaultAddress', checked === true)}
          />
          This is my default address
        </label>
      </div>

      <div className="flex justify-end gap-4 items-center">
        {onCancel && (
          <Button type="button" variant="link" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="outline">
          Save
        </Button>
      </div>
    </form>
  )
}
