import type { Metadata } from 'next';
import { getDiamonds } from '@/lib/data';
import { DiamondSearch } from '@/components/diamond/DiamondSearch';
import type { DiamondShape } from '@/types';

export const metadata: Metadata = {
  title: 'Loose Diamonds — Search Certified Diamonds',
  description:
    'Search thousands of certified loose diamonds by shape, price, carat, cut, color and clarity. Every diamond is independently graded.',
};

export default function DiamondsPage({
  searchParams,
}: {
  searchParams: { shape?: string };
}) {
  const diamonds = getDiamonds();
  const shape = searchParams.shape as DiamondShape | undefined;

  return (
    <div className="bg-ivory">
      <DiamondSearch
        diamonds={diamonds}
        initialShape={shape}
        heading="Loose Diamonds"
        selectLabel="View Diamond"
      />
    </div>
  );
}
