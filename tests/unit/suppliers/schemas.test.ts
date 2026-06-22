import { describe, it, expect } from 'vitest'
import { CreateSupplierSchema, UpdateSupplierSchema } from '@/lib/suppliers/schemas'

const VALID_CREATE = {
  name:     'Antwerp Diamond Co',
  code:     'ADC',
  currency: 'USD',
}

describe('CreateSupplierSchema', () => {
  it('accepts a minimal valid supplier', () => {
    const r = CreateSupplierSchema.safeParse(VALID_CREATE)
    expect(r.success).toBe(true)
  })

  it('applies default is_active=true', () => {
    const r = CreateSupplierSchema.safeParse(VALID_CREATE)
    expect(r.success && r.data.is_active).toBe(true)
  })

  it('applies default currency=USD', () => {
    const r = CreateSupplierSchema.safeParse({ name: 'X', code: 'XX' })
    expect(r.success && r.data.currency).toBe('USD')
  })

  it('rejects a code with lowercase letters', () => {
    const r = CreateSupplierSchema.safeParse({ ...VALID_CREATE, code: 'adc' })
    expect(r.success).toBe(false)
  })

  it('rejects a code with spaces', () => {
    const r = CreateSupplierSchema.safeParse({ ...VALID_CREATE, code: 'AD C' })
    expect(r.success).toBe(false)
  })

  it('accepts a code with hyphens and underscores', () => {
    const r = CreateSupplierSchema.safeParse({ ...VALID_CREATE, code: 'AD_C-1' })
    expect(r.success).toBe(true)
  })

  it('rejects an invalid email', () => {
    const r = CreateSupplierSchema.safeParse({ ...VALID_CREATE, email: 'not-an-email' })
    expect(r.success).toBe(false)
  })

  it('accepts a valid email', () => {
    const r = CreateSupplierSchema.safeParse({ ...VALID_CREATE, email: 'buyer@supplier.com' })
    expect(r.success).toBe(true)
  })

  it('accepts null email', () => {
    const r = CreateSupplierSchema.safeParse({ ...VALID_CREATE, email: null })
    expect(r.success).toBe(true)
  })

  it('rejects an invalid currency (not 3 uppercase letters)', () => {
    const r = CreateSupplierSchema.safeParse({ ...VALID_CREATE, currency: 'usd' })
    expect(r.success).toBe(false)
  })

  it('rejects an empty name', () => {
    const r = CreateSupplierSchema.safeParse({ ...VALID_CREATE, name: '' })
    expect(r.success).toBe(false)
  })

  it('accepts optional contact_name, phone, country, notes', () => {
    const r = CreateSupplierSchema.safeParse({
      ...VALID_CREATE,
      contact_name: 'Jan De Vries',
      phone:        '+32 3 123 4567',
      country:      'Belgium',
      notes:        'Reliable partner',
    })
    expect(r.success).toBe(true)
  })
})

describe('UpdateSupplierSchema', () => {
  it('accepts an empty patch', () => {
    const r = UpdateSupplierSchema.safeParse({})
    expect(r.success).toBe(true)
  })

  it('accepts a single-field patch', () => {
    const r = UpdateSupplierSchema.safeParse({ notes: 'Updated notes' })
    expect(r.success).toBe(true)
  })

  it('rejects an invalid code in a patch', () => {
    const r = UpdateSupplierSchema.safeParse({ code: 'lowercase' })
    expect(r.success).toBe(false)
  })

  it('rejects an invalid currency in a patch', () => {
    const r = UpdateSupplierSchema.safeParse({ currency: '$$' })
    expect(r.success).toBe(false)
  })

  it('accepts is_active=false in a patch', () => {
    const r = UpdateSupplierSchema.safeParse({ is_active: false })
    expect(r.success).toBe(true)
  })
})
