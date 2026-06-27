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

function formatCarat(n: number): string {
  return n % 1 === 0 ? `${n}ct` : `${n.toFixed(2)}ct`;
}

function formatPrice(n: number): string {
  return `£${n.toLocaleString('en-GB')}`;
}

export function MatchedPairCard({ pair, selected, onSelect, disabled }: Props) {
  const caratLabel = pair.carat_per_stone
    ? `${formatCarat(pair.carat_per_stone)} per stone · ${formatCarat(pair.total_carat)} total`
    : `${formatCarat(pair.total_carat)} total`;

  const colourLabel = pair.colour_description
    ? pair.colour_description
    : pair.colour
      ? pair.colour
      : null;

  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect(pair)}
      disabled={disabled}
      className="w-full text-left transition-all"
      style={{
        padding:         '14px 16px',
        border:          `1px solid ${selected ? G : BORDER}`,
        backgroundColor: selected ? '#f8f7f5' : '#fff',
        cursor:          disabled ? 'not-allowed' : 'pointer',
        opacity:         disabled ? 0.45 : 1,
        marginBottom:    8,
      }}
    >
      {/* Top row: carat + price */}
      <div className="flex items-baseline justify-between gap-4">
        <span
          className="font-display"
          style={{ fontSize: 15, fontWeight: 300, color: G, letterSpacing: '0.02em' }}
        >
          {caratLabel}
        </span>
        <span
          className="font-sans flex-shrink-0"
          style={{ fontSize: 13, color: G, fontWeight: selected ? 400 : 300 }}
        >
          {formatPrice(pair.pair_price_gbp)}
        </span>
      </div>

      {/* Second row: shape · colour · clarity */}
      <div className="flex flex-wrap items-center gap-x-3 mt-1.5">
        <span className="font-sans" style={{ fontSize: 11, color: '#888', textTransform: 'capitalize' }}>
          {pair.shape}
        </span>
        {colourLabel && (
          <>
            <span style={{ color: '#ddd', fontSize: 11 }}>·</span>
            <span className="font-sans" style={{ fontSize: 11, color: '#888' }}>
              {colourLabel}
            </span>
          </>
        )}
        {pair.clarity && (
          <>
            <span style={{ color: '#ddd', fontSize: 11 }}>·</span>
            <span className="font-sans" style={{ fontSize: 11, color: '#888', textTransform: 'uppercase' }}>
              {pair.clarity}
            </span>
          </>
        )}
      </div>

      {selected && (
        <p
          className="font-sans mt-2"
          style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4a9e6b' }}
        >
          Selected
        </p>
      )}
    </button>
  );
}
