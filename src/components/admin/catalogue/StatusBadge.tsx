import type { ProductStatus } from '@/lib/catalogue/enums'
import { PRODUCT_STATUS_LABELS } from '@/lib/catalogue/enums'

const STYLES: Record<ProductStatus, string> = {
  available:    'border-emerald-700/50 bg-emerald-950/40 text-emerald-400',
  reserved:     'border-amber-700/50 bg-amber-950/40 text-amber-400',
  sold:         'border-red-800/50 bg-red-950/40 text-red-400',
  discontinued: 'border-neutral-700 bg-neutral-900 text-neutral-500',
}

export function StatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs ${STYLES[status]}`}>
      {PRODUCT_STATUS_LABELS[status]}
    </span>
  )
}
