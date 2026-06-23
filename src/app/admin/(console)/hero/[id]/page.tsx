import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import { listHeroMedia } from '@/lib/hero/service'
import { HeroForm } from '@/components/admin/hero/HeroForm'
import { HeroPublishButton } from '@/components/admin/hero/HeroPublishButton'
import { DeleteHeroButton } from '@/components/admin/hero/DeleteHeroButton'

export const metadata: Metadata = {
  title: 'Edit Hero — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

interface Props { params: Promise<{ id: string }> }

export default async function EditHeroPage({ params }: Props) {
  await requireStaffRole(['super_admin', 'content_editor'])
  const { id } = await params
  const all = await listHeroMedia()
  const record = all.find((r) => r.id === id)
  if (!record) notFound()

  return (
    <div className="max-w-2xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <Link href="/admin/hero" className="text-xs text-neutral-500 hover:text-white">
            ← Hero Media
          </Link>
          <h1 className="mt-3 font-display text-3xl font-light tracking-widest text-white">
            EDIT HERO
          </h1>
          <p className="mt-1 text-sm text-neutral-500 capitalize">{record.placement.replace('-', ' ')}</p>
        </div>
        <div className="flex items-center gap-3 pt-8">
          <HeroPublishButton record={record} />
          <DeleteHeroButton id={record.id} />
        </div>
      </div>
      <HeroForm record={record} />
    </div>
  )
}
