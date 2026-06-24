import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaffRole } from '@/lib/staff'
import { listNecklaceStones } from '@/lib/necklace-stones/service'
import { GEMSTONE_TYPE_LABELS } from '@/lib/catalogue/enums'
import { StatusBadge } from '@/components/admin/catalogue/StatusBadge'

export const metadata: Metadata = {
  title: 'Necklace Stones — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

export default async function NecklaceStonesListPage() {
  await requireStaffRole(['super_admin'])
  const items = await listNecklaceStones()

  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-light tracking-widest text-white">NECKLACE STONES</h1>
          <p className="mt-1 text-sm text-neutral-400">{items.length} stone{items.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link href="/admin/necklace-stones/new"
          className="rounded bg-amber-700 px-4 py-2 text-sm font-medium tracking-wide text-white transition-colors hover:bg-amber-600">
          Add stone
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded border border-neutral-800 bg-neutral-900/50 px-6 py-16 text-center">
          <p className="text-sm text-neutral-500">No necklace stones yet.</p>
          <Link href="/admin/necklace-stones/new" className="mt-4 inline-block text-xs tracking-widest text-amber-600 hover:text-amber-400">
            Add your first necklace stone →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded border border-neutral-800">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-800 bg-neutral-900/50">
              <tr>
                {['SKU', 'Type', 'Carat', 'Setting', 'Price', 'Status', 'Published', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold tracking-widest text-neutral-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {items.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-neutral-900/40">
                  <td className="px-4 py-3 font-mono text-xs text-neutral-300">{s.sku}</td>
                  <td className="px-4 py-3 text-neutral-300">{GEMSTONE_TYPE_LABELS[s.stone_type]}</td>
                  <td className="px-4 py-3 text-neutral-400">{s.carat ? `${Number(s.carat).toFixed(2)} ct` : '—'}</td>
                  <td className="px-4 py-3 text-neutral-400">{s.setting?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-neutral-400">{s.price_gbp ? `£${Number(s.price_gbp).toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3">
                    {s.is_published
                      ? <span className="text-xs text-emerald-400">Published</span>
                      : <span className="text-xs text-neutral-600">Draft</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/necklace-stones/${s.id}`} className="text-xs text-amber-600 hover:text-amber-400">View →</Link>
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
