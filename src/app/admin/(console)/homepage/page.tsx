import { requireStaffRole } from '@/lib/staff';
import {
  listAllCollageMedia,
  type HeroPlacement,
  type HeroMediaRecord,
} from '@/lib/hero/service';
import { AdminHomepageEditor } from '@/components/admin/AdminHomepageEditor';

export default async function AdminHomepagePage() {
  await requireStaffRole([]);

  const placements: HeroPlacement[] = [
    'homepage',
    'engagement-rings',
    'necklaces',
    'bracelets',
    'earrings',
  ];

  const results = await Promise.allSettled(
    placements.map(p => listAllCollageMedia(p)),
  );

  const initialRecords = Object.fromEntries(
    placements.map((p, i) => [
      p,
      results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<HeroMediaRecord[]>).value : [],
    ]),
  ) as Record<HeroPlacement, HeroMediaRecord[]>;

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100dvh - 56px)' }}>
      <AdminHomepageEditor initialRecords={initialRecords} />
    </div>
  );
}
