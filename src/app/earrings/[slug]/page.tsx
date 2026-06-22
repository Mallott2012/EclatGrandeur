import { JewelleryDetailPage } from '@/components/jewellery/JewelleryDetailPage';
import { EARRING_PRODUCTS, EARRING_FALLBACK } from '@/components/jewellery/earring-data';

interface Props { params: Promise<{ slug: string }>; }

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const product = EARRING_PRODUCTS[slug] ?? EARRING_FALLBACK;
  return (
    <JewelleryDetailPage
      product={product}
      config={{ categoryLabel: 'Earrings', categoryPath: '/earrings' }}
    />
  );
}
