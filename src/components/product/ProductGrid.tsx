import type { Product } from '@/types';
import { ProductCard } from './ProductCard';
import { Reveal } from '@/components/ui/Reveal';

export function ProductGrid({
  products,
  gidPrefix = 'grid',
}: {
  products: Product[];
  gidPrefix?: string;
}) {
  if (products.length === 0) {
    return (
      <p className="py-20 text-center font-light text-ink/50">
        No pieces match your selection. Please adjust your filters.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 md:gap-x-8 lg:grid-cols-4">
      {products.map((p, i) => (
        <Reveal key={p.id} delay={(i % 4) * 0.08}>
          <ProductCard product={p} gid={`${gidPrefix}-${p.id}`} />
        </Reveal>
      ))}
    </div>
  );
}
