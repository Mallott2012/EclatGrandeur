import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import { getJewelleryProduct } from '@/lib/jewellery/service'
import { JewelleryForm } from '@/components/admin/jewellery/JewelleryForm'
import { DeleteJewelleryButton } from '@/components/admin/jewellery/DeleteJewelleryButton'
import { updateJewelleryAction } from '../actions'

export const metadata: Metadata = {
  title: 'Edit Jewellery Product — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditJewelleryPage({ params }: Props) {
  await requireStaffRole(['super_admin', 'content_editor'])
  const { id } = await params
  const product = await getJewelleryProduct(id)
  if (!product) notFound()

  // Bind the product id into the update action
  const boundUpdate = updateJewelleryAction.bind(null, id)

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/jewellery"
        className="mb-4 inline-block text-xs tracking-widest text-neutral-500 transition-colors hover:text-neutral-300"
      >
        ← JEWELLERY
      </Link>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-light tracking-widest text-white">{product.name.toUpperCase()}</h1>
          <p className="mt-1 font-mono text-xs text-neutral-600">{product.id}</p>
        </div>
        <DeleteJewelleryButton id={id} name={product.name} />
      </div>

      <div className="rounded border border-neutral-800 bg-neutral-900/30 p-6">
        <JewelleryForm
          action={boundUpdate}
          submitLabel="Save changes"
          cancelHref="/admin/jewellery"
          defaultValues={{
            slug:           product.slug,
            category:       product.category,
            name:           product.name,
            subtitle:       product.subtitle,
            description:    product.description,
            base_price_gbp: product.base_price_gbp,
            metals:         product.metals,
            show_diamond:   product.show_diamond,
            is_total_carat: product.is_total_carat,
            is_pair:        product.is_pair,
            is_published:   product.is_published,
            sort_order:     product.sort_order,
          }}
        />
      </div>
    </div>
  )
}
