import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getDiamondById, getDiamonds } from '@/lib/data';
import { DiamondDetail } from '@/components/diamond/DiamondDetail';
import { DIAMOND_SHAPE_LABELS } from '@/types';

export function generateStaticParams() {
  return getDiamonds().map((d) => ({ id: d.id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const d = getDiamondById(params.id);
  if (!d) return { title: 'Diamond' };
  return {
    title: `${d.carat.toFixed(2)}ct ${DIAMOND_SHAPE_LABELS[d.shape]} Diamond`,
    description: `${d.carat.toFixed(2)} carat ${d.shape} diamond, ${d.colour} color, ${d.clarity} clarity, ${d.cut} cut. ${d.authority} certified.`,
  };
}

export default function DiamondDetailPage({ params }: { params: { id: string } }) {
  const diamond = getDiamondById(params.id);
  if (!diamond) notFound();

  return (
    <div className="bg-ivory">
      <div className="container-luxe py-4 text-[12px] text-ink/50">
        <Link href="/diamonds" className="hover:text-champagne-deep">
          ← Back to diamond search
        </Link>
      </div>
      <DiamondDetail diamond={diamond} />
    </div>
  );
}
