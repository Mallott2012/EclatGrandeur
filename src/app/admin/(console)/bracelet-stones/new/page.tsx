import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaffRole } from '@/lib/staff'
import { listBraceletSettingOptions } from '@/lib/bracelet-stones/service'
import { BraceletStoneForm } from '@/components/admin/bracelets/BraceletStoneForm'
import { createBraceletStoneAction } from '../actions'

export const metadata: Metadata = {
  title: 'New Bracelet Stone — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

export default async function NewBraceletStonePage() {
  await requireStaffRole(['super_admin'])
  const settings = await listBraceletSettingOptions()

  return (
    <div className="max-w-2xl">
      <Link href="/admin/bracelet-stones"
        className="mb-4 inline-block text-xs tracking-widest text-neutral-500 transition-colors hover:text-neutral-300">
        ← BRACELET STONES
      </Link>
      <h1 className="mb-8 font-display text-3xl font-light tracking-widest text-white">NEW BRACELET STONE</h1>
      <p className="mb-6 text-sm text-neutral-500">The SKU (EGB-…) is assigned automatically on save.</p>
      <BraceletStoneForm action={createBraceletStoneAction} settings={settings} />
    </div>
  )
}
