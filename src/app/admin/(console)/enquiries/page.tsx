import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaffRole } from '@/lib/staff'
import { listEnquiries, type EnquiryStatus } from '@/lib/enquiries/service'

export const metadata: Metadata = {
  title: 'Enquiries — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

const STATUS_LABELS: Record<EnquiryStatus, string> = {
  new:       'New',
  contacted: 'Contacted',
  closed:    'Closed',
}

const STATUS_COLOURS: Record<EnquiryStatus, string> = {
  new:       'text-amber-700',
  contacted: 'text-sky-700',
  closed:    'text-stone-400',
}

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function EnquiriesListPage({ searchParams }: Props) {
  await requireStaffRole(['super_admin', 'sales_adviser'])
  const { status } = await searchParams
  const activeStatus = (['new', 'contacted', 'closed'].includes(status ?? '')
    ? (status as EnquiryStatus)
    : undefined)

  const enquiries = await listEnquiries(activeStatus)

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-light tracking-widest text-stone-900">ENQUIRIES</h1>
          <p className="mt-1 text-sm text-stone-500">
            {enquiries.length} enquir{enquiries.length !== 1 ? 'ies' : 'y'}
            {activeStatus ? ` · ${STATUS_LABELS[activeStatus]}` : ''}
          </p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="mb-6 flex gap-1">
        {([undefined, 'new', 'contacted', 'closed'] as const).map((s) => {
          const isActive = (s ?? '') === (activeStatus ?? '')
          const label = s ? STATUS_LABELS[s] : 'All'
          const href = s ? `/admin/enquiries?status=${s}` : '/admin/enquiries'
          return (
            <Link
              key={label}
              href={href}
              className={`rounded px-3 py-1.5 text-xs tracking-wide transition-colors ${
                isActive
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </div>

      {enquiries.length === 0 ? (
        <div className="rounded border border-stone-200 bg-white px-6 py-16 text-center">
          <p className="text-sm text-stone-400">No enquiries{activeStatus ? ` with status "${STATUS_LABELS[activeStatus]}"` : ''} yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded border border-stone-200">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-200 bg-stone-50">
              <tr>
                {['Ref', 'Customer', 'Subject', 'Status', 'Received', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold tracking-widest text-stone-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {enquiries.map((e) => (
                <tr key={e.id} className="bg-white transition-colors hover:bg-stone-50">
                  <td className="px-4 py-3 font-mono text-xs text-stone-400">{e.enquiry_number}</td>
                  <td className="px-4 py-3">
                    <p className="text-stone-900">{e.customer_name}</p>
                    <p className="text-xs text-stone-400">{e.customer_email}</p>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate text-stone-600">
                    {e.subject ?? <span className="italic text-stone-400">No subject</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${STATUS_COLOURS[e.status]}`}>
                      {STATUS_LABELS[e.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-400">
                    {new Date(e.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/enquiries/${e.id}`}
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
