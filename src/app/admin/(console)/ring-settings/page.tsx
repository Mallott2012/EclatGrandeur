import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaffRole } from '@/lib/staff'
import { listRingSettings } from '@/lib/ring-settings/service'
import { METAL_LABELS } from '@/lib/ring-settings/types'

export const metadata: Metadata = {
  title: 'Ring Settings — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

export default async function RingSettingsListPage() {
  await requireStaffRole(['super_admin'])
  const items = await listRingSettings()

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-light tracking-widest text-stone-900">RING SETTINGS</h1>
          <p className="mt-1 text-sm text-stone-500">
            {items.length} setting{items.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link
          href="/admin/ring-settings/new"
          className="rounded bg-stone-900 px-4 py-2 text-sm font-medium tracking-wide text-white transition-colors hover:bg-stone-700"
        >
          Add setting
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded border border-stone-200 bg-white px-6 py-16 text-center">
          <p className="text-sm text-stone-400">No ring settings yet.</p>
          <Link
            href="/admin/ring-settings/new"
            className="mt-4 inline-block text-xs tracking-widest text-stone-600 underline hover:text-stone-900"
          >
            Create your first ring setting →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded border border-stone-200">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-200 bg-stone-50">
              <tr>
                {['Name', 'Slug', 'Collection', 'Metals', 'Base Price', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold tracking-widest text-stone-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {items.map((s) => (
                <tr key={s.id} className="bg-white transition-colors hover:bg-stone-50">
                  <td className="px-4 py-3 font-medium text-stone-900">{s.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-stone-500">{s.slug}</td>
                  <td className="px-4 py-3 text-stone-500">{s.collection ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {s.metals.map((m) => (
                        <span key={m} className="rounded border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-xs text-stone-600">
                          {METAL_LABELS[m]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {s.base_price_gbp ? `£${Number(s.base_price_gbp).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {s.is_published ? (
                      <span className="text-xs text-emerald-600">Published</span>
                    ) : (
                      <span className="text-xs text-stone-400">Draft</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/ring-settings/${s.id}`}
                      className="text-xs text-stone-500 hover:text-stone-900"
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
    </div>
  )
}
