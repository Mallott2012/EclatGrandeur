import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaffRole } from '@/lib/staff'
import { HeroForm } from '@/components/admin/hero/HeroForm'

export const metadata: Metadata = {
  title: 'New Hero — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

export default async function NewHeroPage() {
  await requireStaffRole(['super_admin', 'content_editor'])
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link href="/admin/hero" className="text-xs text-neutral-500 hover:text-white">
          ← Hero Media
        </Link>
        <h1 className="mt-3 font-display text-3xl font-light tracking-widest text-white">
          NEW HERO
        </h1>
      </div>
      <HeroForm />
    </div>
  )
}
