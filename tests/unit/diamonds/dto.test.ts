import { describe, it, expect } from 'vitest'
import { toDiamondFull, toDiamondSalesView } from '@/lib/diamonds/types'
import type { DiamondRecord } from '@/lib/diamonds/types'
import type { StaffUser } from '@/lib/staff-shared'

const BASE_RECORD: DiamondRecord = {
  id:                      'dia-001',
  sku:                     'SKU-001',
  supplier_id:             'sup-001',
  supplier_sku:            'EXT-001',
  origin:                  'natural',
  colour_category:         'standard',
  colour_grade:            'G',
  fancy_colour_hue:        null,
  fancy_colour_intensity:  null,
  fancy_colour_overtone:   null,
  shape:                   'round',
  carat:                   '1.500',
  clarity:                 'VS1',
  cut:                     'Excellent',
  polish:                  'Excellent',
  symmetry:                'Very Good',
  fluorescence:            'None',
  meas_length_mm:          '7.200',
  meas_width_mm:           '7.190',
  meas_depth_mm:           '4.430',
  table_pct:               '57.0',
  depth_pct:               '61.5',
  girdle:                  'Medium',
  culet:                   'None',
  cert_lab:                'GIA',
  cert_number:             '6178500192',
  cert_pdf_path:           'dia-001/certificate-abc123.pdf',
  retail_price_amount:     1500000,
  retail_price_currency:   'AED',
  supplier_cost_amount:    300000,
  supplier_cost_currency:  'USD',
  status:                  'available',
  is_visible:              true,
  held_by_user_id:         null,
  held_at:                 null,
  hold_expires_at:         null,
  hold_reason:             null,
  selection_note:          'Beautiful stone',
  internal_notes:          'Bought from supplier in Jan',
  last_availability_check: '2026-01-10T09:00:00Z',
  created_at:              '2026-01-01T00:00:00Z',
  updated_at:              '2026-01-10T09:00:00Z',
  created_by:              'user-admin',
  updated_by:              'user-admin',
}

const ACTOR_ADMIN: StaffUser = {
  id:       'user-admin',
  email:    'admin@example.com',
  fullName: 'Admin User',
  roles:    ['super_admin'],
}

const ACTOR_SALES: StaffUser = {
  id:       'user-sales',
  email:    'sales@example.com',
  fullName: 'Sales User',
  roles:    ['sales_adviser'],
}

describe('toDiamondFull', () => {
  it('parses carat from string to number', () => {
    const full = toDiamondFull(BASE_RECORD)
    expect(full.carat).toBe(1.5)
  })

  it('parses measurement strings to numbers', () => {
    const full = toDiamondFull(BASE_RECORD)
    expect(full.meas_length_mm).toBe(7.2)
    expect(full.meas_width_mm).toBe(7.19)
    expect(full.meas_depth_mm).toBe(4.43)
    expect(full.table_pct).toBe(57.0)
    expect(full.depth_pct).toBe(61.5)
  })

  it('handles null numeric fields', () => {
    const record = { ...BASE_RECORD, meas_length_mm: null, table_pct: null }
    const full = toDiamondFull(record)
    expect(full.meas_length_mm).toBeNull()
    expect(full.table_pct).toBeNull()
  })

  it('excludes cert_pdf_path', () => {
    const full = toDiamondFull(BASE_RECORD)
    expect('cert_pdf_path' in full).toBe(false)
  })

  it('includes supplier identity and cost fields', () => {
    const full = toDiamondFull(BASE_RECORD)
    expect(full.supplier_id).toBe('sup-001')
    expect(full.supplier_sku).toBe('EXT-001')
    expect(full.supplier_cost_amount).toBe(300000)
    expect(full.supplier_cost_currency).toBe('USD')
    expect(full.internal_notes).toBe('Bought from supplier in Jan')
  })

  it('computes holdIsExpired=false for available diamond', () => {
    const full = toDiamondFull(BASE_RECORD)
    expect(full.holdIsExpired).toBe(false)
  })

  it('computes holdIsExpired=true when on_hold with past expiry', () => {
    const record: DiamondRecord = {
      ...BASE_RECORD,
      status:         'on_hold',
      held_by_user_id: 'user-sales',
      held_at:        '2025-01-01T00:00:00Z',
      hold_expires_at: '2025-01-02T00:00:00Z', // past
    }
    const full = toDiamondFull(record)
    expect(full.holdIsExpired).toBe(true)
  })

  it('computes holdIsExpired=false when on_hold with future expiry', () => {
    const future = new Date(Date.now() + 3_600_000).toISOString()
    const record: DiamondRecord = {
      ...BASE_RECORD,
      status:          'on_hold',
      held_by_user_id: 'user-sales',
      held_at:         new Date().toISOString(),
      hold_expires_at: future,
    }
    const full = toDiamondFull(record)
    expect(full.holdIsExpired).toBe(false)
  })
})

describe('toDiamondSalesView', () => {
  it('excludes supplier identity fields', () => {
    const view = toDiamondSalesView(BASE_RECORD, ACTOR_SALES)
    expect('supplier_id'  in view).toBe(false)
    expect('supplier_sku' in view).toBe(false)
  })

  it('excludes cost fields', () => {
    const view = toDiamondSalesView(BASE_RECORD, ACTOR_SALES)
    expect('supplier_cost_amount'   in view).toBe(false)
    expect('supplier_cost_currency' in view).toBe(false)
  })

  it('excludes internal_notes', () => {
    const view = toDiamondSalesView(BASE_RECORD, ACTOR_SALES)
    expect('internal_notes' in view).toBe(false)
  })

  it('excludes held_by_user_id', () => {
    const view = toDiamondSalesView(BASE_RECORD, ACTOR_SALES)
    expect('held_by_user_id' in view).toBe(false)
  })

  it('excludes cert_pdf_path', () => {
    const view = toDiamondSalesView(BASE_RECORD, ACTOR_SALES)
    expect('cert_pdf_path' in view).toBe(false)
  })

  it('sets isMyHold=true when held by the acting user', () => {
    const record: DiamondRecord = {
      ...BASE_RECORD,
      status:          'on_hold',
      held_by_user_id: ACTOR_SALES.id,
      hold_reason:     'Client showing',
    }
    const view = toDiamondSalesView(record, ACTOR_SALES)
    expect(view.isMyHold).toBe(true)
    expect(view.hold_reason).toBe('Client showing')
  })

  it('sets isMyHold=false and nulls hold_reason when held by another user', () => {
    const record: DiamondRecord = {
      ...BASE_RECORD,
      status:          'on_hold',
      held_by_user_id: 'other-user',
      hold_reason:     'Secret reason',
    }
    const view = toDiamondSalesView(record, ACTOR_SALES)
    expect(view.isMyHold).toBe(false)
    expect(view.hold_reason).toBeNull()
  })

  it('parses numeric string columns', () => {
    const view = toDiamondSalesView(BASE_RECORD, ACTOR_SALES)
    expect(view.carat).toBe(1.5)
    expect(view.meas_length_mm).toBe(7.2)
  })
})
