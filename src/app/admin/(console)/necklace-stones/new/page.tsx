import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaffRole } from '@/lib/staff'
import { listNecklaceSettingOptions } from '@/lib/necklace-stones/service'
import { NecklaceStoneForm } from '@/components/admin/necklaces/NecklaceStoneForm'
import { createNecklaceStoneAction } from '../actions'

export const metadata: Metadata = {
  title: 'New Necklace Stone — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

export default async function NewNecklaceStonePage() {
  await requireStaffRole(['super_admin'])
  const settings = await listNecklaceSettingOptions()

  return (
    <div className="max-w-2xl">
      <Link href="/admin/necklace-stones"
        className="mb-4 inline-block text-xs tracking-widest text-neutral-500 transition-colors hover:text-neutral-300">
        ← NECKLACE STONES
      </Link>
      <h1 className="mb-8 font-display text-3xl font-light tracking-widest text-white">NEW NECKLACE STONE</h1>
      <p className="mb-6 text-sm text-neutral-500">The SKU (EGN-…) is assigned automatically on save.</p>
      <NecklaceStoneForm action={createNecklaceStoneAction} settings={settings} />
    </div>
  )
}
