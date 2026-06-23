'use client'

import { useTransition } from 'react'
import { setEnquiryStatusAction } from '@/app/admin/(console)/enquiries/actions'
import type { EnquiryStatus } from '@/lib/enquiries/service'

const OPTIONS: { value: EnquiryStatus; label: string }[] = [
  { value: 'new',       label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'closed',    label: 'Closed' },
]

interface Props {
  id:      string
  current: EnquiryStatus
}

export function EnquiryStatusSelect({ id, current }: Props) {
  const [pending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as EnquiryStatus
    startTransition(() => setEnquiryStatusAction(id, next))
  }

  return (
    <select
      defaultValue={current}
      onChange={handleChange}
      disabled={pending}
      className="rounded border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm text-white focus:border-amber-700 focus:outline-none disabled:opacity-50"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
