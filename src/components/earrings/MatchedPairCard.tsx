'use client';

import type { CompatiblePairCard } from '@/lib/earrings/types';

const G      = '#1a2b1a';
const BORDER = '#e8e8e8';

interface Props {
  pair:       CompatiblePairCard;
  selected:   boolean;
  onSelect:   (pair: CompatiblePairCard) => void;
  disabled?:  boolean;
}

const CLARITY_LABEL: Record<string, string> = { VS2: 'VS2', VS1: 'VS1', VVS2: 'VVS2', VVS1: 'VVS1', IF: 'IF', FL: 'Flawless' };
const clarityLabel = (c: string) => CLARITY_LABEL[c] ?? c;

function cutName(shape: string): string {
  const s = shape.toLowerCase();
  if (s === 'round') return 'Round Brilliant';
  return shape.charAt(0).toUpperCase() + shape.slice(1);
}
const fmtCt = (n: number) => `${n.toFixed(2)}ct`;
const fmtPrice = (n: number) => `£${n.toLocaleString('en-GB')}`;

/** A single elegant diamond silhouette (used as a clean placeholder where there is
 *  no individual stone media). Two are shown side-by-side to make the pair obvious. */
function DiamondSilhouette() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
      <g fill="none" stroke="#c9b886" strokeWidth="1" strokeLinejoin="round">
        <path d="M9 16 L22 6 L35 16 L22 39 Z" fill="#faf8f3" />
        <path d="M9 16 L35 16" />
        <path d="M15 16 L22 6 M29 16 L22 6" />
        <path d="M9 16 L22 39 M35 16 L22 39 M15 16 L22 39 M29 16 L22 39" />
      </g>
    </svg>
  );
}

export function MatchedPairCard({ pair, selected, onSelect, disabled }: Props) {
  const perStone = pair.carat_per_stone;
  const colour   = pair.colour_description ?? pair.colour ?? null;

  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect(pair)}
      disabled={disabled}
      className="w-full text-left transition-all"
      style={{
        padding: '18px 18px', border: `1px solid ${selected ? G : BORDER}`,
        backgroundColor: selected ? '#f8f7f5' : '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1, marginBottom: 10,
      }}
    >
      {/* Two diamonds, shown together as a matched pair */}
      <div className="flex flex-col items-center" style={{ paddingBottom: 12, borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center" style={{ gap: 14 }}>
          <DiamondSilhouette />
          <DiamondSilhouette />
        </div>
        <span className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.22em', color: '#b08d57', marginTop: 8 }}>
          Matched Diamond Pair
        </span>
      </div>

      {/* Specification */}
      <div className="mt-3">
        <p className="font-display" style={{ fontSize: 15, fontWeight: 300, color: G, letterSpacing: '0.02em' }}>
          Two {cutName(pair.shape)} Diamonds
        </p>
        <p className="font-sans" style={{ fontSize: 12, color: '#666', marginTop: 3 }}>
          {fmtCt(pair.total_carat)} total weight{perStone ? ` · ${fmtCt(perStone)} each` : ''}
        </p>
        {(colour || pair.clarity) && (
          <p className="font-sans" style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
            {colour ? `${colour} Colour` : ''}{colour && pair.clarity ? ' · ' : ''}{pair.clarity ? `${clarityLabel(pair.clarity)} Clarity` : ''}
          </p>
        )}
      </div>

      {/* Price + select */}
      <div className="flex items-center justify-between mt-4">
        <span className="font-sans" style={{ fontSize: 14, color: G, fontWeight: selected ? 400 : 300 }}>
          {fmtPrice(pair.pair_price_gbp)}
        </span>
        <span className="font-sans uppercase" style={{
          fontSize: 10, letterSpacing: '0.18em', padding: '8px 16px',
          backgroundColor: selected ? '#4a9e6b' : G, color: '#fff',
        }}>
          {selected ? 'Selected' : 'Select this pair'}
        </span>
      </div>
    </button>
  );
}
