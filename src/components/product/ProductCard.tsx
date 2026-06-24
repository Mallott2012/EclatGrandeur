import Link from 'next/link';
import type { Product } from '@/types';
import { CATEGORY_LABELS } from '@/types';
import { priceLabel } from '@/lib/utils';
import { JewelArt } from '@/components/art/JewelArt';

export function ProductCard({ product, gid }: { product: Product; gid?: string }) {
  const href = `/product/${product.slug}`;
  const isEnquiry = product.purchase.mode === 'enquiry';

  return (
    <Link href={href} className="group flex flex-col">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-ivory-deep">
        <JewelArt
          art={product.art}
          gid={gid ?? product.id}
          className="h-full w-full transition-transform duration-700 ease-luxe group-hover:scale-[1.04]"
        />
        <div className="with-sheen absolute inset-0" />
        {product.isNew && (
          <span className="absolute left-3 top-3 bg-noir px-2.5 py-1 text-[9px] uppercase tracking-luxe text-ivory">
            New
          </span>
        )}
        {isEnquiry && (
          <span className="absolute right-3 top-3 bg-champagne/90 px-2.5 py-1 text-[9px] uppercase tracking-luxe text-noir">
            Atelier
          </span>
        )}
      </div>
      <div className="mt-4 flex flex-col gap-1.5">
        <span className="text-[10px] uppercase tracking-luxe text-champagne-deep">
          {CATEGORY_LABELS[product.category]}
        </span>
        <h3 className="font-display text-xl leading-tight text-ink transition-colors group-hover:text-champagne-deep">
          {product.name}
        </h3>
        <p className="text-sm font-light text-ink/60">{priceLabel(product.purchase)}</p>
      </div>
    </Link>
  );
}
