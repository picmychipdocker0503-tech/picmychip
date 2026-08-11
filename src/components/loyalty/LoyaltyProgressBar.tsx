import { Progress } from '@/components/ui/progress'

/**
 * UI shell only — placeholder tiers/points until a real rewards program
 * (earn rate, redemption rules) is defined. Swap PLACEHOLDER_* for real
 * customer data once that program exists.
 */
const PLACEHOLDER_TIERS = ['Bronze', 'Silver', 'Gold'] as const
const PLACEHOLDER_POINTS = 340
const PLACEHOLDER_NEXT_TIER_POINTS = 500
const PLACEHOLDER_CURRENT_TIER_INDEX = 0

export const LoyaltyProgressBar: React.FC = () => {
  const nextTier = PLACEHOLDER_TIERS[PLACEHOLDER_CURRENT_TIER_INDEX + 1]

  return (
    <div className="flex flex-col gap-3">
      <div className="text-muted-foreground flex justify-between text-sm">
        {PLACEHOLDER_TIERS.map((tier, index) => (
          <span
            className={index <= PLACEHOLDER_CURRENT_TIER_INDEX ? 'text-foreground font-medium' : undefined}
            key={tier}
          >
            {tier}
          </span>
        ))}
      </div>
      <Progress value={(PLACEHOLDER_POINTS / PLACEHOLDER_NEXT_TIER_POINTS) * 100} />
      {nextTier && (
        <p className="text-muted-foreground text-sm">
          {PLACEHOLDER_POINTS} / {PLACEHOLDER_NEXT_TIER_POINTS} points to {nextTier}
        </p>
      )}
    </div>
  )
}
