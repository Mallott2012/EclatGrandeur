import { JewelleryDetailPage } from '@/components/jewellery/JewelleryDetailPage';
import { NECKLACE_PRODUCTS, NECKLACE_FALLBACK } from '@/components/jewellery/necklace-data';

interface Props { params: Promise<{ slug: string }>; }

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const product = NECKLACE_PRODUCTS[slug] ?? NECKLACE_FALLBACK;
  return (
    <JewelleryDetailPage
      product={product}
      config={{ categoryLabel: 'Necklaces', categoryPath: '/necklaces' }}
    />
  );
}
