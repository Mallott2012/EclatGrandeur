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
          <h1 className="font-display text-3xl font-light tracking-widest text-stone-900">JEWELLERY</h1>
          <p className="mt-1 text-sm text-stone-500">
            {products.length} product{products.length !== 1 ? 's' : ''} in catalogue
          </p>
        </div>
        <Link
          href="/admin/jewellery/new"
          className="rounded bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700"
        >
          + Add product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded border border-stone-200 bg-white px-6 py-16 text-center">
          <p className="text-sm text-stone-400">No jewellery products yet.</p>
          <Link href="/admin/jewellery/new" className="mt-3 inline-block text-xs text-stone-600 underline hover:text-stone-900">
            Add your first product
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded border border-stone-200">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-200 bg-stone-50">
              <tr>
                {['Name', 'Category', 'Price (GBP)', 'Metals', 'Published', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold tracking-widest text-stone-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {products.map((p) => (
                <tr key={p.id} className="bg-white transition-colors hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <span className="text-stone-900">{p.name}</span>
                    {p.subtitle && (
                      <span className="ml-2 text-xs text-stone-400">{p.subtitle}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-500">{CATEGORY_LABELS[p.category]}</td>
                  <td className="px-4 py-3 text-stone-700">
                    {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(p.base_price_gbp)}
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-400">
                    {p.metals.length} metal{p.metals.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-4 py-3">
                    {p.is_published
                      ? <span className="text-xs text-emerald-600">Published</span>
                      : <span className="text-xs text-stone-400">Draft</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/jewellery/${p.id}`}
                      className="text-xs text-stone-500 hover:text-stone-900"
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
