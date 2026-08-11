import React from 'react'

/**
 * Rendered via `admin.components.actions`, so it appears in the top-right of
 * every admin page (not just the dashboard) — a persistent reminder of which
 * environment is being edited.
 */
export const EnvironmentBadge: React.FC = () => {
  const isProd = process.env.NODE_ENV === 'production'

  return (
    <span
      className={`pmc-badge pmc-badge-sm ${isProd ? 'pmc-badge-ghost' : 'pmc-badge-warning'}`}
      style={{ marginRight: '0.75rem', alignSelf: 'center' }}
    >
      {isProd ? 'Production' : 'Development'}
    </span>
  )
}
