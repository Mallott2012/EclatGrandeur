import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { Product } from '@/types';
import { CATEGORY_LABELS } from '@/types';
import { priceLabel } from '@/lib/utils';
import { DiamondViewer } from './DiamondViewer';
import { BuyOrEnquire } from './BuyOrEnquire';
import { TrustBadges } from './TrustBadges';
import { Accordion } from '@/components/ui/Accordion';
import { ProductGrid } from './ProductGrid';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Divider } from '@/components/ui/Divider';
import { getProductsBySlugs } from '@/lib/data';

const CATEGORY_HREF: Record<string, string> = {
  'engagement-rings': '/engagement-rings',
  earrings: '/earrings',
  necklaces: '/necklaces',
  bracelets: '/bracelets',
  'wedding-bands': '/wedding-bands',
  'high-jewellery': '/high-jewellery',
};

export function ProductDetail({ product }: { product: Product }) {
  const related = getProductsBySlugs(product.related ?? []);
  const cert = product.certification;

  return (
    <div className="container-luxe py-10 md:py-14">
      {/* breadcrumb */}
      <nav className="mb-8 flex items-center gap-1.5 text-[11px] uppercase tracking-luxe text-ink/40">
        <Link href="/" className="hover:text-ink">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={CATEGORY_HREF[product.category]} className="hover:text-ink">{CATEGORY_LABELS[product.category]}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-ink/70">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Left — viewer */}
        <div className="lg:sticky lg:top-40 lg:self-start">
          <DiamondViewer art={product.art} metals={product.metals} gid={product.id} />
        </div>

        {/* Right — info */}
        <div className="flex flex-col">
          <span className="eyebrow">{CATEGORY_LABELS[product.category]}</span>
          <h1 className="mt-3 font-display text-4xl font-light leading-tight md:text-5xl">{product.name}</h1>
          <p className="mt-4 text-base font-light leading-relaxed text-ink/65">{product.description}</p>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-display text-3xl text-ink">{priceLabel(product.purchase)}</span>
            {product.purchase.priceDisplay === 'from' && (
              <span className="text-[11px] uppercase tracking-luxe text-ink/40">excl. centre stone options</span>
            )}
          </div>

          <div className="mt-8">
            <BuyOrEnquire product={product} />
          </div>

          <div className="mt-8">
            <TrustBadges />
          </div>

          <div className="mt-8">
            <Accordion
              items={[
                { title: 'The Story', content: <p>{product.details}</p> },
                {
                  title: 'Specifications',
                  content: (
                    <dl className="grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2">
                      {Object.entries(product.specs).map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-4 border-b border-ink/5 py-1.5">
                          <dt className="text-ink/50">{k}</dt>
                          <dd className="text-right text-ink/80">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  ),
                },
                ...(cert
                  ? [
                      {
                        title: 'Certification & Provenance',
                        content: (
                          <div className="flex flex-col gap-2">
                            <p>
                              Independently graded by <strong className="font-medium text-ink">{cert.authority}</strong>
                              {cert.reportNumber ? `, report ${cert.reportNumber}.` : '.'}
                            </p>
                            <p>
                              {cert.ethical.conflictFree && 'Conflict-free. '}
                              {cert.ethical.traceable && 'Fully traceable. '}
                              {cert.ethical.origin ? `Origin: ${cert.ethical.origin}.` : ''}
                            </p>
                          </div>
                        ),
                      },
                    ]
                  : []),
                {
                  title: 'Delivery & Returns',
                  content: (
                    <p>
                      Complimentary insured delivery worldwide, presented in our signature case.
                      30-day returns on in-stock pieces. Bespoke and made-to-order commissions are final sale.
                    </p>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <Divider className="mb-10" />
          <SectionHeading eyebrow="You May Also Admire" title="Complete the Look" className="mb-12" />
          <ProductGrid products={related} gidPrefix={`rel-${product.id}`} />
        </section>
      )}
    </div>
  );
}
