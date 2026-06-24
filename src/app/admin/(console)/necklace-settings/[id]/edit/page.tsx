import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import { getNecklaceSetting } from '@/lib/necklace-settings/service'
import { NecklaceSettingForm } from '@/components/admin/necklaces/NecklaceSettingForm'
import { updateNecklaceSettingAction } from '../actions'

interface Props { params: Promise<{ id: string }> }

export const metadata: Metadata = {
  title: 'Edit Necklace Setting — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

export default async function EditNecklaceSettingPage({ params }: Props) {
  await requireStaffRole(['super_admin'])
  const { id } = await params
  const setting = await getNecklaceSetting(id)
  if (!setting) notFound()

  const boundAction = updateNecklaceSettingAction.bind(null, id)

  return (
    <div className="max-w-2xl">
      <Link href={`/admin/necklace-settings/${id}`}
        className="mb-4 inline-block text-xs tracking-widest text-neutral-500 transition-colors hover:text-neutral-300">
        ← {setting.name.toUpperCase()}
      </Link>
      <h1 className="mb-8 font-display text-3xl font-light tracking-widest text-white">EDIT NECKLACE SETTING</h1>
      <NecklaceSettingForm
        action={boundAction}
        defaultValues={{
          name:              setting.name,
          slug:              setting.slug,
          collection:        setting.collection ?? '',
          style:             setting.style ?? '',
          short_description: setting.short_description ?? '',
          description:       setting.description ?? '',
          metals:            setting.metals,
          chain_lengths_cm:  setting.chain_lengths_cm,
          base_price_gbp:    setting.base_price_gbp ? String(setting.base_price_gbp) : '',
          status:            setting.status,
          is_published:      setting.is_published,
          sort_order:        setting.sort_order,
        }}
      />
    </div>
  )
}
