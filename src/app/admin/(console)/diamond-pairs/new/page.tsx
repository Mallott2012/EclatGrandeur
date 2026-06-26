import type { Metadata } from 'next';
import Link from 'next/link';
import { requireStaffRole } from '@/lib/staff';
import { listDiamonds } from '@/lib/diamonds/service';
import { isDiamondInActivePair } from '@/lib/pairs/service';
import { CreatePairForm } from '@/components/admin/diamond-pairs/CreatePairForm';
import { createPairAction } from '../actions';

const G = '#1a2b1a';

export const metadata: Metadata = {
  title: 'New Diamond Pair — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
};

export default async function NewDiamondPairPage() {
  await requireStaffRole([]);

  const allDiamonds = await listDiamonds().catch(() => []);

  // Build lockState: diamondId → isLockedByActivePair
  const lockStateEntries = await Promise.all(
    allDiamonds.map(async d => {
      const locked = await isDiamondInActivePair(d.id).catch(() => false);
      return [d.id, locked] as [string, boolean];
    })
  );
  const lockState = Object.fromEntries(lockStateEntries);

  return (
    <div className="max-w-5xl">
      <div className="px-6 lg:px-14 py-8">
        <Link
          href="/admin/diamond-pairs"
          className="mb-6 inline-block font-sans uppercase"
          style={{ fontSize: 9, letterSpacing: '0.28em', color: '#aaa' }}
        >
          ← Diamond Pairs
        </Link>

        <h1 className="font-display mb-8" style={{ fontSize: 28, fontWeight: 300, letterSpacing: '0.08em', color: G }}>
          Create Diamond Pair
        </h1>

        <CreatePairForm
          diamonds={allDiamonds}
          lockState={lockState}
          createAction={createPairAction}
        />
      </div>
    </div>
  );
}
