import React from 'react'

export type StatItem = {
  id?: string | null
  value: string
  label: string
  description?: string | null
}

export type StatsStripBlockProps = {
  id?: string | number
  heading?: string | null
  subheading?: string | null
  theme?: 'dark' | 'primary' | 'glass' | null
  stats?: StatItem[] | null
}

const DEFAULT_STATS: StatItem[] = [
  {
    value: '50,000+',
    label: 'Verified Components',
    description: 'Active inventory ready for dispatch',
  },
  {
    value: '24 Hours',
    label: 'Same-Day Dispatch',
    description: 'Orders ship in under 1 business day',
  },
  {
    value: '100%',
    label: 'Datasheet Guarantee',
    description: 'Every part spec-tested against pinout',
  },
  {
    value: '10,000+',
    label: 'Makers & Labs',
    description: 'Building robotics, IoT & drones',
  },
]

export const StatsStripBlock: React.FC<StatsStripBlockProps> = ({
  heading,
  subheading,
  theme = 'dark',
  stats,
}) => {
  const resolvedStats = stats && stats.length > 0 ? stats : DEFAULT_STATS

  const isPrimary = theme === 'primary'
  const isGlass = theme === 'glass'

  return (
    <section className="container my-16">
      <div
        className={`relative overflow-hidden rounded-3xl p-8 sm:p-12 ${
          isPrimary
            ? 'bg-gradient-to-br from-primary via-primary/90 to-amber-600 text-white shadow-xl shadow-primary/10'
            : isGlass
              ? 'bg-card/70 border border-border/80 backdrop-blur-xl shadow-sm text-foreground'
              : 'bg-neutral-950 border border-neutral-800 text-white shadow-2xl'
        }`}
      >
        {/* Background glow effects */}
        <div className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-primary/20 blur-3xl opacity-50" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 size-72 rounded-full bg-orange-500/20 blur-3xl opacity-50" />

        {(heading || subheading) && (
          <div className="relative z-10 mx-auto mb-10 max-w-2xl text-center">
            {heading && (
              <h2
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                  isGlass ? 'text-foreground' : 'text-white'
                }`}
              >
                {heading}
              </h2>
            )}
            {subheading && (
              <p
                className={`mt-2 text-sm sm:text-base ${
                  isGlass ? 'text-muted-foreground' : 'text-neutral-400'
                }`}
              >
                {subheading}
              </p>
            )}
          </div>
        )}

        <div className="relative z-10 grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-8">
          {resolvedStats.map((stat, idx) => (
            <div
              key={stat.id || idx}
              className={`flex flex-col items-center text-center p-4 rounded-2xl transition-transform duration-200 hover:-translate-y-1 ${
                isGlass
                  ? 'bg-muted/40 border border-border/40'
                  : 'bg-white/5 border border-white/10 backdrop-blur-sm'
              }`}
            >
              <div
                className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight ${
                  isPrimary
                    ? 'text-white'
                    : 'bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent'
                }`}
              >
                {stat.value}
              </div>
              <div
                className={`mt-2 text-sm font-bold ${
                  isGlass ? 'text-foreground' : 'text-white'
                }`}
              >
                {stat.label}
              </div>
              {stat.description && (
                <p
                  className={`mt-1 text-xs leading-relaxed ${
                    isGlass ? 'text-muted-foreground' : 'text-neutral-400'
                  }`}
                >
                  {stat.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
