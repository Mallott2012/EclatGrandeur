import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaffRole } from '@/lib/staff'
import { RingSettingForm } from '@/components/admin/ring-settings/RingSettingForm'
import { createRingSettingAction } from '../actions'

export const metadata: Metadata = {
  title: 'New Ring Setting — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

export default async function NewRingSettingPage() {
  await requireStaffRole(['super_admin'])

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/ring-settings"
        className="mb-4 inline-block text-xs tracking-widest text-neutral-500 transition-colors hover:text-neutral-300"
      >
        ← RING SETTINGS
      </Link>
      <h1 className="mb-8 font-display text-3xl font-light tracking-widest text-white">NEW RING SETTING</h1>
      <RingSettingForm action={createRingSettingAction} />
    </div>
  )
}
