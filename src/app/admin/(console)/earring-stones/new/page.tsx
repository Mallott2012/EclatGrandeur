import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaffRole } from '@/lib/staff'
import { listEarringSettingOptions } from '@/lib/earring-stones/service'
import { EarringStoneForm } from '@/components/admin/earrings/EarringStoneForm'
import { createEarringStoneAction } from '../actions'

export const metadata: Metadata = {
  title: 'New Earring Stone — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

export default async function NewEarringStonePage() {
  await requireStaffRole(['super_admin'])
  const settings = await listEarringSettingOptions()

  return (
    <div className="max-w-2xl">
      <Link href="/admin/earring-stones"
        className="mb-4 inline-block text-xs tracking-widest text-neutral-500 transition-colors hover:text-neutral-300">
        ← EARRING STONES
      </Link>
      <h1 className="mb-8 font-display text-3xl font-light tracking-widest text-white">NEW EARRING STONE</h1>
      <p className="mb-6 text-sm text-neutral-500">The SKU (EGE-…) is assigned automatically on save.</p>
      <EarringStoneForm action={createEarringStoneAction} settings={settings} />
    </div>
  )
}
