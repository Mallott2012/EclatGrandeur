// Pure URL search-parameter utilities for /admin/diamonds.
// No server-only guard — these are pure functions safe to import in both
// server components and unit tests.

import {
  DiamondFilterSchema,
  DIAMOND_SORT_FIELDS,
  DIAMOND_ORIGINS,
  DIAMOND_SHAPES,
  DIAMOND_COLOUR_GRADES,
  CERTIFICATE_LABS,
  COLOUR_CATEGORIES,
  FANCY_COLOUR_INTENSITIES,
} from './schemas'
import { FANCY_HUES } from './types'
import type { DiamondFilter, DiamondSortField } from './schemas'
import type { DiamondStatus } from './types'

type RawParams = Record<string, string | string[] | undefined>

// Returns the first string value; undefined for empty/missing.
function str(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v
  return s && s.length > 0 ? s : undefined
}

// Parses a numeric string; returns undefined for NaN or non-finite.
function num(v: string | string[] | undefined): number | undefined {
  const s = str(v)
  if (!s) return undefined
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
}

// Returns value only if it is a member of the enum array.
function validEnum<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
): T | undefined {
  if (!value) return undefined
  return (allowed as readonly string[]).includes(value) ? (value as T) : undefined
}

// ── Parse URL params → DiamondFilter ─────────────────────────────────────────

export function parseDiamondListParams(
  sp: RawParams,
  privileged: boolean,
): DiamondFilter {
  const sortByRaw = str(sp.sort_by)
  const validSortBy = (DIAMOND_SORT_FIELDS as readonly string[]).includes(sortByRaw ?? '')
    ? (sortByRaw as DiamondSortField)
    : undefined

  const shapeRaw  = validEnum(str(sp.shape),  DIAMOND_SHAPES)
  const statusRaw = validEnum(str(sp.status), ['available', 'on_hold', 'reserved', 'sold', 'removed'] as const)

  const raw: Record<string, unknown> = {
    page:     Math.max(1, Math.round(num(sp.page) ?? 1)),
    limit:    50,
    status:   statusRaw ? [statusRaw] : undefined,
    shape:    shapeRaw  ? [shapeRaw]  : undefined,
    cert_lab: validEnum(str(sp.cert_lab), CERTIFICATE_LABS),
    origin:   validEnum(str(sp.origin),   DIAMOND_ORIGINS),
    colour_category:        validEnum(str(sp.colour_category),        COLOUR_CATEGORIES),
    colour_grade:           validEnum(str(sp.colour_grade),           DIAMOND_COLOUR_GRADES),
    fancy_colour_hue:       validEnum(str(sp.fancy_colour_hue),       FANCY_HUES),
    fancy_colour_intensity: validEnum(str(sp.fancy_colour_intensity), FANCY_COLOUR_INTENSITIES),
    min_carat: num(sp.min_carat),
    max_carat: num(sp.max_carat),
    min_price: sp.min_price ? (Math.round(num(sp.min_price) ?? 0) || undefined) : undefined,
    max_price: sp.max_price ? (Math.round(num(sp.max_price) ?? 0) || undefined) : undefined,
    expired_hold: str(sp.expired_hold) === 'true' ? true : undefined,
    sort_by:  validSortBy,
    sort_dir: str(sp.sort_dir) === 'asc' ? 'asc' : undefined,
  }

  // Privileged-only fields — scrubbed entirely for sales_adviser regardless of
  // what the URL contains. The service also enforces statusOverride for
  // non-privileged actors, but scrubbing here prevents supplier_id and
  // is_visible from reaching the repository layer at all.
  if (privileged) {
    // supplier_id is a UUID — pass as-is; Zod validates the format.
    raw.supplier_id     = str(sp.supplier_id)
    raw.is_visible      =
      str(sp.is_visible) === 'true'  ? true  :
      str(sp.is_visible) === 'false' ? false :
      undefined
    const staleDays = sp.stale_check_days ? Math.round(num(sp.stale_check_days) ?? 0) : 0
    raw.stale_check_days = staleDays >= 1 ? staleDays : undefined
  }

  // All enum fields have been pre-validated above; Zod parse should always
  // succeed. If it fails (e.g. a range violation on min_carat), fall back to
  // clean defaults so the page never throws on a crafted URL.
  const parsed = DiamondFilterSchema.safeParse(raw)
  return parsed.success
    ? parsed.data
    : DiamondFilterSchema.parse({ page: raw.page, limit: raw.limit })
}

// ── Serialise DiamondFilter → URLSearchParams ─────────────────────────────────
// Omits default values so URLs stay clean.

export function filterToParams(filter: DiamondFilter, privileged: boolean): URLSearchParams {
  const p = new URLSearchParams()
  if (filter.page > 1)              p.set('page', String(filter.page))
  if (filter.status?.[0])           p.set('status', filter.status[0])
  if (filter.shape?.[0])            p.set('shape', filter.shape[0])
  if (filter.origin)                p.set('origin', filter.origin)
  if (filter.colour_category)       p.set('colour_category', filter.colour_category)
  if (filter.colour_grade)          p.set('colour_grade', filter.colour_grade)
  if (filter.fancy_colour_hue)      p.set('fancy_colour_hue', filter.fancy_colour_hue)
  if (filter.fancy_colour_intensity) p.set('fancy_colour_intensity', filter.fancy_colour_intensity)
  if (filter.cert_lab)              p.set('cert_lab', filter.cert_lab)
  if (filter.min_carat != null)     p.set('min_carat', String(filter.min_carat))
  if (filter.max_carat != null)     p.set('max_carat', String(filter.max_carat))
  if (filter.min_price != null)     p.set('min_price', String(filter.min_price))
  if (filter.max_price != null)     p.set('max_price', String(filter.max_price))
  if (filter.expired_hold)          p.set('expired_hold', 'true')
  if (filter.sort_by !== 'created_at') p.set('sort_by', filter.sort_by)
  if (filter.sort_dir !== 'desc')   p.set('sort_dir', filter.sort_dir)
  if (privileged) {
    if (filter.supplier_id)         p.set('supplier_id', filter.supplier_id)
    if (filter.is_visible !== undefined) p.set('is_visible', String(filter.is_visible))
    if (filter.stale_check_days)    p.set('stale_check_days', String(filter.stale_check_days))
  }
  return p
}

// ── href builders ─────────────────────────────────────────────────────────────

const BASE = '/admin/diamonds'

function href(p: URLSearchParams): string {
  const qs = p.toString()
  return qs ? `${BASE}?${qs}` : BASE
}

export function statusTabHref(
  status: DiamondStatus | undefined,
  expiredHold: boolean,
  filter: DiamondFilter,
  privileged: boolean,
): string {
  const p = filterToParams(filter, privileged)
  p.delete('status')
  p.delete('expired_hold')
  p.delete('page')
  if (status)      p.set('status', status)
  if (expiredHold) p.set('expired_hold', 'true')
  return href(p)
}

export function sortHref(
  field: DiamondSortField,
  filter: DiamondFilter,
  privileged: boolean,
): string {
  const newDir =
    filter.sort_by === field ? (filter.sort_dir === 'asc' ? 'desc' : 'asc') : 'desc'
  const p = filterToParams(filter, privileged)
  p.delete('page')
  if (field === 'created_at') { p.delete('sort_by') } else { p.set('sort_by', field) }
  if (newDir === 'desc') { p.delete('sort_dir') } else { p.set('sort_dir', newDir) }
  return href(p)
}

export function pageHref(
  newPage: number,
  filter: DiamondFilter,
  privileged: boolean,
): string {
  const p = filterToParams(filter, privileged)
  if (newPage <= 1) { p.delete('page') } else { p.set('page', String(newPage)) }
  return href(p)
}

// Re-export for convenience in tests.
export type { DiamondSortField }
