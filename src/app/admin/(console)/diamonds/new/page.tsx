import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaffRole } from '@/lib/staff'
import { DiamondForm } from '@/components/admin/diamonds/DiamondForm'
import { createDiamondAction } from '../actions'

export const metadata: Metadata = {
  title: 'Add Diamond — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

export default async function NewDiamondPage() {
  await requireStaffRole(['super_admin', 'diamond_buyer'])

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/diamonds"
        className="mb-4 inline-block text-xs tracking-widest text-neutral-500 transition-colors hover:text-neutral-300"
      >
        ← DIAMONDS
      </Link>
      <h1 className="mb-8 font-display text-3xl font-light tracking-widest text-white">ADD DIAMOND</h1>
      <div className="rounded border border-neutral-800 bg-neutral-900/30 p-6">
        <DiamondForm
          action={createDiamondAction}
          submitLabel="Create diamond"
          cancelHref="/admin/diamonds"
        />
      </div>
    </div>
  )
}
