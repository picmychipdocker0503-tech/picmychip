/**
 * Canonical list of Indian states/UTs used everywhere state-code logic is needed:
 * GST intra-state vs inter-state comparison (computeGstTaxBreakdown), Zoho Books'
 * `place_of_supply` field, and the checkout address form's State select. Keeping this
 * as the single source of truth avoids the fragile free-text state matching that used
 * to compare lowercased strings directly.
 *
 * `gstCode` is the 2-digit numeric GSTIN state prefix (Indian Census 2011 codes).
 * `zohoStateCode` is the 2-letter code Zoho Books' API expects for `place_of_supply`.
 */
export type IndianState = {
  name: string
  gstCode: string
  zohoStateCode: string
}

export const INDIAN_STATES: IndianState[] = [
  { name: 'Andaman and Nicobar Islands', gstCode: '35', zohoStateCode: 'AN' },
  { name: 'Andhra Pradesh', gstCode: '37', zohoStateCode: 'AP' },
  { name: 'Arunachal Pradesh', gstCode: '12', zohoStateCode: 'AR' },
  { name: 'Assam', gstCode: '18', zohoStateCode: 'AS' },
  { name: 'Bihar', gstCode: '10', zohoStateCode: 'BR' },
  { name: 'Chandigarh', gstCode: '04', zohoStateCode: 'CH' },
  { name: 'Chhattisgarh', gstCode: '22', zohoStateCode: 'CG' },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', gstCode: '26', zohoStateCode: 'DN' },
  { name: 'Delhi', gstCode: '07', zohoStateCode: 'DL' },
  { name: 'Goa', gstCode: '30', zohoStateCode: 'GA' },
  { name: 'Gujarat', gstCode: '24', zohoStateCode: 'GJ' },
  { name: 'Haryana', gstCode: '06', zohoStateCode: 'HR' },
  { name: 'Himachal Pradesh', gstCode: '02', zohoStateCode: 'HP' },
  { name: 'Jammu and Kashmir', gstCode: '01', zohoStateCode: 'JK' },
  { name: 'Jharkhand', gstCode: '20', zohoStateCode: 'JH' },
  { name: 'Karnataka', gstCode: '29', zohoStateCode: 'KA' },
  { name: 'Kerala', gstCode: '32', zohoStateCode: 'KL' },
  { name: 'Ladakh', gstCode: '38', zohoStateCode: 'LA' },
  { name: 'Lakshadweep', gstCode: '31', zohoStateCode: 'LD' },
  { name: 'Madhya Pradesh', gstCode: '23', zohoStateCode: 'MP' },
  { name: 'Maharashtra', gstCode: '27', zohoStateCode: 'MH' },
  { name: 'Manipur', gstCode: '14', zohoStateCode: 'MN' },
  { name: 'Meghalaya', gstCode: '17', zohoStateCode: 'ML' },
  { name: 'Mizoram', gstCode: '15', zohoStateCode: 'MZ' },
  { name: 'Nagaland', gstCode: '13', zohoStateCode: 'NL' },
  { name: 'Odisha', gstCode: '21', zohoStateCode: 'OR' },
  { name: 'Puducherry', gstCode: '34', zohoStateCode: 'PY' },
  { name: 'Punjab', gstCode: '03', zohoStateCode: 'PB' },
  { name: 'Rajasthan', gstCode: '08', zohoStateCode: 'RJ' },
  { name: 'Sikkim', gstCode: '11', zohoStateCode: 'SK' },
  { name: 'Tamil Nadu', gstCode: '33', zohoStateCode: 'TN' },
  { name: 'Telangana', gstCode: '36', zohoStateCode: 'TG' },
  { name: 'Tripura', gstCode: '16', zohoStateCode: 'TR' },
  { name: 'Uttar Pradesh', gstCode: '09', zohoStateCode: 'UP' },
  { name: 'Uttarakhand', gstCode: '05', zohoStateCode: 'UT' },
  { name: 'West Bengal', gstCode: '19', zohoStateCode: 'WB' },
]

const normalize = (value: string) => value.trim().toLowerCase()

const STATE_BY_NORMALIZED_NAME = new Map(INDIAN_STATES.map((state) => [normalize(state.name), state]))

/**
 * Resolves a free-text or select-sourced state name to its canonical record.
 * Returns undefined for unrecognized values instead of guessing — callers should
 * treat that as "can't determine state code" rather than silently defaulting.
 */
export const resolveIndianState = (name: string | null | undefined): IndianState | undefined => {
  if (!name) return undefined
  return STATE_BY_NORMALIZED_NAME.get(normalize(name))
}
