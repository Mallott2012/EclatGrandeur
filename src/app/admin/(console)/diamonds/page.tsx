import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { listDiamonds } from '@/lib/diamonds/service';
import { isEclatEligible } from '@/lib/diamonds/eligibility';
import { CUT_LABELS, type Diamond, type DiamondStatus } from '@/lib/diamonds/types';

const G      = '#1a2b1a';
const BORDER = '#e8e8e8';

export const metadata: Metadata = {
  title: 'Diamonds — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
};

export default async function AdminDiamondsPage() {
  const diamonds = await listDiamonds().catch(() => []);

  return (
    <div className="min-h-screen bg-white" style={{ color: G }}>

      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-6 lg:px-14 py-5"
        style={{ borderBottom: `1px solid ${BORDER}` }}
      >
        <div>
          <h1
            className="font-display"
            style={{ fontSize: 26, fontWeight: 300, letterSpacing: '0.08em', color: G }}
          >
            Diamond Inventory
          </h1>
          <p className="font-sans mt-0.5" style={{ fontSize: 12, color: '#aaa', letterSpacing: '0.04em' }}>
            {diamonds.length} stone{diamonds.length !== 1 ? 's' : ''} in stock
          </p>
        </div>
        <Link
          href="/admin/diamonds/new"
          className="flex items-center gap-2 font-sans uppercase"
          style={{ fontSize: 10, letterSpacing: '0.2em', color: G, border: `1px solid ${G}`, padding: '9px 18px' }}
        >
          <Plus className="w-3 h-3" strokeWidth={2} />
          Add Diamond
        </Link>
      </div>

      {/* Table */}
      <div className="px-6 lg:px-14 py-10">
        {diamonds.length === 0 ? (
          <div className="py-32 text-center">
            <p className="font-sans" style={{ fontSize: 14, color: '#ccc', letterSpacing: '0.06em' }}>
              No diamonds in inventory yet.
            </p>
            <Link
              href="/admin/diamonds/new"
              className="inline-flex items-center gap-2 font-sans uppercase mt-6"
              style={{ fontSize: 10, letterSpacing: '0.2em', color: G, border: `1px solid ${G}`, padding: '10px 20px' }}
            >
              <Plus className="w-3 h-3" strokeWidth={2} />
              Add First Diamond
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-sans" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {['SKU', 'Type', 'Cut', 'Carat', 'Colour', 'Clarity', 'Price', 'Status', 'Éclat', ''].map(h => (
                    <th
                      key={h}
                      className="text-left pb-3"
                      style={{ fontSize: 9, letterSpacing: '0.26em', color: '#bbb', textTransform: 'uppercase', paddingRight: 24 }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {diamonds.map(d => {
                  const eligible = isEclatEligible(d);
                  return (
                    <tr
                      key={d.id}
                      style={{ borderBottom: `1px solid ${BORDER}` }}
                      className="transition-colors hover:bg-stone-50"
                    >
                      <td className="py-4 pr-6 font-mono" style={{ fontSize: 11, color: '#aaa' }}>{d.sku}</td>
                      <td className="py-4 pr-6" style={{ fontSize: 11, color: '#888' }}>
                        {d.diamond_category === 'coloured'
                          ? <span style={{ color: '#c9a84c' }}>Coloured</span>
                          : 'White'}
                      </td>
                      <td className="py-4 pr-6" style={{ fontSize: 13, color: G }}>{CUT_LABELS[d.cut]}</td>
                      <td className="py-4 pr-6" style={{ fontSize: 13, color: G }}>{d.carat.toFixed(2)}ct</td>
                      <td className="py-4 pr-6" style={{ fontSize: 13, color: '#666' }}>
                        {d.diamond_category === 'coloured'
                          ? (d.colour_family ? d.colour_family.charAt(0).toUpperCase() + d.colour_family.slice(1) : '—')
                          : d.colour}
                      </td>
                      <td className="py-4 pr-6" style={{ fontSize: 13, color: '#666' }}>{d.clarity}</td>
                      <td className="py-4 pr-6" style={{ fontSize: 13, color: G, fontWeight: 400 }}>
                        {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(d.price_gbp)}
                      </td>
                      <td className="py-4 pr-6">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="py-4 pr-6">
                        <EligibilityBadge eligible={eligible} />
                      </td>
                      <td className="py-4 text-right">
                        <Link
                          href={`/admin/diamonds/${d.id}`}
                          className="font-sans uppercase"
                          style={{ fontSize: 10, letterSpacing: '0.16em', color: '#aaa' }}
                        >
                          Edit →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: DiamondStatus }) {
  const styles: Record<string, React.CSSProperties> = {
    available: { color: '#4a9e6b' },
    sold:      { color: '#bbb'    },
    reserved:  { color: '#c9a84c' },
  };
  return (
    <span className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.2em', ...(styles[status] ?? { color: '#999' }) }}>
      {status}
    </span>
  );
}

function EligibilityBadge({ eligible }: { eligible: boolean }) {
  return (
    <span className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.16em', color: eligible ? '#4a9e6b' : '#c9a84c' }}>
      {eligible ? '✓' : '—'}
    </span>
  );
}

// Suppress unused import warning — Diamond type used in the table row
export type { Diamond };
