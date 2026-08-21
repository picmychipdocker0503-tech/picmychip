'use client'

import { Media } from '@/components/Media'
import { Message } from '@/components/Message'
import { Price } from '@/components/Price'
import { SecureCheckoutBadge } from '@/components/SecureCheckoutBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import { useTranslations } from 'next-intl'
import posthog from 'posthog-js'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'

import { redirectToPayU, type PayuRedirectFields } from '@/lib/redirectToPayU'
import { useAddresses, useCart, usePayments } from '@payloadcms/plugin-ecommerce/client/react'
import { CheckoutAddresses } from '@/components/checkout/CheckoutAddresses'
import { DeliveryEstimate } from '@/components/checkout/DeliveryEstimate'
import { CreateAddressModal } from '@/components/addresses/CreateAddressModal'
import { getClientSideURL } from '@/utilities/getURL'
import { useFeatureFlags } from '@/lib/useFeatureFlags'
import { checkoutShippingMethods, type CheckoutShippingMethodId } from '@/lib/checkoutShipping'
import { computeOrderTaxAddOn, type TaxLineItem } from '@/lib/taxCalculation'
import { Address, Product, Variant } from '@/payload-types'

type GalleryItem = NonNullable<Product['gallery']>[number]
type VariantOptionItem = NonNullable<Variant['options']>[number]
import { Checkbox } from '@/components/ui/checkbox'
import { AddressItem } from '@/components/addresses/AddressItem'
import { FormItem } from '@/components/forms/FormItem'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export const CheckoutPage: React.FC<{ businessState: string; defaultGstPercent: number }> = ({
  businessState,
  defaultGstPercent,
}) => {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('checkout')
  const tCart = useTranslations('cart')
  const { cart, clearCart, refreshCart } = useCart()
  const flags = useFeatureFlags()
  const [error, setError] = useState<null | string>(null)
  /**
   * State to manage the email input for guest checkout.
   */
  const [email, setEmail] = useState('')
  const [emailEditable, setEmailEditable] = useState(true)
  const [isInitiatingPayment, setIsInitiatingPayment] = useState(false)
  const { initiatePayment } = usePayments()
  const { addresses } = useAddresses()
  const [shippingAddress, setShippingAddress] = useState<Partial<Address>>()
  const [billingAddress, setBillingAddress] = useState<Partial<Address>>()
  const [billingAddressSameAsShipping, setBillingAddressSameAsShipping] = useState(true)
  const [isProcessingPayment, setProcessingPayment] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('card')
  const [checkoutStep, setCheckoutStep] = useState<'address' | 'dispatch' | 'review'>('address')
  const [shippingMethodId, setShippingMethodId] = useState<CheckoutShippingMethodId | null>(null)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  // Derived, not separately captured — GSTIN/company come from the billing
  // address itself (see AddressForm's gstin field and the existing company field).
  const businessDetails =
    billingAddress?.gstin || billingAddress?.company
      ? { companyName: billingAddress?.company || undefined, gstin: billingAddress?.gstin || undefined }
      : undefined
  const [couponInput, setCouponInput] = useState('')
  const [giftCardInput, setGiftCardInput] = useState('')
  const [couponError, setCouponError] = useState<string | null>(null)
  const [giftCardError, setGiftCardError] = useState<string | null>(null)
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false)

  const cartIsEmpty = !cart || !cart.items || !cart.items.length
  const subtotalAfterDiscounts = cart?.subtotal ?? 0
  const selectedShippingMethod = checkoutShippingMethods.find((method) => method.id === shippingMethodId)
  const shippingAmount = selectedShippingMethod?.amount ?? 0
  // PayU only settles in INR — USD carts fall back to Cash on Delivery.
  const cardPaymentAvailable = cart?.currency === 'INR'

  // cart.subtotal (and each product's priceInINR) is GST-exclusive — GST is
  // added on top here for display only; the server independently computes
  // and charges the authoritative amount (initiatePayment.ts / place-order).
  const customerState = (billingAddressSameAsShipping ? billingAddress : shippingAddress)?.state
  const taxBreakdown =
    !cartIsEmpty && cart?.currency === 'INR'
      ? computeOrderTaxAddOn({
          items: [
            ...(cart.items || []).reduce<TaxLineItem[]>((acc, item) => {
            if (typeof item.product !== 'object' || !item.product || !item.quantity) return acc
            const unitPrice =
              item.variant && typeof item.variant === 'object'
                ? (item.variant.priceInINR ?? item.product.priceInINR ?? 0)
                : (item.product.priceInINR ?? 0)
            acc.push({
              gstPercent: item.product.gstPercent ?? defaultGstPercent,
              nominal: unitPrice * item.quantity,
            })
            return acc
            }, []),
            ...(shippingAmount > 0 ? [{ gstPercent: defaultGstPercent, nominal: shippingAmount }] : []),
          ],
          amount: subtotalAfterDiscounts + shippingAmount,
          defaultGstPercent,
          businessState,
          customerState,
        })
      : null
  const checkoutTotal = taxBreakdown
    ? subtotalAfterDiscounts + shippingAmount + taxBreakdown.totalTax
    : (cart?.subtotal ?? 0) + shippingAmount
  const fullyCoveredByGiftCard = !cartIsEmpty && checkoutTotal <= 0

  const applyDiscount = useCallback(
    async (args: { couponCode?: string; giftCardCode?: string; remove?: 'coupon' | 'gift-card' }) => {
      if (!cart?.id) return

      setIsApplyingDiscount(true)
      if (args.couponCode || args.remove === 'coupon') setCouponError(null)
      if (args.giftCardCode || args.remove === 'gift-card') setGiftCardError(null)

      try {
        const res = await fetch(`${getClientSideURL()}/api/cart/discount`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ cartId: cart.id, ...args }),
        })
        const data = await res.json()

        if (!res.ok) {
          if (args.couponCode) setCouponError(data.error)
          if (args.giftCardCode) setGiftCardError(data.error)
          return
        }

        if (args.couponCode) setCouponInput('')
        if (args.giftCardCode) setGiftCardInput('')
        await refreshCart()
      } catch {
        if (args.couponCode) setCouponError(tCart('genericError'))
        if (args.giftCardCode) setGiftCardError(tCart('genericError'))
      } finally {
        setIsApplyingDiscount(false)
      }
    },
    [cart?.id, refreshCart, tCart],
  )

  const placeDirectOrder = useCallback(async () => {
    if (!cart?.id) return

    setIsPlacingOrder(true)
    setProcessingPayment(true)

    try {
      const res = await fetch(`${getClientSideURL()}/checkout/place-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          cartId: cart.id,
          email: email || user?.email,
          shippingAddress: billingAddressSameAsShipping ? billingAddress : shippingAddress,
          billingAddress,
          businessDetails,
          shippingMethod: shippingMethodId,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || t('couldNotPlaceOrder'))
        setIsPlacingOrder(false)
        setProcessingPayment(false)
        return
      }

      clearCart()
      router.push(`/orders/${data.orderID}${email ? `?email=${email}&accessToken=${data.accessToken}` : ''}`)
    } catch {
      setError(t('couldNotPlaceOrderRetry'))
      setIsPlacingOrder(false)
      setProcessingPayment(false)
    }
  }, [
    cart?.id,
    email,
    user?.email,
    billingAddress,
    billingAddressSameAsShipping,
    shippingAddress,
    shippingMethodId,
    clearCart,
    router,
    t,
  ])

  const canGoToPayment = Boolean(
    (email || user) && billingAddress && (billingAddressSameAsShipping || shippingAddress) && shippingMethodId,
  )
  const canGoToDispatch = Boolean((email || user) && billingAddress && (billingAddressSameAsShipping || shippingAddress))

  // On initial load wait for addresses to be loaded and check to see if we can prefill a default one
  useEffect(() => {
    if (!shippingAddress) {
      if (addresses && addresses.length > 0) {
        const defaultAddress = addresses[0]
        if (defaultAddress) {
          setBillingAddress(defaultAddress)
        }
      }
    }
  }, [addresses])

  useEffect(() => {
    return () => {
      setShippingAddress(undefined)
      setBillingAddress(undefined)
      setBillingAddressSameAsShipping(true)
      setEmail('')
      setEmailEditable(true)
    }
  }, [])

  useEffect(() => {
    if (!cardPaymentAvailable && flags.cashOnDelivery) {
      setPaymentMethod('cod')
    } else if (!flags.cashOnDelivery) {
      // Also corrects the case where this effect's own first run (before the
      // async flag fetch resolves) latched onto 'cod' via the optimistic
      // cashOnDelivery: true default in useFeatureFlags.
      setPaymentMethod('card')
    }
  }, [cardPaymentAvailable, flags.cashOnDelivery])

  // PayU redirects the browser back here with ?error=payment_failed if its callback
  // (src/payments/payu/endpoints/callback.ts) couldn't confirm the order.
  useEffect(() => {
    if (searchParams.get('error') === 'payment_failed') {
      setError(t('paymentFailed'))
    }
  }, [searchParams, t])

  const payWithPayu = useCallback(async () => {
    setIsInitiatingPayment(true)
    try {
      const paymentShippingAddress = {
        ...(billingAddressSameAsShipping ? billingAddress : shippingAddress),
        shippingMethod: shippingMethodId,
        shippingAmount: selectedShippingMethod?.amount,
      }

      const data = (await initiatePayment('payu', {
        additionalData: {
          ...(email ? { customerEmail: email } : {}),
          billingAddress,
          shippingAddress: paymentShippingAddress,
          shippingMethod: shippingMethodId,
          ...(businessDetails ? { businessDetails } : {}),
        },
      })) as unknown as PayuRedirectFields

      if (data) {
        posthog.capture('payment_submitted', { payment_provider: 'payu' })
        // PayU has no JS SDK — this navigates the browser away to PayU's hosted page.
        redirectToPayU(data)
      }
    } catch (error) {
      let errorData: { cause?: { code?: string } } = {}
      if (error instanceof Error) {
        try {
          errorData = JSON.parse(error.message) as { cause?: { code?: string } }
        } catch {
          errorData = {}
        }
      }
      let errorMessage = t('paymentInitError')

      if (errorData?.cause?.code === 'OutOfStock') {
        errorMessage = t('outOfStockError')
      }

      setError(errorMessage)
      toast.error(errorMessage)
      setIsInitiatingPayment(false)
    }
  }, [
    billingAddress,
    billingAddressSameAsShipping,
    businessDetails,
    email,
    initiatePayment,
    selectedShippingMethod?.amount,
    shippingAddress,
    shippingMethodId,
    t,
  ])

  if (cartIsEmpty && isProcessingPayment) {
    return (
      <div className="py-12 w-full items-center justify-center">
        <div className="prose dark:prose-invert text-center max-w-none self-center mb-8">
          <p>{t('processingPayment')}</p>
        </div>
        <LoadingSpinner />
      </div>
    )
  }

  if (cartIsEmpty) {
    return (
      <div className="prose dark:prose-invert py-12 w-full items-center">
        <p>{t('cartEmpty')}</p>
        <Link href="/search">{t('continueShopping')}</Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-stretch justify-stretch my-8 md:flex-row grow gap-10 md:gap-6 lg:gap-8">
      <div className="basis-full lg:basis-2/3 flex flex-col gap-8 justify-stretch">
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
          {[
            { id: 'address', label: 'Address' },
            { id: 'dispatch', label: 'Dispatch' },
            { id: 'review', label: 'Review Order & Make Payment' },
          ].map((step, index, steps) => {
            const isActive = checkoutStep === step.id
            return (
              <React.Fragment key={step.id}>
                <button
                  className={`border-b px-2 py-2 ${
                    isActive ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'
                  }`}
                  onClick={() => {
                    if (step.id === 'dispatch' && !canGoToDispatch) return
                    if (step.id === 'review' && !canGoToPayment) return
                    setCheckoutStep(step.id as 'address' | 'dispatch' | 'review')
                  }}
                  type="button"
                >
                  {step.label}
                </button>
                {index < steps.length - 1 && <span className="text-muted-foreground">----</span>}
              </React.Fragment>
            )
          })}
        </div>

        <h2 className="font-medium text-3xl">{t('contact.heading')}</h2>
        {!user && (
          <div className=" bg-accent dark:bg-black rounded-lg p-4 w-full flex items-center">
            <div className="prose dark:prose-invert">
              <Button asChild className="no-underline text-inherit" variant="outline">
                <Link href="/login">{t('contact.logIn')}</Link>
              </Button>
              <p className="mt-0">
                <span className="mx-2">{t('contact.or')}</span>
                <Link href="/create-account">{t('contact.createAccount')}</Link>
              </p>
            </div>
          </div>
        )}
        {user ? (
          <div className="bg-accent dark:bg-card rounded-lg p-4 ">
            <div>
              <p>{user.email}</p>{' '}
              <p>
                {t('contact.notYou')}{' '}
                <Link className="underline" href="/logout">
                  {t('contact.logOut')}
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-accent dark:bg-black rounded-lg p-4 ">
            <div>
              <p className="mb-4">{t('contact.guestEmailPrompt')}</p>

              <FormItem className="mb-6">
                <Label htmlFor="email">{t('contact.emailAddress')}</Label>
                <Input
                  disabled={!emailEditable}
                  id="email"
                  name="email"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                />
              </FormItem>

              <Button
                disabled={!email || !emailEditable}
                onClick={(e) => {
                  e.preventDefault()
                  setEmailEditable(false)
                }}
                variant="default"
              >
                {t('contact.continueAsGuest')}
              </Button>
            </div>
          </div>
        )}

        <h2 className="font-medium text-3xl">{t('address.heading')}</h2>

        {billingAddress ? (
          <div>
            <AddressItem
              actions={
                <Button
                  variant={'outline'}
                  disabled={isInitiatingPayment}
                  onClick={(e) => {
                    e.preventDefault()
                    setBillingAddress(undefined)
                  }}
                >
                  {tCart('remove')}
                </Button>
              }
              address={billingAddress}
            />
          </div>
        ) : user ? (
          <CheckoutAddresses heading={t('address.billingAddress')} setAddress={setBillingAddress} />
        ) : (
          <CreateAddressModal
            disabled={!email || Boolean(emailEditable)}
            callback={(address) => {
              setBillingAddress(address)
            }}
            skipSubmission={true}
          />
        )}

        <div className="flex gap-4 items-center">
          <Checkbox
            id="shippingTheSameAsBilling"
            checked={billingAddressSameAsShipping}
            disabled={Boolean(isInitiatingPayment || (!user && (!email || Boolean(emailEditable))))}
            onCheckedChange={(state) => {
              setBillingAddressSameAsShipping(state as boolean)
            }}
          />
          <Label htmlFor="shippingTheSameAsBilling">{t('address.shippingSameAsBilling')}</Label>
        </div>

        {!billingAddressSameAsShipping && (
          <>
            {shippingAddress ? (
              <div>
                <AddressItem
                  actions={
                    <Button
                      variant={'outline'}
                      disabled={isInitiatingPayment}
                      onClick={(e) => {
                        e.preventDefault()
                        setShippingAddress(undefined)
                      }}
                    >
                      {tCart('remove')}
                    </Button>
                  }
                  address={shippingAddress}
                />
              </div>
            ) : user ? (
              <CheckoutAddresses
                heading={t('address.shippingAddress')}
                description={t('address.shippingAddressDescription')}
                setAddress={setShippingAddress}
              />
            ) : (
              <CreateAddressModal
                callback={(address) => {
                  setShippingAddress(address)
                }}
                disabled={!email || Boolean(emailEditable)}
                skipSubmission={true}
              />
            )}
          </>
        )}

        <DeliveryEstimate
          cartId={cart?.id}
          pincode={(billingAddressSameAsShipping ? billingAddress : shippingAddress)?.postalCode ?? undefined}
        />

        <div className="flex flex-col gap-6">
          <div>
            <h2 className="font-medium text-3xl">Dispatch</h2>
            <p className="text-muted-foreground mt-2 text-sm">Select a shipping method before payment.</p>
          </div>
          <div className="divide-y rounded-lg border">
            {checkoutShippingMethods.map((method) => (
              <label
                className={`flex cursor-pointer items-start gap-4 p-5 ${
                  shippingMethodId === method.id ? 'bg-primary/5' : ''
                }`}
                key={method.id}
              >
                <input
                  checked={shippingMethodId === method.id}
                  className="mt-1"
                  disabled={!canGoToDispatch}
                  onChange={() => {
                    setShippingMethodId(method.id)
                    setCheckoutStep('review')
                  }}
                  type="radio"
                />
                <span className="flex flex-1 flex-col gap-1">
                  <span className="font-medium">{method.label}</span>
                  <span className="text-muted-foreground text-sm">{method.eta}</span>
                </span>
                <Price amount={method.amount} as="span" />
              </label>
            ))}
          </div>
        </div>

        {shippingMethodId && fullyCoveredByGiftCard && (
          <div className="flex flex-col gap-4">
            <div className="bg-success/5 border-success/30 text-success rounded-lg border p-4 text-sm">
              {t('giftCardCovered')}
            </div>
            <Button
              className="self-start"
              disabled={!canGoToPayment || isPlacingOrder}
              onClick={(e) => {
                e.preventDefault()
                posthog.capture('checkout_started', {
                  payment_method: 'gift-card',
                  cart_total: cart?.subtotal ?? 0,
                  item_count: cart?.items?.length ?? 0,
                })
                void placeDirectOrder()
              }}
            >
              {isPlacingOrder ? t('placingOrder') : t('placeOrder')}
            </Button>

            <SecureCheckoutBadge />
          </div>
        )}

        {shippingMethodId && !fullyCoveredByGiftCard && (
          <div className="flex flex-col gap-4">
            <h2 className="font-medium text-3xl">{t('paymentMethod.heading')}</h2>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label
                className={`flex flex-1 items-center gap-3 rounded-lg border p-4 ${!cardPaymentAvailable ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-border'}`}
              >
                <input
                  checked={paymentMethod === 'card'}
                  disabled={!cardPaymentAvailable}
                  onChange={() => setPaymentMethod('card')}
                  type="radio"
                />
                <span>{t('paymentMethod.cardUpiNetbanking')}</span>
              </label>
              {flags.cashOnDelivery && (
                <label
                  className={`flex flex-1 cursor-pointer items-center gap-3 rounded-lg border p-4 ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border'}`}
                >
                  <input
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    type="radio"
                  />
                  <span>{t('paymentMethod.cashOnDelivery')}</span>
                </label>
              )}
            </div>

            {!cardPaymentAvailable && (
              <p className="text-muted-foreground text-sm">
                {t('paymentMethod.cardUnavailable', { currency: cart?.currency ?? '' })}
              </p>
            )}

            <Button
              className="self-start"
              disabled={!canGoToPayment || isPlacingOrder || isInitiatingPayment}
              onClick={(e) => {
                e.preventDefault()
                posthog.capture('checkout_started', {
                  payment_method: paymentMethod,
                  cart_total: cart?.subtotal ?? 0,
                  item_count: cart?.items?.length ?? 0,
                })
                if (paymentMethod === 'cod') {
                  void placeDirectOrder()
                } else {
                  void payWithPayu()
                }
              }}
            >
              {paymentMethod === 'cod'
                ? isPlacingOrder
                  ? t('placingOrder')
                  : t('paymentMethod.placeOrderCod')
                : isInitiatingPayment
                  ? t('paymentMethod.loading')
                  : t('paymentMethod.goToPayment')}
            </Button>

            <SecureCheckoutBadge />
          </div>
        )}

        {error && (
          <div className="my-8">
            <Message error={error} />

            <Button
              onClick={(e) => {
                e.preventDefault()
                router.refresh()
              }}
              variant="default"
            >
              {t('tryAgain')}
            </Button>
          </div>
        )}

      </div>

      {!cartIsEmpty && (
        <div className="basis-full lg:basis-1/3 lg:pl-8 p-8 border-none bg-primary/5 flex flex-col gap-8 rounded-lg">
          <h2 className="text-3xl font-medium">{t('yourCart')}</h2>
          {cart?.items?.map((item, index) => {
            if (typeof item.product === 'object' && item.product) {
              const {
                product,
                product: { id, meta, title, gallery },
                quantity,
                variant,
              } = item

              if (!quantity) return null

              let image = gallery?.[0]?.image || meta?.image
              let price = product?.priceInINR

              const isVariant = Boolean(variant) && typeof variant === 'object'

              if (isVariant) {
                price = variant?.priceInINR

                const imageVariant = product.gallery?.find((item: GalleryItem) => {
                  if (!item.variantOption) return false
                  const variantOptionID =
                    typeof item.variantOption === 'object'
                      ? item.variantOption.id
                      : item.variantOption

                  const hasMatch = variant?.options?.some((option: VariantOptionItem) => {
                    if (typeof option === 'object') return option.id === variantOptionID
                    else return option === variantOptionID
                  })

                  return hasMatch
                })

                if (imageVariant && typeof imageVariant.image !== 'string') {
                  image = imageVariant.image
                }
              }

              return (
                <div className="flex items-start gap-4" key={index}>
                  <div className="flex items-stretch justify-stretch h-20 w-20 p-2 rounded-lg border">
                    <div className="relative w-full h-full">
                      {image && typeof image !== 'string' && (
                        <Media className="" fill imgClassName="rounded-lg" resource={image} size="80px" />
                      )}
                    </div>
                  </div>
                  <div className="flex grow justify-between items-center">
                    <div className="flex flex-col gap-1">
                      <p className="font-medium text-lg">{title}</p>
                      {variant && typeof variant === 'object' && (
                        <p className="text-sm text-muted-foreground">
                          {variant.options
                            ?.map((option: VariantOptionItem) => {
                              if (typeof option === 'object') return option.label
                              return null
                            })
                            .join(', ')}
                        </p>
                      )}
                      <div>
                        {'x'}
                        {quantity}
                      </div>
                    </div>

                    {typeof price === 'number' && <Price amount={price} />}
                  </div>
                </div>
              )
            }
            return null
          })}
          <hr />

          <div className="flex flex-col gap-3">
            {cart.appliedCouponCode ? (
              <div className="flex items-center justify-between text-sm">
                <span>
                  {tCart('couponLabel')} <span className="font-medium">{cart.appliedCouponCode}</span>{' '}
                  {tCart('appliedLabel')}
                  {typeof cart.couponDiscountAmount === 'number' && cart.couponDiscountAmount > 0 && (
                    <>
                      {' '}
                      (-<Price amount={cart.couponDiscountAmount} as="span" />)
                    </>
                  )}
                </span>
                <button
                  className="text-primary underline"
                  disabled={isApplyingDiscount}
                  onClick={() => applyDiscount({ remove: 'coupon' })}
                  type="button"
                >
                  {tCart('remove')}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="flex gap-2">
                  <input
                    aria-label={tCart('couponCodeLabel')}
                    className="border-border bg-background flex-1 rounded-md border px-3 py-2 text-sm outline-none"
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder={t('couponCodePlaceholder')}
                    value={couponInput}
                  />
                  <Button
                    disabled={!couponInput || isApplyingDiscount}
                    onClick={() => applyDiscount({ couponCode: couponInput })}
                    type="button"
                    variant="outline"
                  >
                    {tCart('apply')}
                  </Button>
                </div>
                {couponError && <p className="text-error text-xs">{couponError}</p>}
              </div>
            )}

            {flags.giftCards && (cart.appliedGiftCardCode ? (
              <div className="flex items-center justify-between text-sm">
                <span>
                  {tCart('giftCardLabel')} <span className="font-medium">{cart.appliedGiftCardCode}</span>{' '}
                  {tCart('appliedLabel')}
                  {typeof cart.giftCardAmountApplied === 'number' && cart.giftCardAmountApplied > 0 && (
                    <>
                      {' '}
                      (-<Price amount={cart.giftCardAmountApplied} as="span" />)
                    </>
                  )}
                </span>
                <button
                  className="text-primary underline"
                  disabled={isApplyingDiscount}
                  onClick={() => applyDiscount({ remove: 'gift-card' })}
                  type="button"
                >
                  {tCart('remove')}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="flex gap-2">
                  <input
                    aria-label={tCart('giftCardCodeLabel')}
                    className="border-border bg-background flex-1 rounded-md border px-3 py-2 text-sm outline-none"
                    onChange={(e) => setGiftCardInput(e.target.value)}
                    placeholder={t('giftCardCodePlaceholder')}
                    value={giftCardInput}
                  />
                  <Button
                    disabled={!giftCardInput || isApplyingDiscount}
                    onClick={() => applyDiscount({ giftCardCode: giftCardInput })}
                    type="button"
                    variant="outline"
                  >
                    {tCart('apply')}
                  </Button>
                </div>
                {giftCardError && <p className="text-error text-xs">{giftCardError}</p>}
              </div>
            ))}
          </div>

          <hr />
          {taxBreakdown ? (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm">
                <span>{tCart('subtotal')}</span>
                <Price amount={subtotalAfterDiscounts} />
              </div>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>
                  {t('gst')} ({taxBreakdown.gstRatePercent.toFixed(0)}%)
                </span>
                <Price amount={taxBreakdown.totalTax} />
              </div>
              {selectedShippingMethod && (
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>{selectedShippingMethod.label}</span>
                  <Price amount={selectedShippingMethod.amount} />
                </div>
              )}
              <div className="flex justify-between items-center gap-2">
                <span className="uppercase">{tCart('total')}</span>
                <Price
                  className="text-3xl font-medium"
                  amount={checkoutTotal}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedShippingMethod && (
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>{selectedShippingMethod.label}</span>
                  <Price amount={selectedShippingMethod.amount} />
                </div>
              )}
              <div className="flex justify-between items-center gap-2">
                <span className="uppercase">{tCart('total')}</span>{' '}
                <Price className="text-3xl font-medium" amount={checkoutTotal} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
