import { getFeaturedProducts } from '@/lib/data';
import { ProductGrid } from '@/components/product/ProductGrid';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';

export function FeaturedPieces() {
  const featured = getFeaturedProducts().slice(0, 8);
  return (
    <section className="container-luxe py-20 md:py-28">
      <SectionHeading
        eyebrow="The Edit"
        title="Pieces to be treasured"
        description="A selection of our most coveted designs, each set with diamonds of remarkable fire and life."
        className="mb-14"
      />
      <ProductGrid products={featured} gidPrefix="featured" />
      <div className="mt-14 flex justify-center">
        <Button href="/engagement-rings" variant="outline" size="lg">View All Jewellery</Button>
      </div>
    </section>
  );
}
