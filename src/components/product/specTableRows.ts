import type { Category, Product } from '@/payload-types'

export type SpecRow = { label: string; value: string }

const humanize = (value: string) =>
  value
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

const withOther = (value: string | null | undefined, other: string | null | undefined) => {
  if (!value) return undefined
  if (value === 'other') return other || undefined
  return humanize(value)
}

const joinList = (values: (string | null)[] | null | undefined) => {
  if (!values || values.length === 0) return undefined
  return values.filter((value): value is string => Boolean(value)).map(humanize).join(', ')
}

const push = (rows: SpecRow[], label: string, value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') return
  rows.push({ label, value: String(value) })
}

const STOCK_LABELS: Record<string, string> = {
  'in-stock': 'In Stock',
  'low-stock': 'Low Stock',
  'out-of-stock': 'Out of Stock',
  backorder: 'Backorder',
}

/**
 * Baseline comparison rows built from fields every product has, regardless
 * of `specSchemaType` — brand, category, price, stock, datasheet
 * availability. `specSchemaType`-keyed rows (below) only exist for the demo
 * maker-store spec groups (drone motors, SBCs, etc.); the real imported
 * catalog (resistors, capacitors, connectors, ICs, ...) has none of those,
 * so without this the comparison table would render empty for every real
 * product.
 */
export const getGeneralComparisonRows = (
  product: Pick<Product, 'brand' | 'categories' | 'priceInINR' | 'stockStatus' | 'datasheets'>,
): SpecRow[] => {
  const rows: SpecRow[] = []

  const brand = typeof product.brand === 'object' ? product.brand?.title : undefined
  push(rows, 'Brand', brand)

  const categories = (product.categories ?? []).filter(
    (category): category is Category => typeof category === 'object',
  )
  if (categories.length > 0) {
    rows.push({ label: 'Category', value: categories.map((category) => category.title).join(', ') })
  }

  if (typeof product.priceInINR === 'number') {
    rows.push({ label: 'Price', value: `₹${product.priceInINR.toFixed(2)}` })
  }

  if (product.stockStatus) {
    rows.push({ label: 'Availability', value: STOCK_LABELS[product.stockStatus] ?? product.stockStatus })
  }

  const datasheetCount = (product.datasheets ?? []).length
  if (datasheetCount > 0) {
    rows.push({ label: 'Datasheet', value: datasheetCount > 1 ? `${datasheetCount} available` : 'Available' })
  }

  return rows
}

/**
 * Flattens the conditionally-shown `product.specs.<category>` group into
 * scannable label/value rows. Shared by the product page's spec table and
 * the ComparisonTable block, so labels never drift between the two.
 */
export const getSpecRows = (product: Pick<Product, 'specSchemaType' | 'specs'>): SpecRow[] => {
  const rows: SpecRow[] = []
  const specs = product.specs

  switch (product.specSchemaType) {
    case 'drone-motors': {
      const s = specs?.droneMotor
      if (!s) break
      push(rows, 'Motor Type', s.motorType && humanize(s.motorType))
      push(rows, 'KV Rating', s.kvRating)
      if (s.statorWidthMM || s.statorHeightMM) {
        push(rows, 'Stator Size', `${s.statorWidthMM ?? '–'} x ${s.statorHeightMM ?? '–'} mm`)
      }
      push(rows, 'Weight', s.weightG ? `${s.weightG} g` : undefined)
      push(rows, 'Applications', joinList(s.applications))
      break
    }
    case 'sbc': {
      const s = specs?.sbc
      if (!s) break
      push(rows, 'Model Family', withOther(s.modelFamily, s.modelFamilyOther))
      push(rows, 'Form Factor', withOther(s.formFactor, s.formFactorOther))
      if (s.ramMB === 'custom') {
        push(rows, 'RAM', s.ramCustomMB ? `${s.ramCustomMB} MB` : undefined)
      } else {
        push(rows, 'RAM', s.ramMB ? `${Number(s.ramMB) >= 1024 ? Number(s.ramMB) / 1024 + ' GB' : s.ramMB + ' MB'}` : undefined)
      }
      push(rows, 'Connectivity', joinList(s.connectivity))
      push(rows, 'GPIO Pins', s.gpioPinCount)
      push(rows, 'GPIO Notes', s.gpioLayoutNotes)
      break
    }
    case 'microcontrollers': {
      const s = specs?.microcontroller
      if (!s) break
      push(rows, 'Family', withOther(s.family, s.familyOther))
      push(rows, 'Clock Speed', s.clockSpeedMHz ? `${s.clockSpeedMHz} MHz` : undefined)
      push(rows, 'Flash', s.flashSize ? `${s.flashSize} ${s.flashUnit ?? ''}`.trim() : undefined)
      push(rows, 'RAM', s.ramSize ? `${s.ramSize} ${s.ramUnit ?? ''}`.trim() : undefined)
      push(rows, 'I/O Count', s.ioCount)
      push(rows, 'Wireless', joinList(s.wireless))
      break
    }
    case 'mechanical': {
      const s = specs?.mechanical
      if (!s) break
      push(rows, 'Component Type', withOther(s.componentType, s.componentTypeOther))
      push(rows, 'Material', withOther(s.material, s.materialOther))
      const d = s.dimensions
      if (d?.lengthMM || d?.widthMM || d?.heightMM) {
        push(rows, 'Dimensions', `${d?.lengthMM ?? '–'} x ${d?.widthMM ?? '–'} x ${d?.heightMM ?? '–'} mm`)
      }
      push(rows, 'Bore Diameter', d?.boreDiameterMM ? `${d.boreDiameterMM} mm` : undefined)
      break
    }
    case 'tools': {
      const s = specs?.tool
      if (!s) break
      push(rows, 'Tool Type', s.toolType && humanize(s.toolType))
      push(rows, 'Power', s.powerWattage ? `${s.powerWattage} W` : undefined)
      push(rows, 'Voltage', s.voltageSpec)
      s.measurementRanges?.forEach((range) => {
        const parameter = withOther(range.parameter, range.parameterOther)
        const unit = withOther(range.unit, range.unitOther) ?? ''
        if (parameter && (range.minValue || range.maxValue)) {
          rows.push({
            label: parameter,
            value: `${range.minValue ?? '–'}–${range.maxValue ?? '–'} ${unit}`.trim(),
          })
        }
      })
      break
    }
    case 'filaments': {
      const s = specs?.filament
      if (!s) break
      push(rows, 'Material Type', withOther(s.materialType, s.materialTypeOther))
      push(rows, 'Diameter', s.diameterMM ? `${s.diameterMM} mm` : undefined)
      push(rows, 'Color', s.color)
      push(rows, 'Spool Weight', s.spoolWeightG ? `${s.spoolWeightG} g` : undefined)
      if (s.printTempMinC || s.printTempMaxC) {
        push(rows, 'Print Temp', `${s.printTempMinC ?? '–'}–${s.printTempMaxC ?? '–'} °C`)
      }
      break
    }
    default:
      break
  }

  return rows
}
