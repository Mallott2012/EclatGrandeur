import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import { getJewelleryProduct, getJewelleryDiamonds } from '@/lib/jewellery/service'
import { listDiamonds } from '@/lib/diamonds/service'
import { METAL_LABELS } from '@/lib/diamonds/types'
import { JewelleryForm } from '@/components/admin/jewellery/JewelleryForm'
import { DeleteJewelleryButton } from '@/components/admin/jewellery/DeleteJewelleryButton'
import { DiamondAssignmentPanel, type DiamondSummary } from '@/components/admin/DiamondAssignmentPanel'
import { updateJewelleryAction } from '../actions'
import { assignJewelleryDiamondAction, unassignJewelleryDiamondAction } from '../diamond-actions'

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

  const [product, assignedDiamondIds, allDiamonds] = await Promise.all([
    getJewelleryProduct(id),
    getJewelleryDiamonds(id),
    listDiamonds(),
  ])

  if (!product) notFound()

  const boundUpdate = updateJewelleryAction.bind(null, id)
  const assignFn    = assignJewelleryDiamondAction.bind(null, id)
  const unassignFn  = unassignJewelleryDiamondAction.bind(null, id)

  const diamondSummaries: DiamondSummary[] = allDiamonds
    .filter((d) => d.status === 'available')
    .map((d) => ({
      id:        d.id,
      sku:       d.sku,
      cut:       d.cut,
      carat:     d.carat,
      colour:    d.colour,
      clarity:   d.clarity,
      price_gbp: d.price_gbp,
    }))

  return (
    <div className="max-w-4xl">
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
          <div className="mt-1 flex items-center gap-3">
            <span className="text-xs text-neutral-500 capitalize">{product.category}</span>
            {product.is_published ? (
              <span className="text-xs text-emerald-400">Published</span>
            ) : (
              <span className="text-xs text-neutral-600">Draft</span>
            )}
          </div>
        </div>
        <DeleteJewelleryButton id={id} name={product.name} />
      </div>

      <div className="space-y-6">
        {/* Product details form */}
        <section className="rounded border border-neutral-800 bg-neutral-900/30 p-6">
          <h2 className="mb-4 text-xs font-semibold tracking-widest text-neutral-400">PRODUCT DETAILS</h2>
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
        </section>

        {/* Diamond assignment — only shown when show_diamond is enabled */}
        {product.show_diamond && (
          <section className="rounded border border-neutral-800 bg-neutral-900/30 p-6">
            <h2 className="mb-1 text-xs font-semibold tracking-widest text-neutral-400">AVAILABLE DIAMONDS</h2>
            <p className="mb-4 text-xs text-neutral-600">
              Tick the diamonds that can be set in this {product.category.replace(/s$/, '')}. Only these will appear on the product page.
            </p>
            {product.metals.length > 0 && (
              <p className="mb-4 text-xs text-neutral-500">
                Metals available: {product.metals.map((m) => METAL_LABELS[m]).join(', ')}
              </p>
            )}
            <DiamondAssignmentPanel
              diamonds={diamondSummaries}
              assignedIds={assignedDiamondIds}
              onAssign={assignFn}
              onUnassign={unassignFn}
            />
          </section>
        )}

        {!product.show_diamond && (
          <section className="rounded border border-neutral-800 bg-neutral-900/30 p-6">
            <h2 className="mb-2 text-xs font-semibold tracking-widest text-neutral-400">AVAILABLE DIAMONDS</h2>
            <p className="text-sm text-neutral-600">
              Diamond selection is disabled for this product. Enable &quot;Show diamond selector&quot; in the product details above to assign diamonds.
            </p>
          </section>
        )}
      </div>
    </div>
  )
}
