// Synchronous FormData parse/validation helpers shared between create and edit actions.
// This file has no 'use server' directive — it may be imported by server action files.

function str(formData: FormData, key: string): string {
  return (formData.get(key) as string | null)?.trim() ?? ''
}

function nullableStr(formData: FormData, key: string): string | null {
  const v = str(formData, key)
  return v.length > 0 ? v : null
}

function numOrNull(formData: FormData, key: string): number | null {
  const s = str(formData, key)
  if (!s) return null
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

function intOrNull(formData: FormData, key: string): number | null {
  const n = numOrNull(formData, key)
  return n !== null ? Math.round(n) : null
}

export function parseDiamondFormData(formData: FormData) {
  return {
    origin:                  str(formData, 'origin') || 'natural',
    supplier_id:             nullableStr(formData, 'supplier_id'),
    supplier_sku:            nullableStr(formData, 'supplier_sku'),
    colour_category:         str(formData, 'colour_category') || 'standard',
    colour_grade:            nullableStr(formData, 'colour_grade'),
    fancy_colour_hue:        nullableStr(formData, 'fancy_colour_hue'),
    fancy_colour_intensity:  nullableStr(formData, 'fancy_colour_intensity'),
    fancy_colour_overtone:   nullableStr(formData, 'fancy_colour_overtone'),
    shape:                   str(formData, 'shape'),
    carat:                   numOrNull(formData, 'carat'),
    clarity:                 str(formData, 'clarity'),
    cut:                     nullableStr(formData, 'cut'),
    polish:                  str(formData, 'polish'),
    symmetry:                str(formData, 'symmetry'),
    fluorescence:            str(formData, 'fluorescence') || 'None',
    meas_length_mm:          numOrNull(formData, 'meas_length_mm'),
    meas_width_mm:           numOrNull(formData, 'meas_width_mm'),
    meas_depth_mm:           numOrNull(formData, 'meas_depth_mm'),
    table_pct:               numOrNull(formData, 'table_pct'),
    depth_pct:               numOrNull(formData, 'depth_pct'),
    girdle:                  nullableStr(formData, 'girdle'),
    culet:                   nullableStr(formData, 'culet'),
    cert_lab:                nullableStr(formData, 'cert_lab'),
    cert_number:             nullableStr(formData, 'cert_number'),
    retail_price_amount:     intOrNull(formData, 'retail_price_amount'),
    retail_price_currency:   str(formData, 'retail_price_currency') || 'AED',
    supplier_cost_amount:    intOrNull(formData, 'supplier_cost_amount'),
    supplier_cost_currency:  str(formData, 'supplier_cost_currency') || 'USD',
    selection_note:          nullableStr(formData, 'selection_note'),
    internal_notes:          nullableStr(formData, 'internal_notes'),
    is_visible:              formData.get('is_visible') === 'on',
  }
}

export function zodErrors(err: import('zod').ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of err.errors) {
    const key = issue.path[0]?.toString() ?? '_form'
    if (!out[key]) out[key] = issue.message
  }
  return out
}
