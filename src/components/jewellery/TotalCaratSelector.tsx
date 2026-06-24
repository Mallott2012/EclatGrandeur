'use client';

import { ChevronDown } from 'lucide-react';

const G      = '#1a2b1a';
const BORDER = '#e8e8e8';

const CARAT_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

interface Props {
  /** 'pair' = total is split equally across 2 stones, label shows "2 × Xct" */
  isPair:          boolean;
  selectedCarat:   number | null;
  pricePerCarat:   number;
  onChange:        (carat: number) => void;
}

export function TotalCaratSelector({ isPair, selectedCarat, pricePerCarat, onChange }: Props) {
  return (
    <div>
      {/* Section label */}
      <p
        className="font-sans uppercase mb-4"
        style={{ fontSize: 10, letterSpacing: '0.2em', color: '#aaa' }}
      >
        {isPair ? 'Total Carat Weight (Pair)' : 'Total Carat Weight'}
      </p>

      {/* Carat pills */}
      <div className="flex flex-wrap gap-2">
        {CARAT_OPTIONS.map(ct => {
          const isSelected = selectedCarat === ct;
          const perStone   = isPair ? ct / 2 : ct;
          const price      = Math.round(ct * pricePerCarat);

          return (
            <button
              key={ct}
              type="button"
              onClick={() => onChange(ct)}
              className="flex flex-col items-center justify-center font-sans transition-colors"
              style={{
                width: 72,
                height: 64,
                border: isSelected ? `1.5px solid ${G}` : `1px solid ${BORDER}`,
                backgroundColor: isSelected ? G : '#fff',
                color: isSelected ? '#fff' : G,
              }}
              aria-pressed={isSelected}
              aria-label={`${ct} ct total`}
            >
              <span style={{ fontSize: 14, fontWeight: isSelected ? 400 : 300, letterSpacing: '0.02em' }}>
                {ct}ct
              </span>
              {isPair && (
                <span style={{ fontSize: 9, letterSpacing: '0.06em', opacity: isSelected ? 0.7 : 0.45, marginTop: 2 }}>
                  2 × {perStone}ct
                </span>
              )}
              <span style={{ fontSize: 9, letterSpacing: '0.04em', opacity: isSelected ? 0.65 : 0.4, marginTop: 1 }}>
                £{price.toLocaleString('en-GB')}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected summary */}
      {selectedCarat && (
        <div
          className="mt-4 px-4 py-3 font-sans flex items-center justify-between"
          style={{ backgroundColor: '#f9f9f9', border: `1px solid ${BORDER}` }}
        >
          <span style={{ fontSize: 11, color: '#888', letterSpacing: '0.04em' }}>
            {isPair
              ? `${selectedCarat}ct total · ${selectedCarat / 2}ct per stone · matched pair`
              : `${selectedCarat}ct total`}
          </span>
          <span style={{ fontSize: 12, color: G, fontWeight: 400 }}>
            +£{Math.round(selectedCarat * pricePerCarat).toLocaleString('en-GB')}
          </span>
        </div>
      )}
    </div>
  );
}
