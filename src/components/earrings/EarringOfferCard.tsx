'use client';

import type { PublicEarringOffer } from '@/lib/earrings/offer-types';
import { clarityLabel } from '@/lib/earrings/offer-types';

const G      = '#1a2b1a';
const BORDER = '#e8e8e8';

interface Props {
  offer:    PublicEarringOffer;
  selected: boolean;
  onSelect: () => void;
}

function cutName(cut: string): string {
  const s = cut.toLowerCase();
  if (s === 'round') return 'Round Brilliant';
  return cut.charAt(0).toUpperCase() + cut.slice(1);
}

/** Small diamond glyph — two are shown together so the card reads as a pair. */
function DiamondGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 44 44" aria-hidden="true">
      <g fill="none" stroke="#c9b886" strokeWidth="1.4" strokeLinejoin="round">
        <path d="M9 16 L22 6 L35 16 L22 39 Z" fill="#faf8f3" />
        <path d="M9 16 L35 16" />
      </g>
    </svg>
  );
}

/**
 * Compact matched-pair result card. Matches the engagement-ring DiamondCard
 * dimensions, typography, selection radio and price treatment — but shows two
 * diamonds together and concise pair specification. Selection is by card click
 * (confirmed in the selector footer), exactly like the ring diamond card.
 */
export function EarringOfferCard({ offer, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="text-left flex flex-col"
      style={{
        border: `1px solid ${selected ? G : BORDER}`,
        padding: '14px 13px',
        backgroundColor: selected ? '#f7f9f7' : '#fff',
        transition: 'border-color 0.15s, background-color 0.15s',
        position: 'relative',
      }}
    >
      {/* Selection indicator (matches DiamondCard) */}
      <span style={{
        position: 'absolute', top: 10, right: 10, width: 14, height: 14, borderRadius: '50%',
        border: `1.5px solid ${selected ? G : '#ddd'}`, backgroundColor: selected ? G : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {selected && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#fff', display: 'block' }} />}
      </span>

      {/* Two diamonds together + subtle pair label */}
      <span className="flex items-center gap-2" style={{ marginBottom: 6 }}>
        <span className="flex items-center gap-1"><DiamondGlyph /><DiamondGlyph /></span>
        <span className="font-sans uppercase" style={{ fontSize: 8, letterSpacing: '0.18em', color: '#b08d57' }}>Matched pair</span>
      </span>

      {/* Headline */}
      <span className="font-sans" style={{ fontSize: 12, color: G, fontWeight: 400, lineHeight: 1.4, paddingRight: 20 }}>
        {cutName(offer.cut)} Pair
      </span>

      {/* Carat line */}
      <span className="font-sans mt-1" style={{ fontSize: 11, color: '#888', fontWeight: 300, lineHeight: 1.4 }}>
        {offer.total_carat.toFixed(2)}ct total{offer.carat_per_stone ? ` · ${offer.carat_per_stone.toFixed(2)}ct each` : ''}
      </span>

      {/* Colour · Clarity */}
      <span className="font-sans" style={{ fontSize: 11, color: '#888', fontWeight: 300, lineHeight: 1.4 }}>
        {offer.colour} Colour · {clarityLabel(offer.clarity)} Clarity
      </span>

      {/* Price */}
      <span className="font-sans mt-2" style={{ fontSize: 13, color: G, fontWeight: 400 }}>
        £{offer.price_gbp.toLocaleString('en-GB')}
      </span>

      {offer.availability === 'made_to_order' && (
        <span className="font-sans mt-1" style={{ fontSize: 9, letterSpacing: '0.04em', color: '#b08d57' }}>Available to order</span>
      )}
    </button>
  );
}
