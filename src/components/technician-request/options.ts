// Shared by the form (labels) and the server action (validation), so the two
// can never drift apart.
export const SKILL_OPTIONS = [
  'Soldering & rework',
  'SMD & through-hole assembly',
  'BGA rework',
  'Testing & debugging',
  'Cable & harness assembly',
  'Inspection & QC',
  'Installation & commissioning',
  'Drone assembly & repair',
] as const

export const ENGAGEMENT_OPTIONS = [
  { label: 'Onsite at our location', value: 'onsite' },
  { label: 'At Picmychip facility', value: 'facility' },
  { label: 'Either / not sure', value: 'either' },
] as const

export const DURATION_OPTIONS = [
  { label: 'One day', value: 'day' },
  { label: 'Up to a week', value: 'week' },
  { label: 'Up to a month', value: 'month' },
  { label: 'Long term (1+ months)', value: 'long-term' },
  { label: 'Not sure yet', value: 'not-sure' },
] as const
