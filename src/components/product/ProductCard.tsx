import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/types/product';
import { CATEGORY_LABELS } from '@/types/common';
import { formatMoney, SHIMMER_BLUR } from '@/lib/utils';

export function ProductCard({ product }: { product: Product }) {
  const image = product.images.find((i) => i.isPrimary) ?? product.images[0];
  const href = `/jewellery/${product.category}/${product.slug}`;
  const isEnquiry = product.purchase.mode === 'enquiry';

  return (
    <Link href={href} className="group flex flex-col">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-ivory-deep">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          placeholder="blur"
          blurDataURL={SHIMMER_BLUR}
          className="object-cover transition-transform duration-700 ease-luxe group-hover:scale-105"
        />
      </div>
      <div className="mt-4 flex flex-col gap-1.5">
        <span className="text-[10px] uppercase tracking-luxe text-champagne-deep">
          {CATEGORY_LABELS[product.category]}
        </span>
        <h3 className="font-display text-xl leading-tight text-ink">{product.name}</h3>
        <p className="text-sm font-light text-ink/60">
          {product.purchase.price
            ? `${product.purchase.priceDisplay === 'from' ? 'From ' : ''}${formatMoney(product.purchase.price)}`
            : 'Price on request'}
        </p>
        {isEnquiry && (
          <span className="text-[10px] uppercase tracking-luxe text-ink/40">
            By appointment
          </span>
        )}
      </div>
    </Link>
  );
}
