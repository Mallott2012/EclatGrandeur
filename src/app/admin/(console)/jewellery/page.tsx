import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaffRole } from '@/lib/staff'
import { listJewelleryProducts } from '@/lib/jewellery/service'
import type { JewelleryCategory } from '@/lib/jewellery/types'

export const metadata: Metadata = {
  title: 'Jewellery — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

const CATEGORY_LABELS: Record<JewelleryCategory, string> = {
  earrings:  'Earrings',
  necklaces: 'Necklaces',
  bracelets: 'Bracelets',
}

export default async function JewelleryListPage() {
  await requireStaffRole(['super_admin', 'content_editor'])
  const products = await listJewelleryProducts()

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-light tracking-widest text-white">JEWELLERY</h1>
          <p className="mt-1 text-sm text-neutral-400">
            {products.length} product{products.length !== 1 ? 's' : ''} in catalogue
          </p>
        </div>
        <Link
          href="/admin/jewellery/new"
          className="rounded bg-amber-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
        >
          + Add product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded border border-neutral-800 bg-neutral-900/50 px-6 py-16 text-center">
          <p className="text-sm text-neutral-500">No jewellery products yet.</p>
          <Link href="/admin/jewellery/new" className="mt-3 inline-block text-xs text-amber-600 hover:text-amber-500">
            Add your first product
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded border border-neutral-800">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-800 bg-neutral-900/50">
              <tr>
                {['Name', 'Category', 'Price (GBP)', 'Metals', 'Published', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold tracking-widest text-neutral-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {products.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-neutral-900/40">
                  <td className="px-4 py-3">
                    <span className="text-neutral-200">{p.name}</span>
                    {p.subtitle && (
                      <span className="ml-2 text-xs text-neutral-500">{p.subtitle}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{CATEGORY_LABELS[p.category]}</td>
                  <td className="px-4 py-3 text-neutral-300">
                    {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(p.base_price_gbp)}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500">
                    {p.metals.length} metal{p.metals.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-4 py-3">
                    {p.is_published
                      ? <span className="text-xs text-emerald-500">Published</span>
                      : <span className="text-xs text-neutral-600">Draft</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/jewellery/${p.id}`}
                      className="text-xs text-neutral-400 hover:text-white"
                    >
                      Edit →
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
