import React from 'react'

/**
 * Simplified, non-trademarked payment network marks used purely to signal
 * "we accept this" in the footer — not reproductions of the official brand
 * assets. Each shares a 40x24 "card" viewBox so they line up in a row.
 */

type IconProps = React.ComponentProps<'svg'>

export function VisaIcon(props: IconProps) {
  return (
    <svg aria-label="Visa" viewBox="0 0 40 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="40" height="24" rx="4" fill="#1A1F71" />
      <text
        x="20"
        y="16.5"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontStyle="italic"
        fontWeight="700"
        fontSize="10.5"
        letterSpacing="0.3"
        fill="#FFFFFF"
      >
        VISA
      </text>
    </svg>
  )
}

export function MastercardIcon(props: IconProps) {
  return (
    <svg aria-label="Mastercard" viewBox="0 0 40 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="40" height="24" rx="4" fill="#F4F4F5" />
      <circle cx="17" cy="12" r="7" fill="#EB001B" />
      <circle cx="23" cy="12" r="7" fill="#F79E1B" />
      <path
        d="M20 6.6a7 7 0 0 1 0 10.8 7 7 0 0 1 0-10.8Z"
        fill="#FF5F00"
      />
    </svg>
  )
}

export function RuPayIcon(props: IconProps) {
  return (
    <svg aria-label="RuPay" viewBox="0 0 40 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="40" height="24" rx="4" fill="#FFFFFF" stroke="#E4E4E7" />
      <text
        x="6"
        y="16"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="800"
        fontSize="10"
        letterSpacing="-0.2"
        fill="#0C4F9C"
      >
        Ru
        <tspan fill="#FF6600">Pay</tspan>
      </text>
    </svg>
  )
}

export function UpiIcon(props: IconProps) {
  return (
    <svg aria-label="UPI" viewBox="0 0 40 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="40" height="24" rx="4" fill="#FFFFFF" stroke="#E4E4E7" />
      <path d="M9 7v6.5a3.5 3.5 0 0 0 7 0V7" stroke="#ED752E" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M20 17V7l5 10 5-10" stroke="#097939" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function AmexIcon(props: IconProps) {
  return (
    <svg aria-label="American Express" viewBox="0 0 40 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="40" height="24" rx="4" fill="#2E77BC" />
      <text
        x="20"
        y="16"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontSize="8.5"
        letterSpacing="0.2"
        fill="#FFFFFF"
      >
        AMEX
      </text>
    </svg>
  )
}
