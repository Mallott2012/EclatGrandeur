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
      className="rounded border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-900 focus:border-stone-500 focus:outline-none disabled:opacity-50"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
