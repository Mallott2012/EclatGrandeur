import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requireStaffRole } from '@/lib/staff';
import { listPairsAdmin } from '@/lib/pairs/service';
import { isPairLockingDiamonds } from '@/lib/pairs/eligibility';
import { CUT_LABELS } from '@/lib/diamonds/types';
import type { DiamondPairAdmin } from '@/lib/pairs/types';

const G      = '#1a2b1a';
const BORDER = '#e8e8e8';

const GBP = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });

export const metadata: Metadata = {
  title: 'Diamond Pairs — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
};

export default async function AdminDiamondPairsPage() {
  await requireStaffRole([]);
  const pairs = await listPairsAdmin().catch(() => []);

  return (
    <div className="min-h-screen bg-white" style={{ color: G }}>

      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-6 lg:px-14 py-5"
        style={{ borderBottom: `1px solid ${BORDER}` }}
      >
        <div>
          <h1 className="font-display" style={{ fontSize: 26, fontWeight: 300, letterSpacing: '0.08em', color: G }}>
            Diamond Pairs
          </h1>
          <p className="font-sans mt-0.5" style={{ fontSize: 12, color: '#aaa', letterSpacing: '0.04em' }}>
            {pairs.length} matched pair{pairs.length !== 1 ? 's' : ''} in inventory
          </p>
        </div>
        <Link
          href="/admin/diamond-pairs/new"
          className="flex items-center gap-2 font-sans uppercase"
          style={{ fontSize: 10, letterSpacing: '0.2em', color: G, border: `1px solid ${G}`, padding: '9px 18px' }}
        >
          <Plus className="w-3 h-3" strokeWidth={2} />
          Add Pair
        </Link>
      </div>

      {/* Table */}
      <div className="px-6 lg:px-14 py-10">
        {pairs.length === 0 ? (
          <div className="py-32 text-center">
            <p className="font-sans" style={{ fontSize: 14, color: '#ccc', letterSpacing: '0.06em' }}>
              No diamond pairs in inventory yet.
            </p>
            <Link
              href="/admin/diamond-pairs/new"
              className="inline-flex items-center gap-2 font-sans uppercase mt-6"
              style={{ fontSize: 10, letterSpacing: '0.2em', color: G, border: `1px solid ${G}`, padding: '10px 20px' }}
            >
              <Plus className="w-3 h-3" strokeWidth={2} />
              Create First Pair
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-sans" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {['Pair SKU', 'Shape', 'Total ct', 'ct/stone', 'Colour', 'Clarity', 'Price', 'Status', 'Pub', 'Reservation', 'Updated', ''].map(h => (
                    <th
                      key={h}
                      className="text-left pb-3"
                      style={{ fontSize: 9, letterSpacing: '0.26em', color: '#bbb', textTransform: 'uppercase', paddingRight: 20 }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pairs.map(p => <PairRow key={p.id} pair={p} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function PairRow({ pair }: { pair: DiamondPairAdmin }) {
  const isLocking = isPairLockingDiamonds(pair);
  const reservationLabel = getReservationLabel(pair);

  return (
    <tr style={{ borderBottom: `1px solid ${BORDER}` }} className="transition-colors hover:bg-stone-50">
      <td className="py-4 pr-5 font-mono" style={{ fontSize: 11, color: '#888' }}>{pair.pair_sku}</td>
      <td className="py-4 pr-5" style={{ fontSize: 12, color: G }}>
        {(CUT_LABELS as Record<string, string>)[pair.shape] ?? pair.shape}
      </td>
      <td className="py-4 pr-5" style={{ fontSize: 12, color: G }}>{pair.total_carat.toFixed(2)}</td>
      <td className="py-4 pr-5" style={{ fontSize: 12, color: '#666' }}>
        {pair.carat_per_stone ? pair.carat_per_stone.toFixed(2) : '—'}
      </td>
      <td className="py-4 pr-5" style={{ fontSize: 12, color: '#666' }}>
        {pair.diamond_category === 'coloured'
          ? pair.colour_family ?? pair.colour ?? '—'
          : pair.colour ?? '—'}
      </td>
      <td className="py-4 pr-5" style={{ fontSize: 12, color: '#666' }}>{pair.clarity ?? '—'}</td>
      <td className="py-4 pr-5" style={{ fontSize: 12, color: G, fontWeight: 400 }}>
        {GBP.format(pair.pair_price_gbp)}
      </td>
      <td className="py-4 pr-5">
        <PairStatusBadge status={pair.status} />
      </td>
      <td className="py-4 pr-5">
        <span className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.2em', color: pair.is_published ? '#4a9e6b' : '#aaa' }}>
          {pair.is_published ? 'Live' : 'Draft'}
        </span>
      </td>
      <td className="py-4 pr-5">
        <span className="font-sans" style={{ fontSize: 10, color: isLocking && pair.status === 'reserved' ? '#c9a84c' : '#bbb' }}>
          {reservationLabel}
        </span>
      </td>
      <td className="py-4 pr-5" style={{ fontSize: 11, color: '#bbb' }}>
        {fmtDate(pair.updated_at)}
      </td>
      <td className="py-4 text-right">
        <Link
          href={`/admin/diamond-pairs/${pair.id}`}
          className="font-sans uppercase"
          style={{ fontSize: 10, letterSpacing: '0.16em', color: '#aaa' }}
        >
          View →
        </Link>
      </td>
    </tr>
  );
}

function PairStatusBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    available: { color: '#4a9e6b' },
    reserved:  { color: '#c9a84c' },
    sold:      { color: '#bbb' },
  };
  return (
    <span className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.2em', ...(styles[status] ?? { color: '#999' }) }}>
      {status}
    </span>
  );
}

function getReservationLabel(pair: DiamondPairAdmin): string {
  if (pair.status !== 'reserved' || !pair.held_until) return '—';
  const now    = new Date();
  const expiry = new Date(pair.held_until);
  if (expiry <= now) return 'Expired';
  const mins = Math.round((expiry.getTime() - now.getTime()) / 60000);
  if (mins < 60) return `Held ${mins}m`;
  return `Held ${Math.round(mins / 60)}h`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}
