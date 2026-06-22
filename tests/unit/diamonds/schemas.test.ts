import { describe, it, expect } from 'vitest'
import { CreateDiamondSchema, UpdateDiamondSchema, PlaceHoldSchema, ExtendHoldSchema } from '@/lib/diamonds/schemas'

const VALID_STANDARD = {
  shape:    'round',
  carat:    1.5,
  clarity:  'VS1',
  polish:   'Excellent',
  symmetry: 'Very Good',
  colour_category: 'standard',
  colour_grade:    'G',
}

const VALID_FANCY = {
  shape:                  'oval',
  carat:                  2.0,
  clarity:                'VVS2',
  polish:                 'Very Good',
  symmetry:               'Good',
  colour_category:        'fancy',
  fancy_colour_hue:       'yellow',
  fancy_colour_intensity: 'Fancy',
}

describe('CreateDiamondSchema', () => {
  it('accepts a valid standard-colour diamond', () => {
    const r = CreateDiamondSchema.safeParse(VALID_STANDARD)
    expect(r.success).toBe(true)
  })

  it('accepts a valid fancy-colour diamond', () => {
    const r = CreateDiamondSchema.safeParse(VALID_FANCY)
    expect(r.success).toBe(true)
  })

  it('rejects standard diamond missing colour_grade', () => {
    const r = CreateDiamondSchema.safeParse({ ...VALID_STANDARD, colour_grade: null })
    expect(r.success).toBe(false)
    const paths = (r as { error: { errors: { path: string[] }[] } }).error.errors.map((e) => e.path[0])
    expect(paths).toContain('colour_grade')
  })

  it('rejects standard diamond with fancy_colour_hue set', () => {
    const r = CreateDiamondSchema.safeParse({ ...VALID_STANDARD, fancy_colour_hue: 'pink' })
    expect(r.success).toBe(false)
  })

  it('rejects fancy diamond missing fancy_colour_hue', () => {
    const input = { ...VALID_FANCY, fancy_colour_hue: null }
    const r = CreateDiamondSchema.safeParse(input)
    expect(r.success).toBe(false)
    const paths = (r as { error: { errors: { path: string[] }[] } }).error.errors.map((e) => e.path[0])
    expect(paths).toContain('fancy_colour_hue')
  })

  it('rejects fancy diamond missing fancy_colour_intensity', () => {
    const input = { ...VALID_FANCY, fancy_colour_intensity: null }
    const r = CreateDiamondSchema.safeParse(input)
    expect(r.success).toBe(false)
  })

  it('rejects fancy diamond with colour_grade set', () => {
    const r = CreateDiamondSchema.safeParse({ ...VALID_FANCY, colour_grade: 'D' })
    expect(r.success).toBe(false)
  })

  it('rejects cert_lab without cert_number', () => {
    const r = CreateDiamondSchema.safeParse({ ...VALID_STANDARD, cert_lab: 'GIA' })
    expect(r.success).toBe(false)
    const paths = (r as { error: { errors: { path: string[] }[] } }).error.errors.map((e) => e.path[0])
    expect(paths).toContain('cert_number')
  })

  it('rejects cert_number without cert_lab', () => {
    const r = CreateDiamondSchema.safeParse({ ...VALID_STANDARD, cert_number: '123456' })
    expect(r.success).toBe(false)
  })

  it('accepts both cert_lab and cert_number together', () => {
    const r = CreateDiamondSchema.safeParse({ ...VALID_STANDARD, cert_lab: 'GIA', cert_number: '123456' })
    expect(r.success).toBe(true)
  })

  it('rejects is_visible=true without cert fields', () => {
    const r = CreateDiamondSchema.safeParse({ ...VALID_STANDARD, is_visible: true, retail_price_amount: 100000 })
    expect(r.success).toBe(false)
  })

  it('rejects is_visible=true without retail_price_amount', () => {
    const r = CreateDiamondSchema.safeParse({ ...VALID_STANDARD, is_visible: true, cert_lab: 'GIA', cert_number: '123' })
    expect(r.success).toBe(false)
  })

  it('accepts is_visible=true with all required fields', () => {
    const r = CreateDiamondSchema.safeParse({
      ...VALID_STANDARD,
      is_visible:           true,
      cert_lab:             'GIA',
      cert_number:          '123456',
      retail_price_amount:  100000,
    })
    expect(r.success).toBe(true)
  })

  it('applies default fluorescence=None', () => {
    const r = CreateDiamondSchema.safeParse(VALID_STANDARD)
    expect(r.success && r.data.fluorescence).toBe('None')
  })

  it('applies default is_visible=false', () => {
    const r = CreateDiamondSchema.safeParse(VALID_STANDARD)
    expect(r.success && r.data.is_visible).toBe(false)
  })

  it('rejects negative carat', () => {
    const r = CreateDiamondSchema.safeParse({ ...VALID_STANDARD, carat: -1 })
    expect(r.success).toBe(false)
  })

  it('rejects invalid shape', () => {
    const r = CreateDiamondSchema.safeParse({ ...VALID_STANDARD, shape: 'hexagon' })
    expect(r.success).toBe(false)
  })
})

describe('UpdateDiamondSchema', () => {
  it('accepts an empty patch (all fields optional)', () => {
    const r = UpdateDiamondSchema.safeParse({})
    expect(r.success).toBe(true)
  })

  it('accepts a single-field patch', () => {
    const r = UpdateDiamondSchema.safeParse({ internal_notes: 'updated note' })
    expect(r.success).toBe(true)
  })

  it('rejects a colour field inconsistency in the patch', () => {
    const r = UpdateDiamondSchema.safeParse({
      colour_category: 'fancy',
      colour_grade:    'D', // must be null for fancy
    })
    expect(r.success).toBe(false)
  })

  it('accepts valid partial cert fields together', () => {
    const r = UpdateDiamondSchema.safeParse({ cert_lab: 'IGI', cert_number: '99999' })
    expect(r.success).toBe(true)
  })
})

describe('PlaceHoldSchema', () => {
  it('rejects past hold_expires_at', () => {
    const r = PlaceHoldSchema.safeParse({
      diamond_id:      'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      hold_expires_at: '2020-01-01T00:00:00Z',
      hold_reason:     'Client viewing',
    })
    expect(r.success).toBe(false)
  })

  it('accepts future hold_expires_at', () => {
    const future = new Date(Date.now() + 3_600_000).toISOString()
    const r = PlaceHoldSchema.safeParse({
      diamond_id:      'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      hold_expires_at: future,
      hold_reason:     'Client viewing',
    })
    expect(r.success).toBe(true)
  })
})

describe('ExtendHoldSchema', () => {
  it('rejects past new_expires_at', () => {
    const r = ExtendHoldSchema.safeParse({
      diamond_id:     'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      new_expires_at: '2020-01-01T00:00:00Z',
    })
    expect(r.success).toBe(false)
  })
})
