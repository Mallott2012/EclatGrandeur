import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaffRole } from '@/lib/staff'
import { listDiamonds } from '@/lib/diamonds/service'
import { CUT_LABELS, CLARITY_ORDER, COLOUR_ORDER, type Diamond, type DiamondStatus } from '@/lib/diamonds/types'

export const metadata: Metadata = {
  title: 'Diamonds — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

export default async function DiamondsListPage() {
  await requireStaffRole(['super_admin', 'diamond_buyer'])
  const diamonds = await listDiamonds()

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-light tracking-widest text-white">DIAMONDS</h1>
          <p className="mt-1 text-sm text-neutral-400">
            {diamonds.length} stone{diamonds.length !== 1 ? 's' : ''} in inventory
          </p>
        </div>
        <Link
          href="/admin/diamonds/new"
          className="rounded bg-amber-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
        >
          + Add diamond
        </Link>
      </div>

      {/* Table */}
      {diamonds.length === 0 ? (
        <div className="rounded border border-neutral-800 bg-neutral-900/50 px-6 py-16 text-center">
          <p className="text-sm text-neutral-500">No diamonds yet.</p>
          <Link href="/admin/diamonds/new" className="mt-3 inline-block text-xs text-amber-600 hover:text-amber-500">
            Add your first diamond
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded border border-neutral-800">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-800 bg-neutral-900/50">
              <tr>
                {['SKU', 'Cut / Carat', 'Colour', 'Clarity', 'Price (GBP)', 'Status', 'Published', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold tracking-widest text-neutral-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {diamonds.map((d) => (
                <tr key={d.id} className="transition-colors hover:bg-neutral-900/40">
                  <td className="px-4 py-3 font-mono text-xs text-neutral-300">{d.sku}</td>
                  <td className="px-4 py-3 text-neutral-300">
                    <span>{CUT_LABELS[d.cut]}</span>
                    <span className="ml-2 text-neutral-500">{d.carat.toFixed(2)}ct</span>
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{d.colour}</td>
                  <td className="px-4 py-3 text-neutral-400">{d.clarity}</td>
                  <td className="px-4 py-3 text-neutral-300">
                    {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(d.price_gbp)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="px-4 py-3">
                    {d.is_published
                      ? <span className="text-xs text-emerald-500">Published</span>
                      : <span className="text-xs text-neutral-600">Draft</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/diamonds/${d.id}`}
                      className="text-xs text-neutral-400 hover:text-white"
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

function StatusBadge({ status }: { status: DiamondStatus }) {
  switch (status) {
    case 'available': return <span className="text-xs text-emerald-400">Available</span>
    case 'sold':      return <span className="text-xs text-neutral-500">Sold</span>
    default:          return <span className="text-xs text-neutral-400">{status}</span>
  }
}

// Re-export for usage
export { CUT_LABELS, CLARITY_ORDER, COLOUR_ORDER }
