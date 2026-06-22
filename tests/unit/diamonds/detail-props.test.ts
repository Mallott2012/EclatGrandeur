import { describe, it, expect } from 'vitest'
import { parseDiamondFormData, zodErrors } from '@/app/admin/(console)/diamonds/form-utils'
import { ZodError, z } from 'zod'
import type { DiamondActionResult } from '@/app/admin/(console)/diamonds/types'
import { DIAMOND_ACTION_INITIAL, DIAMOND_SIMPLE_INITIAL, CERT_URL_INITIAL } from '@/app/admin/(console)/diamonds/types'

// ── parseDiamondFormData ──────────────────────────────────────────────────────

describe('parseDiamondFormData', () => {
  function makeForm(fields: Record<string, string>): FormData {
    const fd = new FormData()
    for (const [k, v] of Object.entries(fields)) fd.set(k, v)
    return fd
  }

  it('parses basic required fields', () => {
    const fd = makeForm({
      origin:           'natural',
      colour_category:  'standard',
      colour_grade:     'G',
      shape:            'round',
      carat:            '1.500',
      clarity:          'VS1',
      polish:           'Excellent',
      symmetry:         'Very Good',
      fluorescence:     'None',
    })
    const result = parseDiamondFormData(fd)
    expect(result.origin).toBe('natural')
    expect(result.carat).toBe(1.5)
    expect(result.colour_grade).toBe('G')
  })

  it('coerces empty strings to null', () => {
    const fd = makeForm({ supplier_id: '', supplier_sku: '', cert_lab: '', cert_number: '' })
    const result = parseDiamondFormData(fd)
    expect(result.supplier_id).toBeNull()
    expect(result.supplier_sku).toBeNull()
    expect(result.cert_lab).toBeNull()
    expect(result.cert_number).toBeNull()
  })

  it('defaults origin to natural when empty', () => {
    const fd = makeForm({ origin: '' })
    expect(parseDiamondFormData(fd).origin).toBe('natural')
  })

  it('defaults fluorescence to None when empty', () => {
    const fd = makeForm({ fluorescence: '' })
    expect(parseDiamondFormData(fd).fluorescence).toBe('None')
  })

  it('reads is_visible as true when value is "on"', () => {
    const fd = new FormData()
    fd.set('is_visible', 'on')
    expect(parseDiamondFormData(fd).is_visible).toBe(true)
  })

  it('reads is_visible as false when absent', () => {
    const fd = new FormData()
    expect(parseDiamondFormData(fd).is_visible).toBe(false)
  })

  it('parses retail_price_amount as integer', () => {
    const fd = makeForm({ retail_price_amount: '5000.99' })
    expect(parseDiamondFormData(fd).retail_price_amount).toBe(5001)
  })

  it('returns null for unparseable number', () => {
    const fd = makeForm({ retail_price_amount: 'abc' })
    expect(parseDiamondFormData(fd).retail_price_amount).toBeNull()
  })

  it('parses fancy colour fields', () => {
    const fd = makeForm({ fancy_colour_hue: 'pink', fancy_colour_intensity: 'Fancy', fancy_colour_overtone: 'Pinkish' })
    const result = parseDiamondFormData(fd)
    expect(result.fancy_colour_hue).toBe('pink')
    expect(result.fancy_colour_intensity).toBe('Fancy')
    expect(result.fancy_colour_overtone).toBe('Pinkish')
  })
})

// ── zodErrors ─────────────────────────────────────────────────────────────────

describe('zodErrors', () => {
  function makeZodError(issues: { path: string[]; message: string }[]): ZodError {
    return new ZodError(
      issues.map((i) => ({
        code:    'custom',
        path:    i.path,
        message: i.message,
      })),
    )
  }

  it('flattens issues to path-keyed object', () => {
    const err = makeZodError([
      { path: ['carat'],   message: 'Must be positive' },
      { path: ['clarity'], message: 'Required' },
    ])
    const result = zodErrors(err)
    expect(result.carat).toBe('Must be positive')
    expect(result.clarity).toBe('Required')
  })

  it('uses _form key when path is empty', () => {
    const err = makeZodError([{ path: [], message: 'Global error' }])
    expect(zodErrors(err)._form).toBe('Global error')
  })

  it('keeps only first error per field', () => {
    const err = makeZodError([
      { path: ['shape'], message: 'First error' },
      { path: ['shape'], message: 'Second error' },
    ])
    const result = zodErrors(err)
    expect(result.shape).toBe('First error')
  })
})

// ── Action result shapes ──────────────────────────────────────────────────────

describe('action result initial values', () => {
  it('DIAMOND_ACTION_INITIAL is failure shape with empty errors', () => {
    expect(DIAMOND_ACTION_INITIAL.success).toBe(false)
    const r = DIAMOND_ACTION_INITIAL as DiamondActionResult
    if (!r.success) {
      expect(r.message).toBe('')
      expect(r.fieldErrors).toEqual({})
    }
  })

  it('DIAMOND_SIMPLE_INITIAL is failure shape', () => {
    expect(DIAMOND_SIMPLE_INITIAL.success).toBe(false)
  })

  it('CERT_URL_INITIAL status is idle', () => {
    expect(CERT_URL_INITIAL.status).toBe('idle')
  })
})
