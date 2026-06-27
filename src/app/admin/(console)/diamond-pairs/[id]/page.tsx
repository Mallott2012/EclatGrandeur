import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireStaffRole } from '@/lib/staff';
import { getPairAdmin } from '@/lib/pairs/service';
import { isPairLockingDiamonds, type PairLockInput } from '@/lib/pairs/eligibility';
import { canChangePairConstituents, canDeletePair } from '@/lib/pairs/validation';
import { CUT_LABELS } from '@/lib/diamonds/types';
import { EditPairForm } from '@/components/admin/diamond-pairs/EditPairForm';
import { updatePairAction, publishPairAction, unpublishPairAction, deletePairAction } from './actions';

const G   = '#1a2b1a';
const GBP = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });

export const metadata: Metadata = {
  title: 'Diamond Pair — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
};

interface Props { params: Promise<{ id: string }> }

export default async function DiamondPairDetailPage({ params }: Props) {
  await requireStaffRole([]);
  const { id } = await params;
  const pair    = await getPairAdmin(id);
  if (!pair) notFound();

  const lockInput: PairLockInput = { status: pair.status, is_published: pair.is_published, held_until: pair.held_until };
  const changeDiamonds           = canChangePairConstituents(lockInput);
  const deletable                = canDeletePair(lockInput);

  return (
    <div className="max-w-4xl">
      <div className="px-6 lg:px-14 py-8">
        {/* Breadcrumb */}
        <Link
          href="/admin/diamond-pairs"
          className="mb-6 inline-block font-sans uppercase"
          style={{ fontSize: 9, letterSpacing: '0.28em', color: '#aaa' }}
        >
          ← Diamond Pairs
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display mb-1" style={{ fontSize: 28, fontWeight: 300, letterSpacing: '0.08em', color: G }}>
                {pair.pair_sku}
              </h1>
              <p className="font-sans" style={{ fontSize: 12, color: '#888' }}>
                {(CUT_LABELS as Record<string, string>)[pair.shape] ?? pair.shape}
                {' · '}
                {pair.total_carat.toFixed(2)} ct total
                {' · '}
                {GBP.format(pair.pair_price_gbp)}
              </p>
            </div>
          </div>
        </div>

        <EditPairForm
          pair={pair}
          canChangeDiamonds={changeDiamonds}
          updateAction={updatePairAction}
          publishAction={publishPairAction}
          unpublishAction={unpublishPairAction}
          deleteAction={deletePairAction}
          canDelete={deletable}
        />
      </div>
    </div>
  );
}
