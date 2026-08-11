import * as React from 'react'
import { Minus, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/cn'

type QuantityStepperProps = {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = Infinity,
  step = 1,
  disabled,
  className,
  'aria-label': ariaLabel = 'Quantity',
}: QuantityStepperProps) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next))

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = Number(event.target.value)
    if (!Number.isNaN(parsed)) onChange(clamp(parsed))
  }

  return (
    <div data-slot="quantity-stepper" className={cn('join', className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="join-item"
        disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - step))}
        aria-label="Decrease quantity"
      >
        <Minus />
      </Button>
      <input
        type="number"
        inputMode="numeric"
        className="input join-item border-input w-14 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        value={value}
        min={min}
        max={Number.isFinite(max) ? max : undefined}
        step={step}
        disabled={disabled}
        onChange={handleInputChange}
        aria-label={ariaLabel}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="join-item"
        disabled={disabled || value >= max}
        onClick={() => onChange(clamp(value + step))}
        aria-label="Increase quantity"
      >
        <Plus />
      </Button>
    </div>
  )
}

export { QuantityStepper }
