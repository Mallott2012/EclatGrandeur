import { describe, it, expect } from 'vitest'
import {
  parseDiamondListParams,
  filterToParams,
  statusTabHref,
  sortHref,
  pageHref,
} from '@/lib/diamonds/list-params'
import { DiamondFilterSchema } from '@/lib/diamonds/schemas'

// parseDiamondListParams and filterToParams are pure functions — no mocks needed.

const DEFAULT = DiamondFilterSchema.parse({})

// ── parseDiamondListParams — privileged scrubbing ─────────────────────────────

describe('parseDiamondListParams — field scrubbing', () => {
  it('supplier_id is preserved for privileged actors', () => {
    const f = parseDiamondListParams({ supplier_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' }, true)
    expect(f.supplier_id).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
  })

  it('supplier_id is scrubbed for non-privileged actors', () => {
    const f = parseDiamondListParams({ supplier_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' }, false)
    expect(f.supplier_id).toBeUndefined()
  })

  it('is_visible is preserved for privileged actors', () => {
    const f = parseDiamondListParams({ is_visible: 'true' }, true)
    expect(f.is_visible).toBe(true)
  })

  it('is_visible is scrubbed for non-privileged actors', () => {
    const f = parseDiamondListParams({ is_visible: 'true' }, false)
    expect(f.is_visible).toBeUndefined()
  })

  it('stale_check_days is scrubbed for non-privileged actors', () => {
    const f = parseDiamondListParams({ stale_check_days: '30' }, false)
    expect(f.stale_check_days).toBeUndefined()
  })

  it('stale_check_days is preserved for privileged actors', () => {
    const f = parseDiamondListParams({ stale_check_days: '30' }, true)
    expect(f.stale_check_days).toBe(30)
  })
})

// ── parseDiamondListParams — sort allowlist ───────────────────────────────────

describe('parseDiamondListParams — sort allowlist', () => {
  it('valid sort_by passes through', () => {
    const f = parseDiamondListParams({ sort_by: 'carat' }, false)
    expect(f.sort_by).toBe('carat')
  })

  it('unknown sort_by falls back to default created_at', () => {
    const f = parseDiamondListParams({ sort_by: 'supplier_cost_amount' }, false)
    expect(f.sort_by).toBe('created_at')
  })

  it('SQL-injection-like sort_by is rejected and falls back', () => {
    const f = parseDiamondListParams({ sort_by: "created_at'; DROP TABLE diamonds;--" }, false)
    expect(f.sort_by).toBe('created_at')
  })

  it('sort_dir asc passes through', () => {
    const f = parseDiamondListParams({ sort_dir: 'asc' }, false)
    expect(f.sort_dir).toBe('asc')
  })

  it('unknown sort_dir falls back to default desc', () => {
    const f = parseDiamondListParams({ sort_dir: 'random' }, false)
    expect(f.sort_dir).toBe('desc')
  })
})

// ── parseDiamondListParams — filter parsing ───────────────────────────────────

describe('parseDiamondListParams — filter parsing', () => {
  it('expired_hold=true sets the boolean flag', () => {
    const f = parseDiamondListParams({ expired_hold: 'true' }, false)
    expect(f.expired_hold).toBe(true)
  })

  it('expired_hold omitted leaves the field undefined', () => {
    const f = parseDiamondListParams({}, false)
    expect(f.expired_hold).toBeUndefined()
  })

  it('valid status wraps in array', () => {
    const f = parseDiamondListParams({ status: 'available' }, false)
    expect(f.status).toEqual(['available'])
  })

  it('invalid status is ignored (falls back to undefined)', () => {
    const f = parseDiamondListParams({ status: 'sold_stolen' }, false)
    expect(f.status).toBeUndefined()
  })

  it('valid shape wraps in array', () => {
    const f = parseDiamondListParams({ shape: 'oval' }, false)
    expect(f.shape).toEqual(['oval'])
  })

  it('invalid shape is ignored', () => {
    const f = parseDiamondListParams({ shape: 'hexagon' }, false)
    expect(f.shape).toBeUndefined()
  })

  it('valid origin passes through', () => {
    const f = parseDiamondListParams({ origin: 'lab_grown' }, false)
    expect(f.origin).toBe('lab_grown')
  })

  it('invalid origin is ignored', () => {
    const f = parseDiamondListParams({ origin: 'synthetic' }, false)
    expect(f.origin).toBeUndefined()
  })

  it('min/max carat are parsed as numbers', () => {
    const f = parseDiamondListParams({ min_carat: '0.5', max_carat: '2.0' }, false)
    expect(f.min_carat).toBe(0.5)
    expect(f.max_carat).toBe(2.0)
  })

  it('non-numeric carat is ignored', () => {
    const f = parseDiamondListParams({ min_carat: 'big' }, false)
    expect(f.min_carat).toBeUndefined()
  })

  it('page defaults to 1 when absent', () => {
    const f = parseDiamondListParams({}, false)
    expect(f.page).toBe(1)
  })

  it('page is clamped to minimum 1', () => {
    const f = parseDiamondListParams({ page: '-5' }, false)
    expect(f.page).toBe(1)
  })

  it('limit is fixed at 50', () => {
    const f = parseDiamondListParams({ limit: '200' }, false)
    expect(f.limit).toBe(50)
  })
})

// ── filterToParams — round-trip ───────────────────────────────────────────────

describe('filterToParams', () => {
  it('default filter produces empty params (clean URL)', () => {
    const p = filterToParams(DEFAULT, false)
    expect(p.size).toBe(0)
  })

  it('page 1 is omitted', () => {
    const p = filterToParams({ ...DEFAULT, page: 1 }, false)
    expect(p.has('page')).toBe(false)
  })

  it('page > 1 is included', () => {
    const p = filterToParams({ ...DEFAULT, page: 3 }, false)
    expect(p.get('page')).toBe('3')
  })

  it('sort_by created_at is omitted (default)', () => {
    const p = filterToParams({ ...DEFAULT, sort_by: 'created_at' }, false)
    expect(p.has('sort_by')).toBe(false)
  })

  it('non-default sort_by is included', () => {
    const p = filterToParams({ ...DEFAULT, sort_by: 'carat' }, false)
    expect(p.get('sort_by')).toBe('carat')
  })

  it('supplier_id is included only when privileged', () => {
    const filter = { ...DEFAULT, supplier_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' }
    expect(filterToParams(filter, true).get('supplier_id')).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
    expect(filterToParams(filter, false).has('supplier_id')).toBe(false)
  })

  it('is_visible is included only when privileged', () => {
    const filter = { ...DEFAULT, is_visible: true }
    expect(filterToParams(filter, true).get('is_visible')).toBe('true')
    expect(filterToParams(filter, false).has('is_visible')).toBe(false)
  })
})

// ── statusTabHref ─────────────────────────────────────────────────────────────

describe('statusTabHref', () => {
  it('builds href with status param', () => {
    const url = statusTabHref('available', false, DEFAULT, false)
    expect(url).toBe('/admin/diamonds?status=available')
  })

  it('builds href with expired_hold for the expired tab', () => {
    const url = statusTabHref(undefined, true, DEFAULT, false)
    expect(url).toBe('/admin/diamonds?expired_hold=true')
  })

  it('resets page when changing status tab', () => {
    const filter = { ...DEFAULT, page: 3 }
    const url = statusTabHref('on_hold', false, filter, false)
    expect(url).not.toContain('page=')
    expect(url).toContain('status=on_hold')
  })

  it('preserves sort_by when set', () => {
    const filter = { ...DEFAULT, sort_by: 'carat' as const }
    const url = statusTabHref('available', false, filter, false)
    expect(url).toContain('sort_by=carat')
    expect(url).toContain('status=available')
  })

  it('strips supplier_id from non-privileged status hrefs', () => {
    // supplier_id in filter should not appear for non-privileged (filterToParams scrubs it)
    const filter = { ...DEFAULT, supplier_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' }
    const url = statusTabHref('available', false, filter, false)
    expect(url).not.toContain('supplier_id')
  })
})

// ── sortHref ──────────────────────────────────────────────────────────────────

describe('sortHref', () => {
  it('sets sort_by and uses desc direction by default', () => {
    const url = sortHref('carat', DEFAULT, false)
    expect(url).toContain('sort_by=carat')
    expect(url).not.toContain('sort_dir')
  })

  it('toggles direction when clicking the current sort field (desc → asc)', () => {
    const filter = { ...DEFAULT, sort_by: 'carat' as const, sort_dir: 'desc' as const }
    const url = sortHref('carat', filter, false)
    expect(url).toContain('sort_dir=asc')
  })

  it('toggles direction when clicking the current sort field (asc → desc)', () => {
    const filter = { ...DEFAULT, sort_by: 'carat' as const, sort_dir: 'asc' as const }
    const url = sortHref('carat', filter, false)
    expect(url).not.toContain('sort_dir')
  })

  it('omits sort_by when returning to default created_at', () => {
    const filter = { ...DEFAULT, sort_by: 'carat' as const }
    const url = sortHref('created_at', filter, false)
    expect(url).not.toContain('sort_by')
  })

  it('resets page when changing sort', () => {
    const filter = { ...DEFAULT, page: 4 }
    const url = sortHref('carat', filter, false)
    expect(url).not.toContain('page=')
  })
})

// ── pageHref ──────────────────────────────────────────────────────────────────

describe('pageHref', () => {
  it('page 1 produces a clean URL (no page param)', () => {
    const filter = { ...DEFAULT, page: 3 }
    const url = pageHref(1, filter, false)
    expect(url).not.toContain('page=')
  })

  it('page > 1 includes page param', () => {
    const url = pageHref(5, DEFAULT, false)
    expect(url).toContain('page=5')
  })

  it('preserves current filters when paginating', () => {
    const filter = { ...DEFAULT, sort_by: 'carat' as const, origin: 'natural' as const }
    const url = pageHref(2, filter, false)
    expect(url).toContain('sort_by=carat')
    expect(url).toContain('origin=natural')
    expect(url).toContain('page=2')
  })
})
