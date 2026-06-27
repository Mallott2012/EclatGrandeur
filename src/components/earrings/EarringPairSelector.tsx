'use client';

import { useEffect, useState } from 'react';
import { X, RotateCw } from 'lucide-react';
import { MatchedPairCard } from './MatchedPairCard';
import type { CompatiblePairCard } from '@/lib/earrings/types';

const G      = '#1a2b1a';
const BORDER = '#e8e8e8';

interface Props {
  productId:        string;
  slotKey:          string;
  slotLabel:        string;
  selectedPairId:   string | null;
  disabledPairIds:  Set<string>;
  onSelect:         (pair: CompatiblePairCard) => void;
  onClose:          () => void;
  isSingleSlot:     boolean;
  /** When supplied, the selector shows exactly these curated pairs (already filtered
   *  to the customer's chosen specification) and does not fetch or self-filter. */
  providedPairs?:   CompatiblePairCard[];
  /** Customer-safe summary of the chosen spec, e.g. "Round · D · Flawless · 1.00ct". */
  specSummary?:     string;
}

export function EarringPairSelector({
  productId, slotKey, slotLabel, selectedPairId,
  disabledPairIds, onSelect, onClose, isSingleSlot,
  providedPairs, specSummary,
}: Props) {
  const usingProvided = providedPairs !== undefined;
  const [pairs,   setPairs]   = useState<CompatiblePairCard[] | null>(providedPairs ?? null);
  const [loading, setLoading] = useState(!usingProvided);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (usingProvided) { setPairs(providedPairs ?? []); setLoading(false); return; }
    setLoading(true);
    setError(null);
    fetch(`/api/earrings/${productId}/slots/${slotKey}/pairs`)
      .then(r => r.json())
      .then((data: { pairs?: CompatiblePairCard[]; error?: string }) => {
        if (data.error) throw new Error(data.error);
        setPairs(data.pairs ?? []);
      })
      .catch(() => setError('Could not load available pairs. Please try again.'))
      .finally(() => setLoading(false));
  }, [productId, slotKey, usingProvided, providedPairs]);

  const list = pairs ?? [];
  const heading = isSingleSlot ? 'SELECT YOUR DIAMOND PAIR' : `SELECT ${slotLabel.toUpperCase()}`;

  return (
    <div className="flex flex-col h-full" style={{ color: G }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 flex-shrink-0" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <span className="font-sans uppercase" style={{ fontSize: 10, letterSpacing: '0.22em', color: '#999' }}>{heading}</span>
        <button type="button" onClick={onClose} className="transition-opacity hover:opacity-60">
          <X className="w-4 h-4" style={{ color: '#aaa' }} strokeWidth={1.5} />
        </button>
      </div>

      {/* Spec summary + curated reassurance */}
      <div className="px-6 py-4 flex-shrink-0" style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: '#fafaf9' }}>
        {specSummary && (
          <p className="font-sans" style={{ fontSize: 12, color: G, letterSpacing: '0.04em' }}>{specSummary}</p>
        )}
        <p className="font-sans mt-1" style={{ fontSize: 11, color: '#aaa', lineHeight: 1.5 }}>
          Each pair has been selected and matched for visual harmony.
        </p>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {loading && (
          <div className="flex items-center justify-center h-32">
            <RotateCw className="w-4 h-4 animate-spin" style={{ color: '#ccc' }} strokeWidth={1.5} />
          </div>
        )}

        {error && (
          <p className="font-sans text-center py-8" style={{ fontSize: 12, color: '#aaa' }}>{error}</p>
        )}

        {!loading && !error && list.length === 0 && (
          <p className="font-sans text-center py-8" style={{ fontSize: 12, color: '#aaa' }}>
            No matched pairs are currently available for this specification.
          </p>
        )}

        {!loading && !error && list.map(pair => (
          <MatchedPairCard
            key={pair.id}
            pair={pair}
            selected={pair.id === selectedPairId}
            disabled={disabledPairIds.has(pair.id) && pair.id !== selectedPairId}
            onSelect={onSelect}
          />
        ))}

        {!loading && !error && list.length > 0 && (
          <p className="font-sans text-center mt-6 pb-2" style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.04em' }}>
            {list.length} matched pair{list.length !== 1 ? 's' : ''} available
          </p>
        )}
      </div>
    </div>
  );
}
