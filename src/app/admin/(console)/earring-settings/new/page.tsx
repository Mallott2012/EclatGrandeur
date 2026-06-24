import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaffRole } from '@/lib/staff'
import { EarringSettingForm } from '@/components/admin/earrings/EarringSettingForm'
import { createEarringSettingAction } from '../actions'

export const metadata: Metadata = {
  title: 'New Earring Setting — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

export default async function NewEarringSettingPage() {
  await requireStaffRole(['super_admin'])

  return (
    <div className="max-w-2xl">
      <Link href="/admin/earring-settings"
        className="mb-4 inline-block text-xs tracking-widest text-neutral-500 transition-colors hover:text-neutral-300">
        ← EARRING SETTINGS
      </Link>
      <h1 className="mb-8 font-display text-3xl font-light tracking-widest text-white">NEW EARRING SETTING</h1>
      <EarringSettingForm action={createEarringSettingAction} />
    </div>
  )
}
