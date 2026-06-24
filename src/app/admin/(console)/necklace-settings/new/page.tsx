import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaffRole } from '@/lib/staff'
import { NecklaceSettingForm } from '@/components/admin/necklaces/NecklaceSettingForm'
import { createNecklaceSettingAction } from '../actions'

export const metadata: Metadata = {
  title: 'New Necklace Setting — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

export default async function NewNecklaceSettingPage() {
  await requireStaffRole(['super_admin'])

  return (
    <div className="max-w-2xl">
      <Link href="/admin/necklace-settings"
        className="mb-4 inline-block text-xs tracking-widest text-neutral-500 transition-colors hover:text-neutral-300">
        ← NECKLACE SETTINGS
      </Link>
      <h1 className="mb-8 font-display text-3xl font-light tracking-widest text-white">NEW NECKLACE SETTING</h1>
      <NecklaceSettingForm action={createNecklaceSettingAction} />
    </div>
  )
}
