import type { Metadata } from 'next'
import { requireStaffRole } from '@/lib/staff'
import { listDiamonds } from '@/lib/diamonds/service'
import { listSuppliers } from '@/lib/suppliers/service'
import { SupplierFilterSchema } from '@/lib/suppliers/schemas'
import {
  parseDiamondListParams,
  filterToParams,
  statusTabHref,
  sortHref,
  pageHref,
} from '@/lib/diamonds/list-params'
import { DIAMOND_SORT_FIELDS } from '@/lib/diamonds/schemas'
import type { DiamondFilter } from '@/lib/diamonds/schemas'
import type { DiamondFull, DiamondSalesView, DiamondStatus, PaginatedResult } from '@/lib/diamonds/types'
import type { StaffUser } from '@/lib/staff-shared'

export const metadata: Metadata = {
  title: 'Diamonds — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function isPrivilegedActor(actor: StaffUser): boolean {
  return actor.roles.some((r) => r === 'super_admin' || r === 'diamond_buyer')
}

// ── Sort label map ────────────────────────────────────────────────────────────

const SORT_LABELS: Record<(typeof DIAMOND_SORT_FIELDS)[number], string> = {
  created_at:           'Date',
  carat:                'Carat',
  retail_price_amount:  'Price',
  status:               'Status',
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default async function DiamondsListPage({ searchParams }: Props) {
  // content_editor → /admin/forbidden; unauthenticated → /admin/login
  const actor      = await requireStaffRole(['super_admin', 'diamond_buyer', 'sales_adviser'])
  const sp         = await searchParams
  const privileged = isPrivilegedActor(actor)

  const filter     = parseDiamondListParams(sp, privileged)
  const result     = await listDiamonds(actor, filter)
  const { page, total, limit } = result
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const baseParams = filterToParams(filter, privileged)

  // Supplier dropdown (privileged only — one extra query per page render, small table)
  let supplierOptions: { id: string; code: string }[] = []
  if (privileged) {
    const { items } = await listSuppliers(actor, SupplierFilterSchema.parse({ page: 1, limit: 200 }))
    supplierOptions = items.map((s) => ({ id: s.id, code: s.code }))
  }

  // Determine active status tab
  const activeStatus  = filter.status?.[0] as DiamondStatus | undefined
  const activeExpired = filter.expired_hold === true

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-light tracking-widest text-white">DIAMONDS</h1>
        <p className="mt-1 text-sm text-neutral-400">
          {total} diamond{total !== 1 ? 's' : ''}
          {filter.status?.[0] && ` · filtered by ${filter.status[0].replace('_', ' ')}`}
          {filter.expired_hold && ' · expired holds only'}
        </p>
      </div>

      <div className="flex gap-8">
        {/* Filter sidebar */}
        <aside className="w-56 shrink-0">
          <form method="GET" action="/admin/diamonds" className="space-y-5">
            {/* Preserve sort across filter submissions */}
            {filter.sort_by !== 'created_at' && (
              <input type="hidden" name="sort_by" value={filter.sort_by} />
            )}
            {filter.sort_dir !== 'desc' && (
              <input type="hidden" name="sort_dir" value={filter.sort_dir} />
            )}
            {/* Preserve status tab across filter submissions */}
            {activeStatus   && <input type="hidden" name="status"       value={activeStatus} />}
            {activeExpired  && <input type="hidden" name="expired_hold" value="true" />}

            <FilterSection label="Shape">
              <select name="shape" defaultValue={filter.shape?.[0] ?? ''} className={selectCls}>
                <option value="">All shapes</option>
                {['round','oval','princess','emerald','cushion','pear','marquise',
                  'radiant','asscher','heart','trilliant','baguette','old_european','old_mine'].map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </FilterSection>

            <FilterSection label="Origin">
              <select name="origin" defaultValue={filter.origin ?? ''} className={selectCls}>
                <option value="">All origins</option>
                <option value="natural">Natural</option>
                <option value="lab_grown">Lab grown</option>
              </select>
            </FilterSection>

            <FilterSection label="Colour">
              <select name="colour_category" defaultValue={filter.colour_category ?? ''} className={selectCls}>
                <option value="">All categories</option>
                <option value="standard">Standard</option>
                <option value="fancy">Fancy</option>
              </select>
              <select name="colour_grade" defaultValue={filter.colour_grade ?? ''} className={`${selectCls} mt-1`}>
                <option value="">All grades</option>
                {['D','E','F','G','H','I','J','K','L','M'].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <select name="fancy_colour_hue" defaultValue={filter.fancy_colour_hue ?? ''} className={`${selectCls} mt-1`}>
                <option value="">Any hue</option>
                {['yellow','pink','blue','green','brown','grey','black','orange','red','violet'].map((h) => (
                  <option key={h} value={h}>{h.charAt(0).toUpperCase() + h.slice(1)}</option>
                ))}
              </select>
              <select name="fancy_colour_intensity" defaultValue={filter.fancy_colour_intensity ?? ''} className={`${selectCls} mt-1`}>
                <option value="">Any intensity</option>
                {['Faint','Very Light','Light','Fancy Light','Fancy','Fancy Intense',
                  'Fancy Vivid','Fancy Deep','Fancy Dark'].map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </FilterSection>

            <FilterSection label="Carat">
              <div className="flex items-center gap-1">
                <input type="number" name="min_carat" step="0.01" min="0" placeholder="Min"
                  defaultValue={filter.min_carat ?? ''} className={`${inputCls} w-1/2`} />
                <span className="text-neutral-600">–</span>
                <input type="number" name="max_carat" step="0.01" min="0" placeholder="Max"
                  defaultValue={filter.max_carat ?? ''} className={`${inputCls} w-1/2`} />
              </div>
            </FilterSection>

            <FilterSection label="Retail price">
              <div className="flex items-center gap-1">
                <input type="number" name="min_price" step="1" min="0" placeholder="Min"
                  defaultValue={filter.min_price ?? ''} className={`${inputCls} w-1/2`} />
                <span className="text-neutral-600">–</span>
                <input type="number" name="max_price" step="1" min="0" placeholder="Max"
                  defaultValue={filter.max_price ?? ''} className={`${inputCls} w-1/2`} />
              </div>
            </FilterSection>

            <FilterSection label="Certificate lab">
              <select name="cert_lab" defaultValue={filter.cert_lab ?? ''} className={selectCls}>
                <option value="">Any lab</option>
                {['GIA','IGI','HRD','AGS','GCAL'].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </FilterSection>

            <FilterSection label="Expired holds">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="expired_hold" value="true"
                  defaultChecked={filter.expired_hold === true}
                  className="h-3.5 w-3.5 accent-amber-600" />
                <span className="text-xs text-neutral-400">Show expired holds only</span>
              </label>
            </FilterSection>

            {privileged && (
              <>
                <FilterSection label="Supplier">
                  <select name="supplier_id" defaultValue={filter.supplier_id ?? ''} className={selectCls}>
                    <option value="">All suppliers</option>
                    {supplierOptions.map((s) => (
                      <option key={s.id} value={s.id}>{s.code}</option>
                    ))}
                  </select>
                </FilterSection>

                <FilterSection label="Visibility">
                  <select name="is_visible" defaultValue={
                    filter.is_visible === true ? 'true' : filter.is_visible === false ? 'false' : ''
                  } className={selectCls}>
                    <option value="">All inventory</option>
                    <option value="true">Visible on storefront</option>
                    <option value="false">Hidden</option>
                  </select>
                </FilterSection>
              </>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 rounded bg-amber-700 py-1.5 text-xs font-medium tracking-wide text-white transition-colors hover:bg-amber-600"
              >
                Apply
              </button>
              <a
                href="/admin/diamonds"
                className="flex-1 rounded border border-neutral-700 py-1.5 text-center text-xs text-neutral-400 transition-colors hover:border-neutral-500 hover:text-neutral-200"
              >
                Clear
              </a>
            </div>
          </form>
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          {/* Status tabs */}
          <div className="mb-4 flex gap-0 border-b border-neutral-800">
            {[
              { label: 'All',            status: undefined,    expiredHold: false },
              { label: 'Available',      status: 'available' as DiamondStatus, expiredHold: false },
              { label: 'On hold',        status: 'on_hold'   as DiamondStatus, expiredHold: false },
              { label: 'Hold expired',   status: undefined,    expiredHold: true  },
              { label: 'Reserved',       status: 'reserved'  as DiamondStatus, expiredHold: false },
              ...(privileged
                ? [
                    { label: 'Sold',    status: 'sold'    as DiamondStatus, expiredHold: false },
                    { label: 'Removed', status: 'removed' as DiamondStatus, expiredHold: false },
                  ]
                : []),
            ].map(({ label, status, expiredHold }) => {
              const isActive =
                expiredHold
                  ? activeExpired
                  : status === activeStatus && !activeExpired
              return (
                <a
                  key={label}
                  href={statusTabHref(status, expiredHold, filter, privileged)}
                  className={`-mb-px border-b-2 px-3 py-2 text-xs transition-colors ${
                    isActive
                      ? 'border-amber-600 text-white'
                      : 'border-transparent text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {label}
                </a>
              )
            })}
          </div>

          {/* Sort bar */}
          <div className="mb-4 flex items-center gap-1 text-xs text-neutral-500">
            <span className="mr-1 text-neutral-600">Sort:</span>
            {DIAMOND_SORT_FIELDS.map((field) => {
              const isActive = filter.sort_by === field
              const dir      = isActive ? filter.sort_dir : 'desc'
              return (
                <a
                  key={field}
                  href={sortHref(field, filter, privileged)}
                  className={`rounded px-2 py-1 transition-colors ${
                    isActive
                      ? 'bg-neutral-800 text-white'
                      : 'hover:text-neutral-300'
                  }`}
                >
                  {SORT_LABELS[field]}
                  {isActive && <span className="ml-1 text-amber-600">{dir === 'asc' ? '↑' : '↓'}</span>}
                </a>
              )
            })}
          </div>

          {/* Table */}
          {result.items.length === 0 ? (
            <div className="rounded border border-neutral-800 bg-neutral-900/50 px-6 py-12 text-center">
              <p className="text-sm text-neutral-500">No diamonds found.</p>
              <a href="/admin/diamonds" className="mt-3 block text-xs text-neutral-600 hover:text-neutral-400">
                Clear all filters
              </a>
            </div>
          ) : privileged ? (
            <PrivilegedTable items={(result as PaginatedResult<DiamondFull>).items} />
          ) : (
            <SalesAdviserTable items={(result as PaginatedResult<DiamondSalesView>).items} />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
              <span>Page {page} of {totalPages} · {total} total</span>
              <div className="flex gap-2">
                {page > 1 && (
                  <a
                    href={pageHref(page - 1, filter, privileged)}
                    className="rounded border border-neutral-700 px-3 py-1 text-xs hover:border-neutral-500 hover:text-neutral-300"
                  >
                    Previous
                  </a>
                )}
                {page < totalPages && (
                  <a
                    href={pageHref(page + 1, filter, privileged)}
                    className="rounded border border-neutral-700 px-3 py-1 text-xs hover:border-neutral-500 hover:text-neutral-300"
                  >
                    Next
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Privileged table (super_admin / diamond_buyer) ────────────────────────────

function PrivilegedTable({ items }: { items: DiamondFull[] }) {
  return (
    <div className="overflow-hidden rounded border border-neutral-800">
      <table className="w-full text-sm">
        <thead className="border-b border-neutral-800 bg-neutral-900/50">
          <tr>
            {['SKU', 'Shape / Carat', 'Colour', 'Clarity', 'Cert', 'Price', 'Supplier', 'Vis', 'Status'].map((h) => (
              <th key={h} className="px-3 py-3 text-left text-xs font-semibold tracking-widest text-neutral-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800/60">
          {items.map((d) => (
            <tr key={d.id} className="transition-colors hover:bg-neutral-900/40">
              <td className="px-3 py-3 font-mono text-xs text-neutral-300">{d.sku}</td>
              <td className="px-3 py-3 text-neutral-300">
                <span className="capitalize">{d.shape.replace('_', ' ')}</span>
                <span className="ml-1 text-neutral-500">{d.carat.toFixed(2)}ct</span>
              </td>
              <td className="px-3 py-3 text-neutral-400">{displayColour(d)}</td>
              <td className="px-3 py-3 text-neutral-400">{d.clarity}</td>
              <td className="px-3 py-3 text-neutral-400">
                {d.cert_lab ? (
                  <span>{d.cert_lab} <span className="text-neutral-600">{d.cert_number}</span></span>
                ) : (
                  <span className="text-neutral-700">—</span>
                )}
              </td>
              <td className="px-3 py-3 text-neutral-300">
                {d.retail_price_amount != null
                  ? new Intl.NumberFormat('en-US', {
                      style: 'currency', currency: d.retail_price_currency, maximumFractionDigits: 0,
                    }).format(d.retail_price_amount)
                  : <span className="text-neutral-700">—</span>}
              </td>
              <td className="px-3 py-3 font-mono text-xs text-neutral-500">
                {d.supplier_code ?? <span className="text-neutral-700">—</span>}
              </td>
              <td className="px-3 py-3">
                {d.is_visible
                  ? <span className="text-xs text-emerald-600">Vis</span>
                  : <span className="text-xs text-neutral-700">—</span>}
              </td>
              <td className="px-3 py-3">
                <DiamondStatusBadge
                  status={d.status}
                  holdIsExpired={d.holdIsExpired}
                  holdExpiresAt={d.hold_expires_at}
                  isMyHold={false}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Sales adviser table ───────────────────────────────────────────────────────
// Columns: SKU, Shape/Carat, Colour, Clarity, Cert (lab + number), Price, Status
// Omitted: supplier, cost, is_visible, held_by_user_id, internal_notes, hold_reason
// (hold_reason absent per T5 spec — only shown on detail page)

function SalesAdviserTable({ items }: { items: DiamondSalesView[] }) {
  return (
    <div className="overflow-hidden rounded border border-neutral-800">
      <table className="w-full text-sm">
        <thead className="border-b border-neutral-800 bg-neutral-900/50">
          <tr>
            {['SKU', 'Shape / Carat', 'Colour', 'Clarity', 'Cert', 'Price', 'Status'].map((h) => (
              <th key={h} className="px-3 py-3 text-left text-xs font-semibold tracking-widest text-neutral-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800/60">
          {items.map((d) => (
            <tr key={d.id} className="transition-colors hover:bg-neutral-900/40">
              <td className="px-3 py-3 font-mono text-xs text-neutral-300">{d.sku}</td>
              <td className="px-3 py-3 text-neutral-300">
                <span className="capitalize">{d.shape.replace('_', ' ')}</span>
                <span className="ml-1 text-neutral-500">{d.carat.toFixed(2)}ct</span>
              </td>
              <td className="px-3 py-3 text-neutral-400">{displayColour(d)}</td>
              <td className="px-3 py-3 text-neutral-400">{d.clarity}</td>
              <td className="px-3 py-3 text-neutral-400">
                {d.cert_lab ? (
                  <span>{d.cert_lab} <span className="text-neutral-600">{d.cert_number}</span></span>
                ) : (
                  <span className="text-neutral-700">—</span>
                )}
              </td>
              <td className="px-3 py-3 text-neutral-300">
                {d.retail_price_amount != null
                  ? new Intl.NumberFormat('en-US', {
                      style: 'currency', currency: d.retail_price_currency, maximumFractionDigits: 0,
                    }).format(d.retail_price_amount)
                  : <span className="text-neutral-700">—</span>}
              </td>
              <td className="px-3 py-3">
                <DiamondStatusBadge
                  status={d.status}
                  holdIsExpired={d.holdIsExpired}
                  holdExpiresAt={d.hold_expires_at}
                  isMyHold={d.isMyHold}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────

interface BadgeProps {
  status:       DiamondStatus
  holdIsExpired: boolean
  holdExpiresAt: string | null
  isMyHold:     boolean
}

function DiamondStatusBadge({ status, holdIsExpired, holdExpiresAt, isMyHold }: BadgeProps) {
  if (status === 'on_hold' && holdIsExpired) {
    return (
      <span className="inline-flex flex-col gap-0.5">
        <span className="inline-flex items-center gap-1 text-xs text-red-400">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
          Hold expired
        </span>
        {holdExpiresAt && (
          <span className="text-[10px] text-neutral-600">{fmtDate(holdExpiresAt)}</span>
        )}
      </span>
    )
  }

  if (status === 'on_hold') {
    return (
      <span className="inline-flex flex-col gap-0.5">
        <span className={`inline-flex items-center gap-1 text-xs ${isMyHold ? 'text-amber-400' : 'text-amber-600'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isMyHold ? 'bg-amber-400' : 'bg-amber-600'}`} />
          {isMyHold ? 'My hold' : 'On hold'}
        </span>
        {holdExpiresAt && (
          <span className="text-[10px] text-neutral-600">until {fmtDate(holdExpiresAt)}</span>
        )}
      </span>
    )
  }

  const CONFIG: Record<DiamondStatus, { label: string; cls: string; dot?: string }> = {
    available: { label: 'Available', cls: 'text-emerald-400', dot: 'bg-emerald-400' },
    on_hold:   { label: 'On hold',   cls: 'text-amber-600',   dot: 'bg-amber-600'   },
    reserved:  { label: 'Reserved',  cls: 'text-blue-400',    dot: 'bg-blue-400'    },
    sold:      { label: 'Sold',      cls: 'text-neutral-500'                        },
    removed:   { label: 'Removed',   cls: 'text-neutral-700'                        },
  }

  const { label, cls, dot } = CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${cls}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
      {label}
    </span>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function displayColour(d: Pick<DiamondFull | DiamondSalesView, 'colour_category' | 'colour_grade' | 'fancy_colour_hue' | 'fancy_colour_intensity'>): string {
  if (d.colour_category === 'standard') return d.colour_grade ?? '—'
  const parts = [d.fancy_colour_hue, d.fancy_colour_intensity].filter(Boolean)
  return parts.length > 0
    ? parts.map((p) => (p as string).charAt(0).toUpperCase() + (p as string).slice(1)).join(' ')
    : '—'
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold tracking-widest text-neutral-600 uppercase">{label}</p>
      {children}
    </div>
  )
}

const selectCls =
  'w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-xs text-neutral-300 focus:border-amber-700 focus:outline-none'

const inputCls =
  'rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-xs text-neutral-300 focus:border-amber-700 focus:outline-none'
