import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import { getEarringSetting } from '@/lib/earring-settings/service'
import { EarringSettingForm } from '@/components/admin/earrings/EarringSettingForm'
import { updateEarringSettingAction } from '../actions'

interface Props { params: Promise<{ id: string }> }

export const metadata: Metadata = {
  title: 'Edit Earring Setting — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

export default async function EditEarringSettingPage({ params }: Props) {
  await requireStaffRole(['super_admin'])
  const { id } = await params
  const setting = await getEarringSetting(id)
  if (!setting) notFound()

  const boundAction = updateEarringSettingAction.bind(null, id)

  return (
    <div className="max-w-2xl">
      <Link href={`/admin/earring-settings/${id}`}
        className="mb-4 inline-block text-xs tracking-widest text-neutral-500 transition-colors hover:text-neutral-300">
        ← {setting.name.toUpperCase()}
      </Link>
      <h1 className="mb-8 font-display text-3xl font-light tracking-widest text-white">EDIT EARRING SETTING</h1>
      <EarringSettingForm
        action={boundAction}
        defaultValues={{
          name:              setting.name,
          slug:              setting.slug,
          collection:        setting.collection ?? '',
          style:             setting.style ?? '',
          short_description: setting.short_description ?? '',
          description:       setting.description ?? '',
          metals:            setting.metals,
          is_pair:           setting.is_pair,
          base_price_gbp:    setting.base_price_gbp ? String(setting.base_price_gbp) : '',
          status:            setting.status,
          is_published:      setting.is_published,
          sort_order:        setting.sort_order,
        }}
      />
    </div>
  )
}
