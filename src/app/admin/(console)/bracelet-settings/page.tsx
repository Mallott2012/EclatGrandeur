import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaffRole } from '@/lib/staff'
import { listBraceletSettings } from '@/lib/bracelet-settings/service'
import { METAL_LABELS } from '@/lib/catalogue/enums'

export const metadata: Metadata = {
  title: 'Bracelet Settings — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

export default async function BraceletSettingsListPage() {
  await requireStaffRole(['super_admin'])
  const items = await listBraceletSettings()

  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-light tracking-widest text-white">BRACELET SETTINGS</h1>
          <p className="mt-1 text-sm text-neutral-400">{items.length} setting{items.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link href="/admin/bracelet-settings/new"
          className="rounded bg-amber-700 px-4 py-2 text-sm font-medium tracking-wide text-white transition-colors hover:bg-amber-600">
          Add setting
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded border border-neutral-800 bg-neutral-900/50 px-6 py-16 text-center">
          <p className="text-sm text-neutral-500">No bracelet settings yet.</p>
          <Link href="/admin/bracelet-settings/new" className="mt-4 inline-block text-xs tracking-widest text-amber-600 hover:text-amber-400">
            Create your first bracelet setting →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded border border-neutral-800">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-800 bg-neutral-900/50">
              <tr>
                {['Name', 'Slug', 'Style', 'Metals', 'Base Price', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold tracking-widest text-neutral-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {items.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-neutral-900/40">
                  <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-400">{s.slug}</td>
                  <td className="px-4 py-3 capitalize text-neutral-400">{s.style ?? '—'}</td>
                  <td className="px-4 py-3 text-neutral-400">
                    <div className="flex flex-wrap gap-1">
                      {s.metals.map((m) => (
                        <span key={m} className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-300">{METAL_LABELS[m]}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{s.base_price_gbp ? `£${Number(s.base_price_gbp).toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3">
                    {s.is_published
                      ? <span className="text-xs text-emerald-400">Published</span>
                      : <span className="text-xs text-neutral-600">Draft</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/bracelet-settings/${s.id}`} className="text-xs text-amber-600 hover:text-amber-400">View →</Link>
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
