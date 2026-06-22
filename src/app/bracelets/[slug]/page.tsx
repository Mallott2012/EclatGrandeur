import { JewelleryDetailPage } from '@/components/jewellery/JewelleryDetailPage';
import { BRACELET_PRODUCTS, BRACELET_FALLBACK } from '@/components/jewellery/bracelet-data';

interface Props { params: Promise<{ slug: string }>; }

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const product = BRACELET_PRODUCTS[slug] ?? BRACELET_FALLBACK;
  return (
    <JewelleryDetailPage
      product={product}
      config={{ categoryLabel: 'Bracelets', categoryPath: '/bracelets' }}
    />
  );
}
