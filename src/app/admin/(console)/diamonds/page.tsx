import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaffRole } from '@/lib/staff'
import { listDiamonds } from '@/lib/diamonds/service'
import { CUT_LABELS, type Diamond, type DiamondStatus } from '@/lib/diamonds/types'

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
          <h1 className="font-display text-3xl font-light tracking-widest text-stone-900">DIAMONDS</h1>
          <p className="mt-1 text-sm text-stone-500">
            {diamonds.length} stone{diamonds.length !== 1 ? 's' : ''} in inventory
          </p>
        </div>
        <Link
          href="/admin/diamonds/new"
          className="rounded bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700"
        >
          + Add diamond
        </Link>
      </div>

      {/* Table */}
      {diamonds.length === 0 ? (
        <div className="rounded border border-stone-200 bg-white px-6 py-16 text-center">
          <p className="text-sm text-stone-400">No diamonds yet.</p>
          <Link href="/admin/diamonds/new" className="mt-3 inline-block text-xs text-stone-600 underline hover:text-stone-900">
            Add your first diamond
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded border border-stone-200">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-200 bg-stone-50">
              <tr>
                {['SKU', 'Cut / Carat', 'Colour', 'Clarity', 'Price (GBP)', 'Status', 'Published', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold tracking-widest text-stone-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {diamonds.map((d) => (
                <tr key={d.id} className="bg-white transition-colors hover:bg-stone-50">
                  <td className="px-4 py-3 font-mono text-xs text-stone-500">{d.sku}</td>
                  <td className="px-4 py-3 text-stone-700">
                    <span>{CUT_LABELS[d.cut]}</span>
                    <span className="ml-2 text-stone-400">{d.carat.toFixed(2)}ct</span>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{d.colour}</td>
                  <td className="px-4 py-3 text-stone-600">{d.clarity}</td>
                  <td className="px-4 py-3 text-stone-700">
                    {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(d.price_gbp)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="px-4 py-3">
                    {d.is_published
                      ? <span className="text-xs text-emerald-600">Published</span>
                      : <span className="text-xs text-stone-400">Draft</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/diamonds/${d.id}`}
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

function StatusBadge({ status }: { status: DiamondStatus }) {
  switch (status) {
    case 'available': return <span className="text-xs text-emerald-600">Available</span>
    case 'sold':      return <span className="text-xs text-stone-400">Sold</span>
    default:          return <span className="text-xs text-stone-500">{status}</span>
  }
}
