import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaffRole } from '@/lib/staff'
import { listSuppliers } from '@/lib/suppliers/service'
import { SupplierFilterSchema } from '@/lib/suppliers/schemas'

export const metadata: Metadata = {
  title: 'Suppliers — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

interface Props {
  searchParams: Promise<{ page?: string; active?: string }>
}

export default async function SuppliersListPage({ searchParams }: Props) {
  const actor = await requireStaffRole(['super_admin', 'diamond_buyer'])
  const sp    = await searchParams

  const rawFilter = {
    page:      parseInt(sp.page ?? '1') || 1,
    limit:     50,
    is_active: sp.active === 'true' ? true : sp.active === 'false' ? false : undefined,
  }
  const filter    = SupplierFilterSchema.parse(rawFilter)
  const { items, page, total, limit } = await listSuppliers(actor, filter)

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const activeTab  = sp.active

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-light tracking-widest text-white">SUPPLIERS</h1>
          <p className="mt-1 text-sm text-neutral-400">
            {total} supplier{total !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link
          href="/admin/suppliers/new"
          className="rounded bg-amber-700 px-4 py-2 text-sm font-medium tracking-wide text-white transition-colors hover:bg-amber-600"
        >
          Add supplier
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-1 border-b border-neutral-800 pb-0">
        {[
          { label: 'All',      value: undefined },
          { label: 'Active',   value: 'true'    },
          { label: 'Inactive', value: 'false'   },
        ].map(({ label, value }) => {
          const isSelected = activeTab === value
          const href = value ? `/admin/suppliers?active=${value}` : '/admin/suppliers'
          return (
            <Link
              key={label}
              href={href}
              className={`-mb-px border-b-2 px-4 py-2 text-sm transition-colors ${
                isSelected
                  ? 'border-amber-600 text-white'
                  : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <div className="rounded border border-neutral-800 bg-neutral-900/50 px-6 py-12 text-center">
          <p className="text-sm text-neutral-500">No suppliers found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded border border-neutral-800">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-800 bg-neutral-900/50">
              <tr>
                {['Name', 'Code', 'Currency', 'Country', 'Contact', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold tracking-widest text-neutral-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {items.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-neutral-900/40">
                  <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-400">{s.code}</td>
                  <td className="px-4 py-3 text-neutral-400">{s.currency}</td>
                  <td className="px-4 py-3 text-neutral-400">{s.country ?? '—'}</td>
                  <td className="px-4 py-3 text-neutral-400">{s.contact_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge active={s.is_active} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/suppliers/${s.id}`}
                      className="text-xs text-amber-600 hover:text-amber-400"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildPageHref(page - 1, activeTab)}
                className="rounded border border-neutral-700 px-3 py-1 hover:border-neutral-500 hover:text-neutral-300"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildPageHref(page + 1, activeTab)}
                className="rounded border border-neutral-700 px-3 py-1 hover:border-neutral-500 hover:text-neutral-300"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function buildPageHref(page: number, active: string | undefined) {
  const params = new URLSearchParams()
  if (page > 1)    params.set('page', String(page))
  if (active)      params.set('active', active)
  const qs = params.toString()
  return qs ? `/admin/suppliers?${qs}` : '/admin/suppliers'
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      Active
    </span>
  ) : (
    <span className="text-xs text-neutral-600">Inactive</span>
  )
}
