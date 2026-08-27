import React from 'react'

/**
 * Error-page illustration — a circuit board with a snapped trace and a
 * warning badge, in the same single-color line-art convention as the rest
 * of `illustrations/` (currentColor stroke, no hardcoded fills), so it
 * reads correctly across every theme rather than just light/dark.
 */
export const BrokenCircuit: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="12" y="12" width="96" height="96" rx="8" />

    {/* Traces — one is deliberately broken with a jagged gap. */}
    <path d="M28 12v18M28 90v18" />
    <path d="M28 30h20M28 74h20" strokeOpacity="0.9" />
    <circle cx="52" cy="30" r="3.5" />
    <circle cx="52" cy="74" r="3.5" />

    <path d="M92 12v22" />
    <path d="M92 34l-8 8" strokeDasharray="1 5" />

    <path d="M12 58h18M92 58h16" />
    <circle cx="34" cy="58" r="3" />

    {/* Warning badge, overlapping the snapped trace. */}
    <g transform="translate(66 50)">
      <circle cx="16" cy="16" r="19" />
      <path d="M16 9v10" />
      <circle cx="16" cy="23.5" r="1.6" fill="currentColor" stroke="none" />
    </g>
  </svg>
)
