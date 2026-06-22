// Supplier DTOs and conversion functions.
// SupplierRow mirrors public.suppliers exactly.
// SupplierFull is the public-facing shape (currently identical to SupplierRow).

export interface SupplierRow {
  id:           string
  name:         string
  code:         string
  contact_name: string | null
  email:        string | null
  phone:        string | null
  country:      string | null
  currency:     string
  notes:        string | null
  is_active:    boolean
  created_at:   string
  updated_at:   string
}

export type SupplierFull = SupplierRow

export function toSupplierFull(row: SupplierRow): SupplierFull {
  return { ...row }
}
