import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaffRole } from '@/lib/staff'
import { BraceletSettingForm } from '@/components/admin/bracelets/BraceletSettingForm'
import { createBraceletSettingAction } from '../actions'

export const metadata: Metadata = {
  title: 'New Bracelet Setting — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

export default async function NewBraceletSettingPage() {
  await requireStaffRole(['super_admin'])

  return (
    <div className="max-w-2xl">
      <Link href="/admin/bracelet-settings"
        className="mb-4 inline-block text-xs tracking-widest text-neutral-500 transition-colors hover:text-neutral-300">
        ← BRACELET SETTINGS
      </Link>
      <h1 className="mb-8 font-display text-3xl font-light tracking-widest text-white">NEW BRACELET SETTING</h1>
      <BraceletSettingForm action={createBraceletSettingAction} />
    </div>
  )
}
