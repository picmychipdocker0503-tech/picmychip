'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
        if (!slug) return []
        const districtList = await fetchDistricts(slug)

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

        return districtList
      })
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
            maxLength={6}
            {...register('postalCode', { required: 'Postal code is required.' })}
            onChange={(e) => {
              const value = e.target.value
              setValue('postalCode', value, { shouldValidate: true })
              if (value.length === 6) void handlePostalCodeLookup(value)
            }}
          />
          <p className="text-muted-foreground text-xs">
            Auto-filled from the selected city, or type a pincode to auto-fill State/District/City.
          </p>
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
