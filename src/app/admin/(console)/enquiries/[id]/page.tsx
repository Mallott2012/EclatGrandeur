import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import { getEnquiry, type EnquiryStatus } from '@/lib/enquiries/service'
import { EnquiryStatusSelect } from '@/components/admin/enquiries/EnquiryStatusSelect'
import { EnquiryNotesForm } from '@/components/admin/enquiries/EnquiryNotesForm'

export const metadata: Metadata = {
  title: 'Enquiry Detail — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

interface Props { params: Promise<{ id: string }> }

const STATUS_LABELS: Record<EnquiryStatus, string> = {
  new:       'New',
  contacted: 'Contacted',
  closed:    'Closed',
}

const STATUS_COLOURS: Record<EnquiryStatus, string> = {
  new:       'text-amber-400',
  contacted: 'text-sky-400',
  closed:    'text-neutral-600',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-neutral-800 bg-neutral-900/30 p-5">
      <h2 className="mb-4 text-xs font-semibold tracking-widest text-neutral-500">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] tracking-widest text-neutral-600">{label}</dt>
      <dd className="text-sm text-neutral-200">{value ?? <span className="text-neutral-700">—</span>}</dd>
    </div>
  )
}

export default async function EnquiryDetailPage({ params }: Props) {
  await requireStaffRole(['super_admin', 'sales_adviser'])
  const { id } = await params
  const enquiry = await getEnquiry(id)
  if (!enquiry) notFound()

  return (
    <div className="max-w-2xl">
      {/* Back + header */}
      <div className="mb-8">
        <Link href="/admin/enquiries" className="text-xs text-neutral-500 hover:text-white">
          ← Enquiries
        </Link>
        <div className="mt-3 flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-light tracking-widest text-white">
              {enquiry.enquiry_number}
            </h1>
            <p className={`mt-1 text-sm ${STATUS_COLOURS[enquiry.status]}`}>
              {STATUS_LABELS[enquiry.status]}
            </p>
          </div>
          <EnquiryStatusSelect id={enquiry.id} current={enquiry.status} />
        </div>
      </div>

      <div className="space-y-4">
        {/* Customer */}
        <Section title="CUSTOMER">
          <dl className="grid grid-cols-2 gap-4">
            <Field label="NAME" value={enquiry.customer_name} />
            <Field label="EMAIL" value={
              <a href={`mailto:${enquiry.customer_email}`} className="text-amber-600 hover:text-amber-400">
                {enquiry.customer_email}
              </a>
            } />
            <Field label="PHONE" value={enquiry.customer_phone} />
            <Field label="RECEIVED" value={
              new Date(enquiry.created_at).toLocaleString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })
            } />
          </dl>
        </Section>

        {/* Enquiry */}
        <Section title="ENQUIRY">
          <dl className="space-y-3">
            <Field label="SUBJECT" value={enquiry.subject} />
            <div className="flex flex-col gap-0.5">
              <dt className="text-[11px] tracking-widest text-neutral-600">MESSAGE</dt>
              <dd className="whitespace-pre-wrap rounded bg-neutral-900 p-3 text-sm text-neutral-200 leading-relaxed">
                {enquiry.message}
              </dd>
            </div>
          </dl>
        </Section>

        {/* Linked products (if any) */}
        {(enquiry.ring_setting_id || enquiry.diamond_id || enquiry.jewellery_product_id) && (
          <Section title="LINKED PRODUCTS">
            <dl className="grid grid-cols-2 gap-4">
              {enquiry.ring_setting_id && (
                <Field
                  label="RING SETTING"
                  value={
                    <Link href={`/admin/ring-settings/${enquiry.ring_setting_id}`} className="text-amber-600 hover:text-amber-400">
                      View setting →
                    </Link>
                  }
                />
              )}
              {enquiry.diamond_id && (
                <Field
                  label="DIAMOND"
                  value={
                    <Link href={`/admin/diamonds/${enquiry.diamond_id}`} className="text-amber-600 hover:text-amber-400">
                      View diamond →
                    </Link>
                  }
                />
              )}
              {enquiry.jewellery_product_id && (
                <Field
                  label="JEWELLERY PRODUCT"
                  value={
                    <Link href={`/admin/jewellery/${enquiry.jewellery_product_id}`} className="text-amber-600 hover:text-amber-400">
                      View product →
                    </Link>
                  }
                />
              )}
              {enquiry.metal && <Field label="METAL" value={enquiry.metal} />}
            </dl>
          </Section>
        )}

        {/* Internal notes */}
        <Section title="INTERNAL NOTES">
          <EnquiryNotesForm id={enquiry.id} current={enquiry.notes ?? ''} />
        </Section>
      </div>
    </div>
  )
}
