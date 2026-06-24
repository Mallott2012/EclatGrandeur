import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import { getNecklaceStone, listNecklaceSettingOptions } from '@/lib/necklace-stones/service'
import { NecklaceStoneForm } from '@/components/admin/necklaces/NecklaceStoneForm'
import { updateNecklaceStoneAction } from '../actions'

interface Props { params: Promise<{ id: string }> }

export const metadata: Metadata = {
  title: 'Edit Necklace Stone — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

export default async function EditNecklaceStonePage({ params }: Props) {
  await requireStaffRole(['super_admin'])
  const { id } = await params
  const [stone, settings] = await Promise.all([getNecklaceStone(id), listNecklaceSettingOptions()])
  if (!stone) notFound()

  const boundAction = updateNecklaceStoneAction.bind(null, id)

  return (
    <div className="max-w-2xl">
      <Link href={`/admin/necklace-stones/${id}`}
        className="mb-4 inline-block text-xs tracking-widest text-neutral-500 transition-colors hover:text-neutral-300">
        ← {stone.sku}
      </Link>
      <h1 className="mb-8 font-display text-3xl font-light tracking-widest text-white">EDIT NECKLACE STONE</h1>
      <NecklaceStoneForm
        action={boundAction}
        settings={settings}
        defaultValues={{
          sku:                 stone.sku,
          necklace_setting_id: stone.necklace_setting_id ?? '',
          stone_type:          stone.stone_type,
          shape:               stone.shape ?? '',
          carat:               stone.carat ? String(stone.carat) : '',
          colour:              stone.colour ?? '',
          colour_description:  stone.colour_description ?? '',
          clarity:             stone.clarity ?? '',
          clarity_description: stone.clarity_description ?? '',
          cut_grade:           stone.cut_grade ?? '',
          polish:              stone.polish ?? '',
          symmetry:            stone.symmetry ?? '',
          fluorescence:        stone.fluorescence ?? '',
          gia_report_number:   stone.gia_report_number ?? '',
          gia_report_date:     stone.gia_report_date ?? '',
          gia_report_url:      stone.gia_report_url ?? '',
          price_gbp:           stone.price_gbp ? String(stone.price_gbp) : '',
          status:              stone.status,
          is_published:        stone.is_published,
          notes:               stone.notes ?? '',
        }}
      />
    </div>
  )
}
