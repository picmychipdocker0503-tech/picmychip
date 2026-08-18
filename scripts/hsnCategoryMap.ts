// Standard HSN code per product category, shared by the HSN backfill and the
// catalog import script so both classify products the same way. These are
// best-effort classifications by product type, not a compliance
// determination — same caveat as the disclaimer on the printable invoice
// page ("consult your tax advisor to confirm the applicable GST
// treatment"). Categories marked "mixed bag" group genuinely dissimilar
// products and are worth a spot-check.

export const CATEGORY_HSN: Record<string, string> = {
  Brass: '7415', // threaded articles (screws/spacers) of copper alloys
  Buzzer: '8531', // electric sound signalling apparatus
  Cables: '8544', // insulated wire/cable, incl. coaxial
  Capacitor: '8532',
  Components: '8543', // electrical machines/apparatus with individual function, n.e.s. — mixed bag
  Connectors: '8536', // apparatus for switching/connecting circuits <=1000V
  'Cooling Fans, Filters & Grills': '8414',
  'DB Connectors': '8536',
  Diode: '8541',
  'Drone Parts': '8501', // predominantly motors/ESCs — most heterogeneous category
  'FFC Cables': '8544',
  Fuse: '8536',
  IC: '8542',
  Inductor: '8504',
  'JST Cables': '8544',
  'JST Connectors': '8536',
  LED: '8541',
  Modules: '8543', // relay/isolator/interface modules — mixed bag
  'Nuts & Screws': '7318', // threaded articles of iron/steel
  Nylon: '3926', // other articles of plastics
  'Nylon with Brass': '3926', // mixed material, classified by primary (plastic) body
  Resistor: '8533',
  Shop: '8543', // generic catch-all bucket
  Switch: '8536',
  Transistor: '8541',
  'USB Cables': '8544',
}

export const FLAGGED_HSN_CATEGORIES = new Set(['Components', 'Drone Parts', 'Modules', 'Nylon with Brass', 'Shop'])

// Used when a product has no category match at all (e.g. a fresh import
// whose category isn't in the map yet) — never left blank, since hsnCode is
// required, but always worth a manual follow-up.
export const FALLBACK_HSN = '8543'
