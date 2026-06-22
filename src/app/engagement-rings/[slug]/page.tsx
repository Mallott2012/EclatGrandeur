import { RingDetailPage } from '@/components/engagement/RingDetailPage';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EngagementRingDetailRoute({ params }: Props) {
  const { slug } = await params;
  return <RingDetailPage slug={slug} />;
}

export function generateStaticParams() {
  return [
    { slug: 'eclat-solitaire' },
    { slug: 'lumiere-halo' },
    { slug: 'trilogy-three-stone' },
    { slug: 'eclat-pave' },
    { slug: 'signature-solitaire' },
    { slug: 'constellation-halo' },
    { slug: 'classic-round' },
    { slug: 'vintage-pave' },
    { slug: 'oval-side-stone' },
  ];
}
